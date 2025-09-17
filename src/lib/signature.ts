import { supabase } from './supabase'

const BUCKET = 'signatures'

export async function requireUser() {
	const { data: { user }, error } = await supabase.auth.getUser()
	if (error || !user) throw new Error('Non authentifié')
	return user
}

export async function fetchCurrentSignaturePath() {
	const user = await requireUser()
	const { data, error } = await supabase
		.from('users')
		.select('signatures')
		.eq('auth_user_id', user.id)
		.single()
	if (error) throw error
	return data?.signatures as string | null
}

export async function getSignedSignatureUrl() {
	const path = await fetchCurrentSignaturePath()
	if (!path) return null
	const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600)
	if (error) throw error
	return data.signedUrl
}

export async function uploadSignature(file: File) {
	if (!file.type.startsWith('image/')) throw new Error('Type de fichier invalide')
	if (file.size > 1_000_000) throw new Error('Fichier trop volumineux (max 1 Mo)')

	const user = await requireUser()
	const path = `${user.id}/signature.png` // normalisation PNG

	const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
		cacheControl: '0',
		upsert: true,
		contentType: file.type || 'image/png'
	})
	if (upErr) throw upErr

	const { error: updErr } = await supabase
		.from('users')
		.update({ signatures: path })
		.eq('auth_user_id', user.id)
	if (updErr) throw updErr

	return path
}

export async function deleteSignature() {
	const user = await requireUser()
	const path = `${user.id}/signature.png`
	const { error } = await supabase.storage.from(BUCKET).remove([path])
	if (error) throw error

	const { error: updErr } = await supabase
		.from('users')
		.update({ signatures: null })
		.eq('auth_user_id', user.id)
	if (updErr) throw updErr
}