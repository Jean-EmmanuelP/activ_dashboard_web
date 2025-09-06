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

	// État pour le mode édition et feedback
	let isEditing = $state(false);
	let showFeedback = $state(false);
	let feedbackRating = $state<'satisfied' | 'unsatisfied' | null>(null);
	let feedbackComment = $state('');
	let currentView = $state<'prescription' | 'conseils' | 'all'>('all');
	
	// Informations du médecin
	let doctorInfo = $state({
		name: 'Dr. _____________',
		address: '_____________',
		phone: '_____________',
		email: '_____________',
		specialty: 'Médecine du Sport',
		rpps: '_____________',
		signature: ''
	});

	// Informations du patient
	let patientInfo = $state({
		name: '_____________',
		birthDate: '_____________',
		location: '_____________'
	});

	// Messages d'alerte basés sur les réponses
	let alertMessages = $state<string[]>([]);
	
	// Date du document
	let documentDate = new Date().toLocaleDateString('fr-FR');
	
	// Données de prescription structurées
	let prescriptionData = $state({
		duration: '3 mois',
		synthese: `Patient présentant un profil sédentaire avec volonté de reprise d'activité physique progressive.
Objectifs principaux : amélioration de la condition physique générale, réduction des facteurs de risque cardiovasculaire.
Pas de contre-indication majeure identifiée.`,
		
		endurance: {
			frequency: '3 fois par semaine',
			intensity: 'Modérée (essoufflement léger, conversation possible)',
			time: '30 minutes par séance',
			type: 'Marche rapide, vélo d\'appartement, natation',
			conseils: 'Commencer par 15 minutes et augmenter progressivement. Surveiller la fréquence cardiaque.'
		},
		
		renforcement: {
			frequency: '2 fois par semaine',
			intensity: '60% de la charge maximale',
			time: '45 minutes par séance',
			type: 'Exercices avec poids du corps, élastiques de résistance',
			conseils: '5 exercices membres inférieurs, 5 exercices membres supérieurs. 10 répétitions, 3 séries.'
		},
		
		etirements: {
			frequency: '3 fois par semaine',
			intensity: 'Sans douleur',
			time: '15 minutes',
			type: 'Étirements statiques, yoga doux',
			conseils: '8 exercices tenus 20 secondes, 4 répétitions'
		},
		
		equilibre: null, // Si > 65 ans ou cancer
		
		limitations: [
			'Éviter les activités à fort impact articulaire',
			'Pas d\'effort intense sans échauffement préalable',
			'Arrêt immédiat si douleur thoracique'
		],
		
		intervenant: 'Enseignant en Activité Physique Adaptée (APA) ou Kinésithérapeute'
	});

	// Conseils pratiques
	let conseilsPratiques = $state([
		'Le maître mot est de prendre du plaisir',
		'Prévoir un échauffement de 5-10 minutes avant chaque activité',
		'Rompre les périodes de sédentarité (toutes les 2h) par 5 minutes de mobilisation',
		'En cas de manque de temps, fractionner les séances par périodes de 10 minutes',
		'Activité modérée : respiration accélérée, conversation possible',
		'Activité élevée : respiration rapide, conversation difficile',
		'Prévoir un jour de récupération entre séances similaires',
		'Éviter l\'activité si température >28°C ou <5°C, pic de pollution, ou fièvre',
		'Ne jamais fumer dans les 2h avant/après l\'activité',
		'Ces recommandations peuvent être affinées avec un professionnel'
	]);

	// Bénéfices attendus
	let beneficesAttendus = $state([
		'Amélioration de la capacité cardiovasculaire et respiratoire',
		'Renforcement musculaire et osseux',
		'Meilleure gestion du stress et de l\'anxiété',
		'Amélioration de la qualité du sommeil',
		'Réduction des risques de maladies chroniques'
	]);

	// Planification hebdomadaire
	let planification = $state([
		{ jour: 'Lundi', activite: 'Marche rapide 30 min', horaire: 'Matin' },
		{ jour: 'Mardi', activite: 'Renforcement musculaire 45 min', horaire: 'Soir' },
		{ jour: 'Mercredi', activite: 'Repos actif (étirements 15 min)', horaire: 'Matin' },
		{ jour: 'Jeudi', activite: 'Natation 30 min', horaire: 'Midi' },
		{ jour: 'Vendredi', activite: 'Renforcement musculaire 45 min', horaire: 'Soir' },
		{ jour: 'Samedi', activite: 'Vélo 30 min + étirements', horaire: 'Matin' },
		{ jour: 'Dimanche', activite: 'Repos ou activité plaisir', horaire: '-' }
	]);

	// Propositions d'orientation
	let orientations = $state({
		type: 'APA', // ou 'kiné' ou 'sport_commun'
		structures: [
			{
				nom: 'Centre Sport Santé Paris',
				adresse: '123 rue de la Santé, 75014 Paris',
				telephone: '01 23 45 67 89',
				email: 'contact@sportsante-paris.fr'
			},
			{
				nom: 'Association APA 75',
				adresse: '45 avenue du Sport, 75015 Paris',
				telephone: '01 98 76 54 32',
				email: 'info@apa75.fr'
			}
		],
		remboursement: 'Le sport sur ordonnance ne bénéficie pas d\'un remboursement par la sécurité sociale, mais certaines mutuelles les prennent en charge.',
		liens: [
			{ label: 'Trouver un professionnel APA', url: 'https://monbilansportsante.fr/patient/etape3' },
			{ label: 'Équipements sportifs', url: 'https://equipements.sports.gouv.fr' }
		]
	});

	onMount(async () => {
		// Charger les infos du médecin
		const authUser = (await supabase.auth.getUser()).data.user;
		if (authUser) {
			const { data } = await supabase
				.from('users')
				.select('*')
				.eq('email', authUser.email)
				.single();
			if (data) {
				doctorInfo.name = `Dr. ${data.first_name} ${data.last_name}`;
				doctorInfo.signature = `Dr. ${data.first_name} ${data.last_name}`;
				if (data.rpps) doctorInfo.rpps = data.rpps;
			}
		}
		
		// Analyser les réponses du patient pour générer les alertes
		analyzePatientAnswers();
	});

	function analyzePatientAnswers() {
		// Simuler l'analyse des réponses pour générer des alertes
		alertMessages = [];
		
		// Exemples d'alertes basées sur les conditions
		if (patientAnswers.asthme) {
			alertMessages.push('Asthme identifié : Consultation pneumologique avec EFR recommandée avant de débuter');
		}
		if (patientAnswers.age >= 65) {
			alertMessages.push('Patient de plus de 65 ans : Ajouter des exercices d\'équilibre au programme');
			prescriptionData.equilibre = {
				frequency: '2 fois par semaine',
				intensity: 'Progressive',
				time: '20 minutes',
				type: 'Tai-chi, exercices proprioceptifs',
				conseils: '8 exercices avec 20 secondes de pause, 4 répétitions'
			};
		}
	}

	function saveDocument() {
		if (onUpdate) {
			onUpdate(aiResponse);
		}
		// Sauvegarder en base
		supabase
			.from('llm_responses')
			.update({
				response_content: {
					...aiResponse,
					prescription: prescriptionData,
					conseils: conseilsPratiques,
					benefices: beneficesAttendus,
					planification,
					orientations
				},
				updated_at: new Date().toISOString()
			})
			.eq('submission_id', submissionId);
	}

	function printDocument() {
		window.print();
		if (onPrint) onPrint();
	}

	function emailDocument() {
		const email = prompt('Adresse email du patient :');
		if (email) {
			// TODO: Implémenter l'envoi sécurisé
			if (onEmail) onEmail();
		}
	}

	function submitFeedback() {
		// Sauvegarder le feedback
		supabase
			.from('feedback')
			.insert({
				llm_response_id: submissionId,
				satisfaction: feedbackRating === 'satisfied',
				comment: feedbackComment,
				created_at: new Date().toISOString()
			});
		showFeedback = false;
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');
	
	:global(*) {
		box-sizing: border-box;
	}

	.container {
		font-family: 'Lato', sans-serif;
		background: #f5f7fa;
		min-height: 100vh;
	}

	.toolbar {
		background: linear-gradient(135deg, #003087 0%, #012169 100%);
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 2px 10px rgba(0, 48, 135, 0.1);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.toolbar-left {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.view-selector {
		display: flex;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.25rem;
		border-radius: 0.5rem;
	}

	.view-btn {
		padding: 0.5rem 1rem;
		background: transparent;
		color: white;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.3s ease;
	}

	.view-btn.active {
		background: white;
		color: #003087;
	}

	.btn {
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		border: 2px solid transparent;
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

	.btn.primary:hover {
		background: #f0f7ff;
	}

	.content {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 2rem;
	}

	.alert-section {
		background: #fef3c7;
		border: 2px solid #f59e0b;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 2rem;
	}

	.alert-title {
		font-weight: 700;
		color: #92400e;
		margin-bottom: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.alert-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.alert-item {
		padding: 0.5rem 0;
		color: #78350f;
		border-bottom: 1px solid #fcd34d;
	}

	.alert-item:last-child {
		border-bottom: none;
	}

	.document {
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
		margin-bottom: 2rem;
		overflow: hidden;
	}

	.page {
		padding: 60px;
		min-height: 297mm;
		page-break-after: always;
	}

	.page:last-child {
		page-break-after: auto;
	}

	.header {
		text-align: left;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.doctor-info {
		line-height: 1.6;
		color: #374151;
	}

	.prescription-title {
		text-align: center;
		font-size: 24px;
		font-weight: 900;
		color: #003087;
		text-transform: uppercase;
		margin: 2rem 0;
		letter-spacing: 1px;
	}

	.patient-info {
		margin: 2rem 0;
		padding: 1rem;
		background: #f9fafb;
		border-radius: 0.5rem;
	}

	.synthese {
		background: #eff6ff;
		border-left: 4px solid #003087;
		padding: 1rem;
		margin: 2rem 0;
		border-radius: 0 0.5rem 0.5rem 0;
	}

	.synthese-title {
		font-weight: 700;
		color: #003087;
		margin-bottom: 0.5rem;
	}

	.section {
		margin: 2rem 0;
	}

	.section-title {
		font-size: 18px;
		font-weight: 700;
		color: #003087;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.activity-block {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.activity-title {
		font-size: 16px;
		font-weight: 700;
		color: #003087;
		margin-bottom: 1rem;
	}

	.activity-details {
		display: grid;
		gap: 0.75rem;
	}

	.detail-row {
		display: grid;
		grid-template-columns: 150px 1fr;
		gap: 1rem;
		align-items: start;
	}

	.detail-label {
		font-weight: 600;
		color: #6b7280;
	}

	.detail-value {
		color: #111827;
		line-height: 1.6;
	}

	.editable {
		padding: 0.5rem;
		border: 2px solid transparent;
		border-radius: 0.25rem;
		transition: all 0.3s ease;
	}

	.editable:hover {
		background: #f0f7ff;
		border-color: #003087;
		cursor: text;
	}

	.editable[contenteditable="true"] {
		background: #f0f7ff;
		border-color: #003087;
		outline: none;
	}

	.limitations-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.limitation-item {
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		background: #fef2f2;
		border-left: 3px solid #ef4444;
		border-radius: 0 0.25rem 0.25rem 0;
	}

	.conseils-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
		margin-top: 1rem;
	}

	.conseil-card {
		background: #f0f9ff;
		border: 1px solid #0284c7;
		border-radius: 0.5rem;
		padding: 1rem;
		display: flex;
		align-items: start;
		gap: 0.75rem;
	}

	.conseil-number {
		font-weight: 700;
		color: #0284c7;
		min-width: 24px;
	}

	.benefices-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.benefice-item {
		padding: 1rem;
		margin-bottom: 0.75rem;
		background: #f0fdf4;
		border-left: 3px solid #10b981;
		border-radius: 0 0.5rem 0.5rem 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.planning-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}

	.planning-table th {
		background: #003087;
		color: white;
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
	}

	.planning-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.planning-table tr:nth-child(even) {
		background: #f9fafb;
	}

	.orientation-box {
		background: #fefce8;
		border: 2px solid #facc15;
		border-radius: 0.5rem;
		padding: 1.5rem;
		margin-top: 1rem;
	}

	.structure-card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.structure-name {
		font-weight: 700;
		color: #003087;
		margin-bottom: 0.5rem;
	}

	.structure-info {
		color: #6b7280;
		line-height: 1.6;
		font-size: 14px;
	}

	.links-list {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		flex-wrap: wrap;
	}

	.link-btn {
		padding: 0.5rem 1rem;
		background: #003087;
		color: white;
		text-decoration: none;
		border-radius: 0.25rem;
		font-size: 14px;
		transition: all 0.3s ease;
	}

	.link-btn:hover {
		background: #012169;
		transform: translateY(-2px);
	}

	.signature-section {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 2px solid #e5e7eb;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
	}

	.signature-block {
		text-align: center;
		min-width: 250px;
	}

	.signature-line {
		border-bottom: 2px solid #111827;
		margin-bottom: 0.5rem;
		height: 60px;
	}

	.footer-note {
		text-align: center;
		margin-top: 2rem;
		padding: 1rem;
		background: #fef3c7;
		border-radius: 0.5rem;
		color: #78350f;
		font-weight: 600;
	}

	.feedback-section {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		background: white;
		border-radius: 0.5rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
		padding: 1.5rem;
		max-width: 400px;
		z-index: 90;
	}

	.feedback-title {
		font-weight: 700;
		margin-bottom: 1rem;
		color: #003087;
	}

	.feedback-buttons {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.feedback-btn {
		flex: 1;
		padding: 0.75rem;
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

	.feedback-comment {
		width: 100%;
		min-height: 80px;
		padding: 0.5rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		resize: vertical;
		font-family: 'Lato', sans-serif;
	}

	@media print {
		.toolbar, .feedback-section, .alert-section {
			display: none !important;
		}
		
		.content {
			margin: 0;
			padding: 0;
			max-width: 100%;
		}
		
		.document {
			box-shadow: none;
			border-radius: 0;
		}
		
		.page {
			page-break-after: always;
		}
		
		@page {
			size: A4;
			margin: 1cm;
		}
	}
</style>

<div class="container">
	<!-- Toolbar -->
	<div class="toolbar">
		<div class="toolbar-left">
			<div class="view-selector">
				<button 
					class="view-btn {currentView === 'all' ? 'active' : ''}"
					onclick={() => currentView = 'all'}
				>
					Vue complète
				</button>
				<button 
					class="view-btn {currentView === 'prescription' ? 'active' : ''}"
					onclick={() => currentView = 'prescription'}
				>
					Ordonnance
				</button>
				<button 
					class="view-btn {currentView === 'conseils' ? 'active' : ''}"
					onclick={() => currentView = 'conseils'}
				>
					Conseils
				</button>
			</div>
			
			<button class="btn" onclick={() => isEditing = !isEditing}>
				{isEditing ? '👁️ Prévisualiser' : '✏️ Modifier'}
			</button>
			<button class="btn" onclick={printDocument}>
				🖨️ Imprimer
			</button>
			<button class="btn" onclick={emailDocument}>
				📧 Email sécurisé
			</button>
			{#if onBack}
				<button class="btn" onclick={onBack}>
					← Retour
				</button>
			{/if}
		</div>
		<button class="btn primary" onclick={saveDocument}>
			💾 Sauvegarder
		</button>
	</div>

	<div class="content">
		<!-- Section d'alerte -->
		{#if alertMessages.length > 0}
			<div class="alert-section">
				<h3 class="alert-title">
					⚠️ Points d'attention avant prescription
				</h3>
				<ul class="alert-list">
					{#each alertMessages as alert}
						<li class="alert-item">{alert}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Document principal -->
		<div class="document">
			{#if currentView === 'all' || currentView === 'prescription'}
				<!-- Page 1: Ordonnance -->
				<div class="page">
					<div class="header">
						<div class="doctor-info" contenteditable={isEditing}>
							<strong>{doctorInfo.name}</strong><br>
							Adresse : {doctorInfo.address}<br>
							Tél : {doctorInfo.phone} | Email : {doctorInfo.email}<br>
							Spécialité : {doctorInfo.specialty}<br>
							RPPS : {doctorInfo.rpps}
						</div>
					</div>

					<div class="patient-info">
						<div contenteditable={isEditing}>
							<strong>À l'intention de :</strong> {patientInfo.name}<br>
							<strong>Né(e) le :</strong> {patientInfo.birthDate}<br>
							<strong>Fait à :</strong> {patientInfo.location}, le {documentDate}
						</div>
					</div>

					<h1 class="prescription-title">Prescription d'Activité Physique Adaptée</h1>

					<!-- Synthèse IA -->
					<div class="synthese">
						<div class="synthese-title">Synthèse médicale</div>
						<div contenteditable={isEditing}>
							{prescriptionData.synthese}
						</div>
					</div>

					<div class="section">
						<p contenteditable={isEditing}>
							<strong>Je prescris une activité physique et/ou sportive adaptée</strong><br>
							Pendant <span class="editable" contenteditable={isEditing}>{prescriptionData.duration}</span>, 
							à adapter en fonction de l'évolution des aptitudes du patient.
						</p>
					</div>

					<!-- Préconisations d'activité -->
					<div class="section">
						<h2 class="section-title">Préconisations d'activité et recommandations</h2>
						
						<!-- Endurance -->
						<div class="activity-block">
							<h3 class="activity-title">🏃‍♂️ Endurance</h3>
							<div class="activity-details">
								<div class="detail-row">
									<span class="detail-label">Fréquence :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.endurance.frequency}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Intensité :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.endurance.intensity}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Temps :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.endurance.time}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Type :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.endurance.type}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Conseils pratiques :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.endurance.conseils}</span>
								</div>
							</div>
						</div>

						<!-- Renforcement musculaire -->
						<div class="activity-block">
							<h3 class="activity-title">🏋️‍♀️ Renforcement musculaire</h3>
							<div class="activity-details">
								<div class="detail-row">
									<span class="detail-label">Fréquence :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.renforcement.frequency}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Intensité :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.renforcement.intensity}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Temps :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.renforcement.time}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Type :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.renforcement.type}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Conseils pratiques :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.renforcement.conseils}</span>
								</div>
							</div>
						</div>

						<!-- Étirements -->
						<div class="activity-block">
							<h3 class="activity-title">🧘‍♀️ Étirements</h3>
							<div class="activity-details">
								<div class="detail-row">
									<span class="detail-label">Fréquence :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.etirements.frequency}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Intensité :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.etirements.intensity}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Temps :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.etirements.time}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Type :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.etirements.type}</span>
								</div>
								<div class="detail-row">
									<span class="detail-label">Conseils pratiques :</span>
									<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.etirements.conseils}</span>
								</div>
							</div>
						</div>

						<!-- Équilibre (si applicable) -->
						{#if prescriptionData.equilibre}
							<div class="activity-block">
								<h3 class="activity-title">🔄 Équilibre, coordination et proprioception</h3>
								<div class="activity-details">
									<div class="detail-row">
										<span class="detail-label">Fréquence :</span>
										<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.equilibre.frequency}</span>
									</div>
									<div class="detail-row">
										<span class="detail-label">Intensité :</span>
										<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.equilibre.intensity}</span>
									</div>
									<div class="detail-row">
										<span class="detail-label">Temps :</span>
										<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.equilibre.time}</span>
									</div>
									<div class="detail-row">
										<span class="detail-label">Type :</span>
										<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.equilibre.type}</span>
									</div>
									<div class="detail-row">
										<span class="detail-label">Conseils pratiques :</span>
										<span class="detail-value editable" contenteditable={isEditing}>{prescriptionData.equilibre.conseils}</span>
									</div>
								</div>
							</div>
						{/if}
					</div>

					<!-- Limitations -->
					<div class="section">
						<h2 class="section-title">Limitations</h2>
						<ul class="limitations-list">
							{#each prescriptionData.limitations as limitation}
								<li class="limitation-item" contenteditable={isEditing}>{limitation}</li>
							{/each}
						</ul>
					</div>

					<!-- Type d'intervenant -->
					<div class="section">
						<p contenteditable={isEditing}>
							<strong>Type d'intervenant(s) appelé(s) à dispenser l'activité physique :</strong><br>
							{prescriptionData.intervenant}
						</p>
					</div>

					<!-- Mentions légales -->
					<div class="section" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
						<p style="font-size: 12px; color: #6b7280; line-height: 1.6;">
							Merci de joindre lors du suivi : la satisfaction et la motivation du patient, les progrès, 
							les résultats des tests de condition physique si disponible, les effets indésirables ressentis 
							par le patient (fatigue, douleur, limitations fonctionnelles...), les propositions pour pérenniser 
							l'activité physique (structure relais, outils d'autonomisation...)
						</p>
						<p style="font-size: 12px; color: #6b7280; margin-top: 0.5rem;">
							La dispensation de l'activité physique adaptée ne peut pas donner lieu à une prise en charge 
							par l'assurance maladie.
						</p>
					</div>

					<!-- Signature -->
					<div class="signature-section">
						<div>
							<p>Document remis en main propre</p>
							<p>Le {documentDate}</p>
						</div>
						<div class="signature-block">
							<div class="signature-line"></div>
							<div>{doctorInfo.name}</div>
							<div style="font-size: 12px; color: #6b7280;">Signature</div>
						</div>
					</div>

					<div class="footer-note">
						✳️ Nos conseils ne remplacent pas une consultation médicale
					</div>
				</div>
			{/if}

			{#if currentView === 'all' || currentView === 'conseils'}
				<!-- Page 2: Conseils pratiques -->
				<div class="page">
					<h1 class="prescription-title">✅ Dix conseils pratiques</h1>
					
					<div class="conseils-grid">
						{#each conseilsPratiques as conseil, i}
							<div class="conseil-card">
								<span class="conseil-number">{i + 1}.</span>
								<span contenteditable={isEditing}>{conseil}</span>
							</div>
						{/each}
					</div>

					<div class="section">
						<h2 class="section-title">💚 Bénéfices attendus</h2>
						<ul class="benefices-list">
							{#each beneficesAttendus as benefice}
								<li class="benefice-item">
									<span>✓</span>
									<span contenteditable={isEditing}>{benefice}</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class="section">
						<h2 class="section-title">📅 Exemple de planification hebdomadaire</h2>
						<table class="planning-table">
							<thead>
								<tr>
									<th>Jour</th>
									<th>Activité</th>
									<th>Horaire conseillé</th>
								</tr>
							</thead>
							<tbody>
								{#each planification as jour}
									<tr>
										<td contenteditable={isEditing}>{jour.jour}</td>
										<td contenteditable={isEditing}>{jour.activite}</td>
										<td contenteditable={isEditing}>{jour.horaire}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<div class="section">
						<h2 class="section-title">🧭 Proposition d'orientation</h2>
						
						<div class="orientation-box">
							<p style="margin-bottom: 1rem;">
								<strong>Orientation recommandée :</strong> 
								{#if orientations.type === 'APA'}
									Enseignant en Activité Physique Adaptée (APA)
								{:else if orientations.type === 'kiné'}
									Kinésithérapeute
								{:else}
									Structure sportive commune
								{/if}
							</p>

							{#each orientations.structures as structure}
								<div class="structure-card">
									<div class="structure-name">{structure.nom}</div>
									<div class="structure-info">
										📍 {structure.adresse}<br>
										📞 {structure.telephone}<br>
										✉️ {structure.email}
									</div>
								</div>
							{/each}

							<p style="margin-top: 1rem; font-size: 14px; color: #6b7280;">
								{orientations.remboursement}
							</p>

							<div class="links-list">
								{#each orientations.liens as lien}
									<a href={lien.url} target="_blank" class="link-btn">
										{lien.label} →
									</a>
								{/each}
							</div>
						</div>
					</div>

					<div class="footer-note" style="margin-top: 3rem;">
						✳️ Nos conseils ne remplacent pas une consultation médicale<br>
						<span style="font-size: 12px; color: #9ca3af;">
							Sources : HAS 2022, Inserm 2019, Expertise collective ANSES 2016
						</span>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Section Feedback -->
	{#if showFeedback}
		<div class="feedback-section">
			<h3 class="feedback-title">Votre avis compte</h3>
			<p style="margin-bottom: 1rem; color: #6b7280;">
				Souhaitez-vous corriger ou ajuster le programme ?
			</p>
			<div class="feedback-buttons">
				<button 
					class="feedback-btn {feedbackRating === 'satisfied' ? 'selected' : ''}"
					onclick={() => feedbackRating = 'satisfied'}
				>
					👍
				</button>
				<button 
					class="feedback-btn {feedbackRating === 'unsatisfied' ? 'selected' : ''}"
					onclick={() => feedbackRating = 'unsatisfied'}
				>
					👎
				</button>
			</div>
			<textarea 
				class="feedback-comment"
				placeholder="Commentaire (optionnel)..."
				bind:value={feedbackComment}
			></textarea>
			<div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
				<button class="btn primary" onclick={submitFeedback} style="flex: 1;">
					Envoyer
				</button>
				<button class="btn" onclick={() => showFeedback = false} style="flex: 1;">
					Fermer
				</button>
			</div>
		</div>
	{:else}
		<button 
			class="btn primary" 
			onclick={() => showFeedback = true}
			style="position: fixed; bottom: 2rem; right: 2rem; z-index: 90;"
		>
			💬 Feedback
		</button>
	{/if}
</div>