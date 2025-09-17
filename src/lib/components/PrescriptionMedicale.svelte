<script lang="ts">
	import { onMount } from 'svelte';
	import TinyMCEEditor from './TinyMCEEditor.svelte';
	import { supabase } from '$lib/supabase';
	import type { AIRecommendationResponse } from '$lib/types/ai';
	
	let {
		submission = null,
		aiResponse = null
	}: {
		submission: any;
		aiResponse: AIRecommendationResponse | null;
	} = $props();

	let editorRef: TinyMCEEditor;
	let content = $state('');

	let doctorInfo = $state({
		name: 'Dr. [Nom du médecin]',
		specialty: 'Médecin prescripteur',
		rpps: '[RPPS]',
		address: '[Adresse du cabinet]',
		phone: '[Téléphone]',
		email: '[Email]',
		signature: '',
		signatureUrl: ''
	});

	let patientInfo = $state({
		name: '[Nom du patient]',
		birthDate: '[Date de naissance]'
	});

	let documentDate = new Date().toLocaleDateString('fr-FR');

	function generatePrescriptionContent() {
		if (!aiResponse) {
			return `
				<div style="text-align: center; margin: 2rem 0;">
					<p style="color: #666; font-style: italic;">En attente des recommandations IA...</p>
					<p style="color: #666; font-size: 14px;">Veuillez d'abord soumettre le questionnaire pour générer la prescription.</p>
				</div>
			`;
		}

		const date = new Date().toLocaleDateString('fr-FR');

		return `
			<!-- En-tête -->
			<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
				<div style="border: 2px solid #000; padding: 15px; width: 45%; font-size: 11px; line-height: 1.4;">
					<strong>${doctorInfo.name}</strong><br/>
					Spécialité : ${doctorInfo.specialty}<br/>
					RPPS : ${doctorInfo.rpps}<br/>
					Adresse : ${doctorInfo.address}<br/>
					Téléphone : ${doctorInfo.phone}<br/>
					Mail : ${doctorInfo.email}
				</div>
				<div style="border: 2px solid #000; padding: 15px; width: 45%; font-size: 11px; line-height: 1.4;">
					<strong>${patientInfo.name}</strong><br/><br/>
					Date de naissance ${patientInfo.birthDate}
				</div>
			</div>
			<div style="text-align: right; margin-bottom: 20px; font-size: 12px;">
				Le ${date}
			</div>
			
			<!-- Titre centré -->
			<div style="text-align: center; margin-bottom: 1.5rem;">
				<h1 style="font-size: 16px; font-weight: 700;">PRESCRIPTION D'ACTIVITÉ PHYSIQUE ADAPTÉE</h1>
			</div>

			<!-- Alertes block si présent -->
			${aiResponse.alertes_block ? `
				<div style="border: 2px solid #ff6b6b; background-color: #ffe0e0; padding: 1rem; margin-bottom: 1.5rem; border-radius: 8px;">
					<div style="font-size: 12px; line-height: 1.4; color: #d63031;">
						${aiResponse.alertes_block.replace(/\n/g, '<br/>')}
					</div>
				</div>
			` : ''}

			<!-- Page 1 - Prescription complète -->
			${aiResponse.ordonnance ? `
				<div style="font-size: 11px; line-height: 1.4; white-space: pre-line;">
					${aiResponse.ordonnance.replace(/\n/g, '<br/>')}
				</div>
			` : `
				<!-- Fallback: construction manuelle si ordonnance n'est pas disponible -->
				<p style="margin: 1rem 0; font-size: 12px;">Je prescris une activité physique et/ou sportive adaptée.<br/>
				Pendant <strong>6 mois</strong>, à adapter en fonction de l'évolution des aptitudes du patient.</p>

				<!-- Programme personnalisé basé sur l'IA -->
				${aiResponse.programme_perso ? `
					<div style="margin-bottom: 1rem;">
						<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Endurance</p>
						<div style="font-size: 11px; line-height: 1.4; padding-left: 1rem;">
							${aiResponse.programme_perso.endurance.replace(/\n/g, '<br/>')}
						</div>
					</div>
					
					<div style="margin-bottom: 1rem;">
						<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Renforcement musculaire</p>
						<div style="font-size: 11px; line-height: 1.4; padding-left: 1rem;">
							${aiResponse.programme_perso.renforcement.replace(/\n/g, '<br/>')}
						</div>
					</div>
					
					<div style="margin-bottom: 1rem;">
						<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Étirements</p>
						<div style="font-size: 11px; line-height: 1.4; padding-left: 1rem;">
							${aiResponse.programme_perso.etirements.replace(/\n/g, '<br/>')}
						</div>
					</div>
					
					${aiResponse.programme_perso.equilibre && aiResponse.programme_perso.equilibre !== '—' ? `
						<div style="margin-bottom: 1rem;">
							<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Équilibre / coordination / proprioception</p>
							<div style="font-size: 11px; line-height: 1.4; padding-left: 1rem;">
								${aiResponse.programme_perso.equilibre.replace(/\n/g, '<br/>')}
							</div>
						</div>
					` : ''}
				` : ''}

				<div style="margin-top: 2rem; font-size: 10px;">
					<p><strong>Médecin prescripteur :</strong> ${doctorInfo.name}</p>
					<p><strong>Spécialité :</strong> ${doctorInfo.specialty}</p>
					<p><strong>Date de prescription :</strong> ${documentDate}</p>
				</div>

				<!-- Signature du médecin -->
				<div style="margin-top: 2rem; text-align: right;">
					<div style="margin-bottom: 1rem;">
						<p style="font-size: 11px; font-weight: 600; margin-bottom: 0.5rem;">Signature du médecin prescripteur :</p>
						${doctorInfo.signatureUrl ? `
							<img src="${doctorInfo.signatureUrl}" alt="Signature" style="max-height: 60px; max-width: 200px; object-contain: contain;" />
						` : `
							<div style="border: 1px solid #ccc; padding: 1rem; width: 200px; height: 60px; display: inline-block; text-align: center; background-color: #f9f9f9;">
								<p style="font-size: 10px; color: #666; margin: 0; line-height: 60px;">Signature électronique</p>
							</div>
						`}
					</div>
					<p style="font-size: 10px; margin: 0;">${doctorInfo.name}</p>
				</div>
			`}
		`;
	}

	async function loadDoctorSignature() {
		if (!doctorInfo.signature) return;
		
		try {
			// Créer une URL signée pour afficher l'image
			const { data, error } = await supabase.storage
				.from('signatures')
				.createSignedUrl(doctorInfo.signature, 600); // 10 minutes
			
			if (!error && data?.signedUrl) {
				doctorInfo.signatureUrl = data.signedUrl;
			}
		} catch (err) {
			console.warn('Erreur chargement signature:', err);
		}
	}

	onMount(async () => {
		// Récupérer les infos du médecin connecté
		const authUser = (await supabase.auth.getUser()).data.user;
		if (authUser) {
			const { data } = await supabase
				.from('users')
				.select('*')
				.eq('auth_user_id', authUser.id)
				.single();
			if (data) {
				doctorInfo.name = `Dr. ${data.first_name} ${data.last_name}`;
				if (data.rpps) doctorInfo.rpps = data.rpps;
				if (data.address) doctorInfo.address = data.address;
				if (data.phone) doctorInfo.phone = data.phone;
				if (data.email) doctorInfo.email = data.email;
				if (data.signature) {
					doctorInfo.signature = data.signature;
					await loadDoctorSignature();
				}
			}
		}
		
		// Récupérer les infos du patient
		if (submission?.patient_info) {
			const p = submission.patient_info;
			if (p.firstName || p.lastName) {
				patientInfo.name = `${p.gender === 'male' ? 'M' : 'Mme'} ${p.lastName || ''}, ${p.firstName || ''}`;
			}
			if (p.birthDate) {
				patientInfo.birthDate = new Date(p.birthDate).toLocaleDateString('fr-FR');
			}
		}
		
		content = generatePrescriptionContent();
	});

	$effect(() => {
		content = generatePrescriptionContent();
	});

	// Recharger la signature quand nécessaire
	$effect(() => {
		if (doctorInfo.signature && !doctorInfo.signatureUrl) {
			loadDoctorSignature();
		}
	});
</script>

<style>
	.prescription-container {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.prescription-header {
		text-align: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.prescription-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #003087;
		margin-bottom: 0.5rem;
	}
</style>

<div class="prescription-container">
	<div class="prescription-header">
		<h2 class="prescription-title">Prescription d'Activité Physique Adaptée</h2>
		<p style="color: #6b7280;">Patient : {patientInfo.name} • Date : {documentDate}</p>
	</div>

	<TinyMCEEditor
		bind:this={editorRef}
		{content}
		minHeight={800}
		placeholder="Prescription en cours de génération..."
	/>
</div>