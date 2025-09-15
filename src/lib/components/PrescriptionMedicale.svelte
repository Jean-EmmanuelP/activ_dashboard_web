<script lang="ts">
	import { onMount } from 'svelte';
	import TinyMCEEditor from './TinyMCEEditor.svelte';

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

	// Extraction des vraies données
	let doctorInfo = $derived({
		name: submission?.submitted_by_user_id ? 'Dr. [Nom du médecin]' : 'Dr. [Nom non défini]',
		specialty: 'Médecin prescripteur',
		rpps: '[RPPS]',
		address: '[Adresse du cabinet]',
		phone: '[Téléphone]',
		email: '[Email]'
	});

	let patientInfo = $derived({
		name: submission?.patient_info?.nom ? `${submission.patient_info.prenom || ''} ${submission.patient_info.nom}`.trim() : '[Nom du patient]',
		birthDate: submission?.patient_info?.date_naissance || '[Date de naissance]'
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

		return `
			<div style="text-align: center; margin-bottom: 1.5rem;">
				<h1 style="font-size: 16px; font-weight: 700;">PRESCRIPTION D'ACTIVITÉ PHYSIQUE ADAPTÉE</h1>
			</div>

			<div style="margin-bottom: 1rem; font-size: 12px;">
				<p><strong>Patient :</strong> ${patientInfo.name}</p>
				<p><strong>Date de naissance :</strong> ${patientInfo.birthDate}</p>
				<p><strong>Date :</strong> ${documentDate}</p>
			</div>

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
				
				${aiResponse.programme_perso.equilibre ? `
					<div style="margin-bottom: 1rem;">
						<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Équilibre</p>
						<div style="font-size: 11px; line-height: 1.4; padding-left: 1rem;">
							${aiResponse.programme_perso.equilibre.replace(/\n/g, '<br/>')}
						</div>
					</div>
				` : ''}
			` : ''}

			<!-- Planification personnalisée -->
			${aiResponse.planification ? `
				<div style="margin-bottom: 1rem;">
					<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Planification</p>
					<div style="font-size: 11px; line-height: 1.4; padding-left: 1rem;">
						${aiResponse.planification.replace(/\n/g, '<br/>')}
					</div>
				</div>
			` : ''}

			<!-- Conseils personnalisés -->
			${aiResponse.conseils && aiResponse.conseils.length > 0 ? `
				<div style="margin-bottom: 1.5rem;">
					<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Conseils pratiques</p>
					<ul style="font-size: 11px; line-height: 1.4;">
						${aiResponse.conseils.map(conseil => `<li>${conseil}</li>`).join('')}
					</ul>
				</div>
			` : ''}

			<!-- Bénéfices attendus -->
			${aiResponse.benefices && aiResponse.benefices.length > 0 ? `
				<div style="margin-bottom: 1.5rem;">
					<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Bénéfices attendus</p>
					<ul style="font-size: 11px; line-height: 1.4;">
						${aiResponse.benefices.map(benefice => `<li>${benefice}</li>`).join('')}
					</ul>
				</div>
			` : ''}

			<!-- Orientations -->
			${aiResponse.orientation && aiResponse.orientation.length > 0 ? `
				<div style="margin-bottom: 1.5rem;">
					<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Orientations recommandées</p>
					<ul style="font-size: 11px; line-height: 1.4;">
						${aiResponse.orientation.map(orient => `<li>${orient}</li>`).join('')}
					</ul>
				</div>
			` : ''}

			<!-- Contre-indications -->
			${aiResponse.contraindications && aiResponse.contraindications.length > 0 ? `
				<div style="margin-bottom: 1.5rem;">
					<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">Contre-indications et précautions</p>
					<ul style="font-size: 11px; line-height: 1.4;">
						${aiResponse.contraindications.map(contra => `<li>${contra}</li>`).join('')}
					</ul>
				</div>
			` : ''}

			<div style="margin-top: 2rem; font-size: 10px;">
				<p><strong>Médecin prescripteur :</strong> ${doctorInfo.name}</p>
				<p><strong>Spécialité :</strong> ${doctorInfo.specialty}</p>
				<p><strong>Date de prescription :</strong> ${documentDate}</p>
			</div>
		`;
	}

	onMount(() => {
		content = generatePrescriptionContent();
	});

	$effect(() => {
		content = generatePrescriptionContent();
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