<script lang="ts">
	import type { AIRecommendation } from '$lib/services/vertexAI';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	
	let {
		aiResponse,
		submissionId,
		patientAnswers = {},
		onUpdate,
		onBack,
		onPrint,
		onEmail
	}: {
		aiResponse: AIRecommendation;
		submissionId: string;
		patientAnswers?: any;
		onUpdate?: (response: AIRecommendation) => void;
		onBack?: () => void;
		onPrint?: () => void;
		onEmail?: () => void;
	} = $props();

	// État
	let currentSection = $state('patient');
	let showFeedback = $state(false);
	let feedbackRating = $state<'satisfied' | 'unsatisfied' | null>(null);
	let feedbackComment = $state('');
	
	// Informations éditables
	let doctorInfo = $state({
		name: 'Dr. _____________',
		address: '_____________',
		phone: '_____________',
		email: '_____________',
		specialty: 'Médecine du Sport',
		rpps: '_____________'
	});

	let patientInfo = $state({
		name: 'M/Mme _____________',
		birthDate: '__ / __ / ____',
		address: '_____________',
		city: '_____________'
	});

	let prescriptionData = $state({
		duration: '3 mois',
		dateDebut: new Date().toLocaleDateString('fr-FR'),
		
		conseils: `1. Commencer progressivement avec 15 minutes d'activité par jour
2. Maintenir une alimentation équilibrée et une hydratation suffisante
3. Boire 1,5 à 2 litres d'eau par jour, plus pendant l'effort
4. Respecter 7 à 9 heures de sommeil par nuit
5. Augmenter progressivement l'intensité sur 4 semaines
6. Intégrer des exercices de relaxation et d'étirement
7. Tenir un journal de vos activités physiques
8. Privilégier les activités en groupe pour la motivation
9. Consulter en cas de douleur ou d'inconfort persistant
10. Faire un bilan mensuel avec votre médecin`,
		
		objectifs: `• Améliorer la condition physique générale
• Réduire les facteurs de risque cardiovasculaire
• Renforcer la masse musculaire
• Améliorer la souplesse et la mobilité articulaire
• Favoriser le bien-être mental et la gestion du stress`,
		
		benefices: `• Amélioration de la capacité cardiorespiratoire
• Renforcement du système immunitaire
• Meilleure qualité du sommeil
• Réduction du risque de maladies chroniques
• Amélioration de l'humeur et réduction de l'anxiété`,
		
		programme: {
			endurance: {
				frequency: '3 fois par semaine',
				intensity: 'Modérée (conversation possible)',
				duration: '30 minutes',
				type: 'Marche rapide, vélo, natation',
				details: 'Commencer par 15 min et augmenter de 5 min chaque semaine'
			},
			renforcement: {
				frequency: '2 fois par semaine',
				intensity: '60% charge maximale',
				duration: '45 minutes',
				type: 'Exercices poids du corps, élastiques',
				details: '3 séries de 10-12 répétitions, 1 min de repos entre séries'
			},
			etirements: {
				frequency: 'Tous les jours',
				intensity: 'Sans douleur',
				duration: '10-15 minutes',
				type: 'Étirements statiques, yoga',
				details: 'Tenir chaque position 20-30 secondes'
			},
			equilibre: null
		},
		
		planification: `Lundi : Endurance (marche 30 min)
Mardi : Renforcement musculaire (45 min)
Mercredi : Repos actif (étirements 15 min)
Jeudi : Endurance (vélo ou natation 30 min)
Vendredi : Renforcement musculaire (45 min)
Samedi : Activité plaisir (randonnée, danse, sport collectif)
Dimanche : Repos ou étirements doux`,
		
		limitations: `• Éviter les efforts intenses sans échauffement
• Pas d'activité si fièvre ou infection
• Arrêt immédiat si douleur thoracique
• Éviter les températures extrêmes (>28°C ou <5°C)`,
		
		orientation: {
			type: 'Enseignant APA',
			structures: [
				{
					nom: 'Centre Sport Santé Paris',
					adresse: '123 rue de la Santé, 75014 Paris',
					tel: '01 23 45 67 89',
					email: 'contact@sportsante.fr'
				}
			],
			remboursement: 'Non remboursé par l\'Assurance Maladie. Certaines mutuelles prennent en charge.'
		}
	});

	let documentDate = new Date().toLocaleDateString('fr-FR');

	const sections = [
		{ id: 'patient', label: 'Informations Patient' },
		{ id: 'conseils', label: 'Conseils Pratiques' },
		{ id: 'objectifs', label: 'Objectifs' },
		{ id: 'benefices', label: 'Bénéfices' },
		{ id: 'programme', label: 'Programme' },
		{ id: 'planification', label: 'Planning' },
		{ id: 'orientation', label: 'Orientation' },
		{ id: 'prescription', label: 'Ordonnance' }
	];

	onMount(async () => {
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
			}
		}
	});

	function printDocument() {
		const printContent = document.getElementById('preview-content');
		if (printContent) {
			const printWindow = window.open('', '_blank');
			if (printWindow) {
				printWindow.document.write(`
					<!DOCTYPE html>
					<html>
					<head>
						<title>Prescription APA</title>
						<style>
							@page { size: A4; margin: 1cm; }
							body { font-family: Arial, sans-serif; }
							.page { page-break-after: always; }
						</style>
					</head>
					<body>${printContent.innerHTML}</body>
					</html>
				`);
				printWindow.document.close();
				printWindow.print();
			}
		}
		if (onPrint) onPrint();
	}

	function saveDocument() {
		supabase
			.from('llm_responses')
			.update({
				response_content: {
					...aiResponse,
					prescription: prescriptionData,
					doctor: doctorInfo,
					patient: patientInfo
				},
				updated_at: new Date().toISOString()
			})
			.eq('submission_id', submissionId);
		if (onUpdate) onUpdate(aiResponse);
	}

</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');
	
	.container {
		font-family: 'Lato', sans-serif;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #f5f7fa;
	}

	.toolbar {
		background: linear-gradient(135deg, #003087 0%, #012169 100%);
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 2px 10px rgba(0, 48, 135, 0.1);
	}

	.toolbar-buttons {
		display: flex;
		gap: 1rem;
	}

	.btn {
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.btn:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.btn.primary {
		background: white;
		color: #003087;
	}

	.main-layout {
		flex: 1;
		display: grid;
		grid-template-columns: 500px 1fr;
		overflow: hidden;
	}

	/* Editor Panel */
	.editor-panel {
		background: white;
		border-right: 2px solid #e5e7eb;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.section-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		padding: 1rem;
		background: #f9fafb;
		border-bottom: 2px solid #e5e7eb;
	}

	.tab {
		padding: 0.5rem 0.75rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 13px;
		font-weight: 600;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.tab.active {
		background: #003087;
		color: white;
		border-color: #003087;
	}

	.tab:hover:not(.active) {
		background: #f0f7ff;
		border-color: #003087;
	}

	.editor-content {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-label {
		display: block;
		font-weight: 700;
		color: #003087;
		margin-bottom: 0.5rem;
		font-size: 14px;
		text-transform: uppercase;
	}

	.form-input, .form-textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-family: 'Lato', sans-serif;
		font-size: 14px;
		transition: all 0.3s ease;
	}

	.form-textarea {
		min-height: 120px;
		resize: vertical;
	}

	.form-input:focus, .form-textarea:focus {
		outline: none;
		border-color: #003087;
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
	}

	.list-editor {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.list-item {
		display: flex;
		gap: 0.5rem;
		align-items: start;
	}

	.list-input {
		flex: 1;
		padding: 0.5rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.25rem;
		font-size: 14px;
	}

	.btn-remove {
		padding: 0.5rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 12px;
	}

	.btn-add {
		padding: 0.5rem 1rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		font-weight: 600;
		font-size: 13px;
		margin-top: 0.5rem;
	}

	/* Preview Panel */
	.preview-panel {
		background: #f9fafb;
		overflow-y: auto;
		padding: 2rem;
	}

	.preview-document {
		background: white;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		max-width: 800px;
		margin: 0 auto;
	}

	.page {
		padding: 50px;
		min-height: 1000px;
		background: white;
		position: relative;
		font-size: 13px;
		line-height: 1.6;
		color: #000;
	}

	.page + .page {
		border-top: 2px dashed #e5e7eb;
		page-break-before: always;
	}

	/* Cerfa-style header */
	.cerfa-header {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: 2rem;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #000;
	}

	.doctor-box {
		border: 2px solid #000;
		padding: 1rem;
		font-size: 11px;
		line-height: 1.4;
	}

	.patient-box {
		border: 2px solid #000;
		padding: 1rem;
		font-size: 11px;
		line-height: 1.4;
	}

	.cerfa-logo {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #003087;
		color: white;
		padding: 0.5rem 1rem;
		border-radius: 50%;
		font-weight: 700;
		font-size: 16px;
		height: 60px;
		width: 100px;
	}

	.prescription-title {
		text-align: center;
		font-size: 18px;
		font-weight: 900;
		margin: 2rem 0;
		text-transform: uppercase;
		text-decoration: underline;
	}

	.section-box {
		border: 1px solid #000;
		margin: 1rem 0;
		padding: 1rem;
	}

	.section-header {
		background: #f0f0f0;
		margin: -1rem -1rem 1rem -1rem;
		padding: 0.5rem 1rem;
		font-weight: 700;
		text-transform: uppercase;
		font-size: 12px;
		border-bottom: 1px solid #000;
	}

	.activity-grid {
		display: grid;
		grid-template-columns: 120px 1fr;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 12px;
	}

	.activity-label {
		font-weight: 600;
	}

	.conseil-item {
		padding: 0.5rem;
		margin: 0.25rem 0;
		background: #f9fafb;
		border-left: 3px solid #003087;
		font-size: 12px;
	}

	.planning-box {
		background: #f9fafb;
		padding: 1rem;
		border: 1px solid #000;
		white-space: pre-line;
		font-family: monospace;
		font-size: 11px;
	}

	.signature-section {
		position: absolute;
		bottom: 50px;
		right: 50px;
		text-align: center;
	}

	.signature-line {
		border-bottom: 2px solid #000;
		width: 200px;
		margin: 0 auto 0.5rem;
		height: 50px;
	}

	.footer-text {
		text-align: center;
		font-size: 10px;
		color: #666;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid #e5e7eb;
	}

	/* Feedback */
	.feedback-float {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		z-index: 100;
	}

	.feedback-panel {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		padding: 1.5rem;
		width: 350px;
	}

	.feedback-buttons {
		display: flex;
		gap: 1rem;
		margin: 1rem 0;
	}

	.feedback-btn {
		flex: 1;
		padding: 1rem;
		border: 2px solid #e5e7eb;
		background: white;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 24px;
		transition: all 0.3s ease;
	}

	.feedback-btn.selected {
		border-color: #003087;
		background: #eff6ff;
	}

	@media print {
		.toolbar, .editor-panel, .feedback-float {
			display: none !important;
		}
		
		.main-layout {
			display: block !important;
		}
		
		.preview-panel {
			padding: 0 !important;
		}
		
		.page {
			page-break-after: always;
		}
	}
</style>

<div class="container">
	<!-- Toolbar -->
	<div class="toolbar">
		<div class="toolbar-buttons">
			<button class="btn" onclick={printDocument}>
				Imprimer
			</button>
			<button class="btn" onclick={() => {
				const email = prompt('Email du patient :');
				if (email && onEmail) onEmail();
			}}>
				Email sécurisé
			</button>
			{#if onBack}
				<button class="btn" onclick={onBack}>
					Retour
				</button>
			{/if}
		</div>
		<button class="btn primary" onclick={saveDocument}>
			Sauvegarder
		</button>
	</div>

	<div class="main-layout">
		<!-- Editor Panel (Left) -->
		<div class="editor-panel">
			<div class="section-tabs">
				{#each sections as section}
					<button 
						class="tab {currentSection === section.id ? 'active' : ''}"
						onclick={() => currentSection = section.id}
					>
						{section.label}
					</button>
				{/each}
			</div>

			<div class="editor-content">
				{#if currentSection === 'patient'}
					<div class="form-group">
						<label class="form-label">Nom du patient</label>
						<input type="text" class="form-input" bind:value={patientInfo.name} />
					</div>
					<div class="form-group">
						<label class="form-label">Date de naissance</label>
						<input type="text" class="form-input" bind:value={patientInfo.birthDate} />
					</div>
					<div class="form-group">
						<label class="form-label">Adresse</label>
						<input type="text" class="form-input" bind:value={patientInfo.address} />
					</div>
					<div class="form-group">
						<label class="form-label">Ville</label>
						<input type="text" class="form-input" bind:value={patientInfo.city} />
					</div>
					<div class="form-group">
						<label class="form-label">Durée de prescription</label>
						<input type="text" class="form-input" bind:value={prescriptionData.duration} />
					</div>
				{:else if currentSection === 'conseils'}
					<div class="form-group">
						<label class="form-label">Conseils Pratiques</label>
						<textarea 
							class="form-textarea" 
							bind:value={prescriptionData.conseils}
							style="min-height: 300px;"
							placeholder="Entrez les conseils pratiques..."
						></textarea>
					</div>
				{:else if currentSection === 'objectifs'}
					<div class="form-group">
						<label class="form-label">Objectifs Thérapeutiques</label>
						<textarea 
							class="form-textarea" 
							bind:value={prescriptionData.objectifs}
							style="min-height: 200px;"
							placeholder="Entrez les objectifs thérapeutiques..."
						></textarea>
					</div>
				{:else if currentSection === 'benefices'}
					<div class="form-group">
						<label class="form-label">Bénéfices Attendus</label>
						<textarea 
							class="form-textarea" 
							bind:value={prescriptionData.benefices}
							style="min-height: 200px;"
							placeholder="Entrez les bénéfices attendus..."
						></textarea>
					</div>
				{:else if currentSection === 'programme'}
					<div class="form-group">
						<label class="form-label">Endurance - Fréquence</label>
						<input type="text" class="form-input" bind:value={prescriptionData.programme.endurance.frequency} />
					</div>
					<div class="form-group">
						<label class="form-label">Endurance - Intensité</label>
						<input type="text" class="form-input" bind:value={prescriptionData.programme.endurance.intensity} />
					</div>
					<div class="form-group">
						<label class="form-label">Endurance - Durée</label>
						<input type="text" class="form-input" bind:value={prescriptionData.programme.endurance.duration} />
					</div>
					<div class="form-group">
						<label class="form-label">Endurance - Type</label>
						<textarea class="form-textarea" bind:value={prescriptionData.programme.endurance.type}></textarea>
					</div>
					<hr style="margin: 2rem 0; border: 1px solid #e5e7eb;">
					<div class="form-group">
						<label class="form-label">Renforcement - Fréquence</label>
						<input type="text" class="form-input" bind:value={prescriptionData.programme.renforcement.frequency} />
					</div>
					<div class="form-group">
						<label class="form-label">Renforcement - Intensité</label>
						<input type="text" class="form-input" bind:value={prescriptionData.programme.renforcement.intensity} />
					</div>
					<div class="form-group">
						<label class="form-label">Renforcement - Durée</label>
						<input type="text" class="form-input" bind:value={prescriptionData.programme.renforcement.duration} />
					</div>
					<div class="form-group">
						<label class="form-label">Renforcement - Type</label>
						<textarea class="form-textarea" bind:value={prescriptionData.programme.renforcement.type}></textarea>
					</div>
				{:else if currentSection === 'planification'}
					<div class="form-group">
						<label class="form-label">Planning Hebdomadaire</label>
						<textarea 
							class="form-textarea" 
							bind:value={prescriptionData.planification}
							style="min-height: 300px; font-family: monospace;"
						></textarea>
					</div>
				{:else if currentSection === 'orientation'}
					<div class="form-group">
						<label class="form-label">Type d'orientation</label>
						<input type="text" class="form-input" bind:value={prescriptionData.orientation.type} />
					</div>
					<div class="form-group">
						<label class="form-label">Structure - Nom</label>
						<input type="text" class="form-input" bind:value={prescriptionData.orientation.structures[0].nom} />
					</div>
					<div class="form-group">
						<label class="form-label">Structure - Adresse</label>
						<input type="text" class="form-input" bind:value={prescriptionData.orientation.structures[0].adresse} />
					</div>
					<div class="form-group">
						<label class="form-label">Structure - Téléphone</label>
						<input type="text" class="form-input" bind:value={prescriptionData.orientation.structures[0].tel} />
					</div>
					<div class="form-group">
						<label class="form-label">Remboursement</label>
						<textarea class="form-textarea" bind:value={prescriptionData.orientation.remboursement}></textarea>
					</div>
				{:else if currentSection === 'prescription'}
					<div class="form-group">
						<label class="form-label">Limitations</label>
						<textarea 
							class="form-textarea" 
							bind:value={prescriptionData.limitations}
							style="min-height: 150px;"
							placeholder="Entrez les limitations..."
						></textarea>
					</div>
				{/if}
			</div>
		</div>

		<!-- Preview Panel (Right) -->
		<div class="preview-panel">
			<div class="preview-document" id="preview-content">
				<!-- Page 1: Conseils et Programme -->
				<div class="page">
					<h1 style="text-align: center; color: #003087; margin-bottom: 2rem;">
						RECOMMANDATIONS D'ACTIVITÉ PHYSIQUE ADAPTÉE
					</h1>

					<!-- Conseils Pratiques -->
					<div class="section-box">
						<div class="section-header">DIX CONSEILS PRATIQUES</div>
						<div style="white-space: pre-line; line-height: 1.8;">
							{prescriptionData.conseils}
						</div>
					</div>

					<!-- Objectifs -->
					<div class="section-box">
						<div class="section-header">OBJECTIFS THÉRAPEUTIQUES</div>
						<div style="white-space: pre-line; line-height: 1.8;">
							{prescriptionData.objectifs}
						</div>
					</div>

					<!-- Bénéfices -->
					<div class="section-box">
						<div class="section-header">BÉNÉFICES ATTENDUS</div>
						<div style="white-space: pre-line; line-height: 1.8;">
							{prescriptionData.benefices}
						</div>
					</div>

					<!-- Planning -->
					<div class="section-box">
						<div class="section-header">PLANNING HEBDOMADAIRE</div>
						<div class="planning-box">
							{prescriptionData.planification}
						</div>
					</div>

					<div class="footer-text">
						Ces conseils ne remplacent pas une consultation médicale
					</div>
				</div>

				<!-- Page 2: Ordonnance officielle -->
				<div class="page">
					<!-- En-tête Cerfa style -->
					<div class="cerfa-header">
						<div class="doctor-box">
							<strong>Docteur {doctorInfo.name}</strong><br>
							Spécialité : {doctorInfo.specialty}<br>
							RPPS : {doctorInfo.rpps}<br>
							Adresse : {doctorInfo.address}<br>
							Téléphone : {doctorInfo.phone}<br>
							Email : {doctorInfo.email}
						</div>
						<div class="cerfa-logo">APA</div>
						<div class="patient-box">
							<strong>{patientInfo.name}</strong><br>
							Né(e) le : {patientInfo.birthDate}<br>
							<br>
							Adresse : {patientInfo.address}<br>
							{patientInfo.city}
						</div>
					</div>

					<div style="text-align: right; margin-bottom: 2rem;">
						Le {documentDate} (date)
					</div>

					<h2 class="prescription-title">
						PRESCRIPTION D'ACTIVITÉ PHYSIQUE ADAPTÉE
					</h2>

					<div style="margin: 2rem 0; padding: 1rem; background: #f9fafb; border: 1px solid #000;">
						<strong>Je prescris une activité physique et/ou sportive adaptée</strong><br>
						Pendant : <strong>{prescriptionData.duration}</strong><br>
						À adapter en fonction de l'évolution des aptitudes du patient
					</div>

					<!-- Programme détaillé -->
					<div class="section-box">
						<div class="section-header">PROGRAMME D'ACTIVITÉ PHYSIQUE</div>
						
						<div style="margin-bottom: 1.5rem;">
							<strong style="color: #003087;">ENDURANCE</strong>
							<div class="activity-grid">
								<div class="activity-label">Fréquence :</div>
								<div>{prescriptionData.programme.endurance.frequency}</div>
								<div class="activity-label">Intensité :</div>
								<div>{prescriptionData.programme.endurance.intensity}</div>
								<div class="activity-label">Durée :</div>
								<div>{prescriptionData.programme.endurance.duration}</div>
								<div class="activity-label">Type :</div>
								<div>{prescriptionData.programme.endurance.type}</div>
								<div class="activity-label">Conseils :</div>
								<div>{prescriptionData.programme.endurance.details}</div>
							</div>
						</div>

						<div style="margin-bottom: 1.5rem;">
							<strong style="color: #003087;">RENFORCEMENT MUSCULAIRE</strong>
							<div class="activity-grid">
								<div class="activity-label">Fréquence :</div>
								<div>{prescriptionData.programme.renforcement.frequency}</div>
								<div class="activity-label">Intensité :</div>
								<div>{prescriptionData.programme.renforcement.intensity}</div>
								<div class="activity-label">Durée :</div>
								<div>{prescriptionData.programme.renforcement.duration}</div>
								<div class="activity-label">Type :</div>
								<div>{prescriptionData.programme.renforcement.type}</div>
								<div class="activity-label">Conseils :</div>
								<div>{prescriptionData.programme.renforcement.details}</div>
							</div>
						</div>

						<div>
							<strong style="color: #003087;">ÉTIREMENTS</strong>
							<div class="activity-grid">
								<div class="activity-label">Fréquence :</div>
								<div>{prescriptionData.programme.etirements.frequency}</div>
								<div class="activity-label">Intensité :</div>
								<div>{prescriptionData.programme.etirements.intensity}</div>
								<div class="activity-label">Durée :</div>
								<div>{prescriptionData.programme.etirements.duration}</div>
								<div class="activity-label">Type :</div>
								<div>{prescriptionData.programme.etirements.type}</div>
								<div class="activity-label">Conseils :</div>
								<div>{prescriptionData.programme.etirements.details}</div>
							</div>
						</div>
					</div>

					<!-- Limitations -->
					<div class="section-box">
						<div class="section-header">LIMITATIONS</div>
						<div style="white-space: pre-line; line-height: 1.8; color: #dc2626;">
							{prescriptionData.limitations}
						</div>
					</div>

					<!-- Orientation -->
					<div class="section-box">
						<div class="section-header">ORIENTATION</div>
						<p><strong>Type d'intervenant :</strong> {prescriptionData.orientation.type}</p>
						{#each prescriptionData.orientation.structures as structure}
							<div style="margin: 1rem 0; padding: 0.5rem; background: #f9fafb;">
								<strong>{structure.nom}</strong><br>
								Adresse : {structure.adresse}<br>
								Tél : {structure.tel}<br>
								Email : {structure.email}
							</div>
						{/each}
						<p style="font-size: 11px; color: #666; margin-top: 1rem;">
							{prescriptionData.orientation.remboursement}
						</p>
					</div>

					<div class="signature-section">
						<div>Signature électronique</div>
						<div class="signature-line"></div>
						<div>{doctorInfo.name}</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Feedback -->
	<div class="feedback-float">
		{#if showFeedback}
			<div class="feedback-panel">
				<h3 style="margin-bottom: 1rem;">Votre avis</h3>
				<p style="font-size: 14px; color: #666; margin-bottom: 1rem;">
					Souhaitez-vous corriger ou ajuster le programme ?
				</p>
				<div class="feedback-buttons">
					<button 
						class="feedback-btn {feedbackRating === 'satisfied' ? 'selected' : ''}"
						onclick={() => feedbackRating = 'satisfied'}
					>Satisfait</button>
					<button 
						class="feedback-btn {feedbackRating === 'unsatisfied' ? 'selected' : ''}"
						onclick={() => feedbackRating = 'unsatisfied'}
					>Non satisfait</button>
				</div>
				<textarea 
					placeholder="Commentaire..."
					bind:value={feedbackComment}
					style="width: 100%; min-height: 80px; padding: 0.5rem; border: 2px solid #e5e7eb; border-radius: 0.25rem;"
				></textarea>
				<div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
					<button class="btn primary" style="flex: 1;">Envoyer</button>
					<button class="btn" onclick={() => showFeedback = false} style="flex: 1;">Fermer</button>
				</div>
			</div>
		{:else}
			<button class="btn primary" onclick={() => showFeedback = true}>
				Feedback
			</button>
		{/if}
	</div>
</div>