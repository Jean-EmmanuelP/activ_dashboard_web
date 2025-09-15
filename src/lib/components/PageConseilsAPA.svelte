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
		email: '[Email]'
	});

	let patientInfo = $state({
		name: '[Nom du patient]',
		birthDate: '[Date de naissance]'
	});

	function generateConseilsContent() {
		if (!aiResponse) {
			return `
				<div style="text-align: center; margin: 2rem 0;">
					<p style="color: #666; font-style: italic;">En attente des recommandations IA...</p>
					<p style="color: #666; font-size: 14px;">Veuillez d'abord soumettre le questionnaire pour générer les conseils personnalisés.</p>
				</div>
			`;
		}

		const patient = submission?.patient_info || {};
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
			
			<!-- Conseils personnalisés de l'IA -->
			${aiResponse.conseils && aiResponse.conseils.length > 0 ? `
				<div style="page-break-before: always;">
					<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Conseils pratiques personnalisés</p>
					<ul style="list-style-type: none; padding-left: 1rem; font-size: 11px; line-height: 1.4;">
						${aiResponse.conseils.map(conseil => `<li>- ${conseil.replace(/^[^\w]*/, '')}</li>`).join('')}
					</ul>
				</div>
			` : ''}

			<!-- Bénéfices attendus de l'IA -->
			${aiResponse.benefices && aiResponse.benefices.length > 0 ? `
				<div style="margin-bottom: 1rem;">
					<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Bénéfices attendus</p>
					<ul style="list-style-type: none; padding-left: 1rem; font-size: 11px; line-height: 1.4;">
						${aiResponse.benefices.map(benefice => `<li>- ${benefice}</li>`).join('')}
					</ul>
				</div>
			` : ''}

			<!-- Objectifs personnalisés -->
			${aiResponse.objectifs && aiResponse.objectifs.length > 0 ? `
				<div style="margin-bottom: 1rem;">
					<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Objectifs personnalisés</p>
					<ul style="list-style-type: none; padding-left: 1rem; font-size: 11px; line-height: 1.4;">
						${aiResponse.objectifs.map(objectif => `<li>- ${objectif}</li>`).join('')}
					</ul>
				</div>
			` : ''}

			<!-- Planification personnalisée de l'IA -->
			${aiResponse.planification ? `
				<div style="margin-bottom: 1rem;">
					<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Planification personnalisée</p>
					<div style="font-size: 11px; line-height: 1.4; padding-left: 1rem;">
						${aiResponse.planification.replace(/\n/g, '<br/>')}
					</div>
				</div>
			` : ''}

			<!-- Programme personnalisé détaillé -->
			${aiResponse.programme_perso ? `
				<div style="margin-bottom: 1rem;">
					<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Programme personnalisé détaillé</p>
					
					<div style="margin-bottom: 1rem;">
						<p style="font-weight: 600; margin-bottom: 0.3rem; font-size: 11px; color: #003087;">Endurance :</p>
						<div style="font-size: 10px; line-height: 1.3; padding-left: 1rem;">
							${aiResponse.programme_perso.endurance.replace(/\n/g, '<br/>')}
						</div>
					</div>
					
					<div style="margin-bottom: 1rem;">
						<p style="font-weight: 600; margin-bottom: 0.3rem; font-size: 11px; color: #003087;">Renforcement musculaire :</p>
						<div style="font-size: 10px; line-height: 1.3; padding-left: 1rem;">
							${aiResponse.programme_perso.renforcement.replace(/\n/g, '<br/>')}
						</div>
					</div>
					
					<div style="margin-bottom: 1rem;">
						<p style="font-weight: 600; margin-bottom: 0.3rem; font-size: 11px; color: #003087;">Étirements :</p>
						<div style="font-size: 10px; line-height: 1.3; padding-left: 1rem;">
							${aiResponse.programme_perso.etirements.replace(/\n/g, '<br/>')}
						</div>
					</div>
					
					${aiResponse.programme_perso.equilibre ? `
						<div style="margin-bottom: 1rem;">
							<p style="font-weight: 600; margin-bottom: 0.3rem; font-size: 11px; color: #003087;">Équilibre :</p>
							<div style="font-size: 10px; line-height: 1.3; padding-left: 1rem;">
								${aiResponse.programme_perso.equilibre.replace(/\n/g, '<br/>')}
							</div>
						</div>
					` : ''}
				</div>
			` : ''}

			<!-- Contre-indications et précautions -->
			${aiResponse.contraindications && aiResponse.contraindications.length > 0 ? `
				<div style="margin-bottom: 1rem;">
					<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Contre-indications et précautions</p>
					<ul style="list-style-type: none; padding-left: 1rem; font-size: 11px; line-height: 1.4;">
						${aiResponse.contraindications.map(contra => `<li>- ${contra}</li>`).join('')}
					</ul>
				</div>
			` : ''}

			<div style="page-break-before: always; margin-top: 50px;">
				<div style="text-align: right; margin-bottom: 20px; font-size: 12px;">
				Le ${date}
				</div>
				
				<h1 style="text-align: center; font-size: 16px; font-weight: 700; margin-bottom: 2rem;">PRESCRIPTION D'ACTIVITÉ PHYSIQUE ADAPTÉE</h1>
				
				<!-- Orientations personnalisées de l'IA -->
				${aiResponse.orientation && aiResponse.orientation.length > 0 ? `
					<div style="margin-bottom: 1rem;">
						<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Orientations recommandées</p>
						<ul style="list-style: none; padding-left: 1rem; font-size: 11px; line-height: 1.4;">
							${aiResponse.orientation.map(orient => `<li style="margin-bottom: 0.5rem;">- ${orient}</li>`).join('')}
						</ul>
					</div>
				` : ''}

				<div style="margin-top: 1.5rem; padding-top: 1rem;">
					<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Informations importantes</p>
					<ul style="list-style: none; padding-left: 1rem; font-size: 10px; line-height: 1.3;">
						<li style="margin-bottom: 0.5rem; font-style: italic;">- Ces recommandations sont personnalisées en fonction de votre profil et de vos réponses au questionnaire.</li>
						<li style="margin-bottom: 0.5rem; font-style: italic;">- Le sport sur ordonnance avec des enseignants en activité physique adaptée n'est pas remboursé par la Sécurité sociale ; certaines mutuelles le prennent en charge.</li>
						<li style="margin-bottom: 0.5rem; font-style: italic;">- En cas de doute ou de symptôme inhabituel, consultez votre médecin avant de débuter ou continuer l'activité.</li>
					</ul>
				</div>
			</div>
		`;
	}

	onMount(async () => {
		// Récupérer les infos du médecin connecté
		const authUser = (await supabase.auth.getUser()).data.user;
		if (authUser) {
			const { data } = await supabase
				.from('users')
				.select('*')
				.eq('email', authUser.email)
				.single();
			if (data) {
				doctorInfo.name = `Dr. ${data.first_name} ${data.last_name}`;
				if (data.rpps) doctorInfo.rpps = data.rpps;
				if (data.address) doctorInfo.address = data.address;
				if (data.phone) doctorInfo.phone = data.phone;
				if (data.email) doctorInfo.email = data.email;
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
		
		content = generateConseilsContent();
	});

	// Mettre à jour le contenu quand aiResponse change
	$effect(() => {
		content = generateConseilsContent();
	});

	function handlePrint() {
		window.print();
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');

	.conseils-container {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.conseils-header {
		text-align: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.conseils-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #003087;
		margin-bottom: 0.5rem;
	}

	/* Print Styles */
	@media print {
		.conseils-container {
			box-shadow: none !important;
			border-radius: 0 !important;
		}

		:global(.tox-tinymce),
		:global(.tox-editor-header) {
			display: none !important;
		}

		:global(.mce-content-body) {
			padding: 0 !important;
		}
	}
</style>

<div class="conseils-container">
	<div class="conseils-header">
		<h2 class="conseils-title">Conseils d'Activité Physique Adaptée</h2>
		<p style="color: #6b7280;">Patient : {patientInfo.name} • Date : {new Date().toLocaleDateString('fr-FR')}</p>
	</div>

	<TinyMCEEditor
		bind:this={editorRef}
		bind:content={content}
		minHeight={800}
		placeholder="Conseils en cours de génération..."
	/>
</div>