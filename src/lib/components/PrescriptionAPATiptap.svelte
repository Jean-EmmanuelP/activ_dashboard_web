<script lang="ts">
	import type { AIRecommendation } from '$lib/services/vertexAI';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import TiptapEditor from './TiptapEditor.svelte';
	
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
	let currentSection = $state('conseils');
	let showFeedback = $state(false);
	let feedbackRating = $state<'satisfied' | 'unsatisfied' | null>(null);
	let feedbackComment = $state('');
	
	// Références aux éditeurs
	let conseilsEditor: TiptapEditor;
	let objectifsEditor: TiptapEditor;
	let beneficesEditor: TiptapEditor;
	let planificationEditor: TiptapEditor;
	let limitationsEditor: TiptapEditor;
	
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

	// Données de prescription avec HTML formaté
	let prescriptionData = $state({
		duration: '3 mois',
		dateDebut: new Date().toLocaleDateString('fr-FR'),
		
		conseils: `<h3>Conseils pratiques pour votre activité physique</h3>
<ol>
<li>Commencer progressivement avec 15 minutes d'activité par jour</li>
<li>Maintenir une alimentation équilibrée et une hydratation suffisante</li>
<li>Boire 1,5 à 2 litres d'eau par jour, plus pendant l'effort</li>
<li>Respecter 7 à 9 heures de sommeil par nuit</li>
<li>Augmenter progressivement l'intensité sur 4 semaines</li>
<li>Intégrer des exercices de relaxation et d'étirement</li>
<li>Tenir un journal de vos activités physiques</li>
<li>Privilégier les activités en groupe pour la motivation</li>
<li>Consulter en cas de douleur ou d'inconfort persistant</li>
<li>Faire un bilan mensuel avec votre médecin</li>
</ol>`,
		
		objectifs: `<h3>Objectifs thérapeutiques</h3>
<ul>
<li>Améliorer la condition physique générale</li>
<li>Réduire les facteurs de risque cardiovasculaire</li>
<li>Renforcer la masse musculaire</li>
<li>Améliorer la souplesse et la mobilité articulaire</li>
<li>Favoriser le bien-être mental et la gestion du stress</li>
</ul>`,
		
		benefices: `<h3>Bénéfices attendus</h3>
<ul>
<li>Amélioration de la capacité cardiorespiratoire</li>
<li>Renforcement du système immunitaire</li>
<li>Meilleure qualité du sommeil</li>
<li>Réduction du risque de maladies chroniques</li>
<li>Amélioration de l'humeur et réduction de l'anxiété</li>
</ul>`,
		
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
		
		planification: `<h3>Planning hebdomadaire</h3>
<p><strong>Lundi :</strong> Endurance (marche 30 min)</p>
<p><strong>Mardi :</strong> Renforcement musculaire (45 min)</p>
<p><strong>Mercredi :</strong> Repos actif (étirements 15 min)</p>
<p><strong>Jeudi :</strong> Endurance (vélo ou natation 30 min)</p>
<p><strong>Vendredi :</strong> Renforcement musculaire (45 min)</p>
<p><strong>Samedi :</strong> Activité plaisir (randonnée, danse, sport collectif)</p>
<p><strong>Dimanche :</strong> Repos ou étirements doux</p>`,
		
		limitations: `<h3>Limitations et précautions</h3>
<ul>
<li>Éviter les efforts intenses sans échauffement</li>
<li>Pas d'activité si fièvre ou infection</li>
<li>Arrêt immédiat si douleur thoracique</li>
<li>Éviter les températures extrêmes (>28°C ou <5°C)</li>
</ul>`,
		
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
		{ id: 'conseils', label: 'Conseils Pratiques' },
		{ id: 'objectifs', label: 'Objectifs' },
		{ id: 'benefices', label: 'Bénéfices' },
		{ id: 'programme', label: 'Programme' },
		{ id: 'planification', label: 'Planning' },
		{ id: 'limitations', label: 'Limitations' },
		{ id: 'orientation', label: 'Orientation' }
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
		window.print();
		if (onPrint) onPrint();
	}

	function saveDocument() {
		// Récupérer le contenu de tous les éditeurs
		const updatedData = {
			...prescriptionData,
			conseils: conseilsEditor?.getContent() || prescriptionData.conseils,
			objectifs: objectifsEditor?.getContent() || prescriptionData.objectifs,
			benefices: beneficesEditor?.getContent() || prescriptionData.benefices,
			planification: planificationEditor?.getContent() || prescriptionData.planification,
			limitations: limitationsEditor?.getContent() || prescriptionData.limitations
		};

		supabase
			.from('llm_responses')
			.update({
				response_content: {
					...aiResponse,
					prescription: updatedData,
					doctor: doctorInfo,
					patient: patientInfo
				},
				updated_at: new Date().toISOString()
			})
			.eq('submission_id', submissionId);
			
		if (onUpdate) onUpdate(aiResponse);
	}

	function emailDocument() {
		const email = prompt('Email du patient :');
		if (email) {
			// TODO: Implémenter l'envoi par email avec EmailJS
			if (onEmail) onEmail();
		}
	}

	// Fonction pour extraire le texte HTML sans balises
	function stripHtml(html: string): string {
		const tmp = document.createElement('div');
		tmp.innerHTML = html;
		return tmp.textContent || tmp.innerText || '';
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
		font-family: 'Lato', sans-serif;
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

	.main-layout {
		flex: 1;
		display: grid;
		grid-template-columns: 600px 1fr;
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
		padding: 0.5rem 1rem;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 13px;
		font-weight: 600;
		transition: all 0.3s ease;
		font-family: 'Lato', sans-serif;
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
		margin-bottom: 0.75rem;
		font-size: 14px;
		text-transform: uppercase;
	}

	.form-input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-family: 'Lato', sans-serif;
		font-size: 14px;
		transition: all 0.3s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: #003087;
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
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

	/* Document styles */
	.document-header {
		text-align: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 3px solid #003087;
	}

	.document-title {
		font-size: 24px;
		font-weight: 900;
		color: #003087;
		text-transform: uppercase;
		margin-bottom: 0.5rem;
	}

	.section-box {
		border: 1px solid #000;
		margin: 1.5rem 0;
		padding: 1rem;
	}

	.section-header {
		background: #f0f0f0;
		margin: -1rem -1rem 1rem -1rem;
		padding: 0.75rem 1rem;
		font-weight: 700;
		text-transform: uppercase;
		font-size: 12px;
		border-bottom: 1px solid #000;
	}

	.preview-content {
		padding: 1rem;
		line-height: 1.8;
	}

	:global(.preview-content h3) {
		color: #003087;
		font-weight: 700;
		margin: 1rem 0 0.5rem;
	}

	:global(.preview-content ul),
	:global(.preview-content ol) {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	:global(.preview-content li) {
		margin: 0.5rem 0;
	}

	:global(.preview-content p) {
		margin: 0.5rem 0;
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
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		background: white;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 14px;
		transition: all 0.3s ease;
		font-family: 'Lato', sans-serif;
		font-weight: 600;
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
			background: white !important;
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
		<div class="toolbar-buttons">
			<button class="btn" onclick={printDocument}>
				Imprimer
			</button>
			<button class="btn" onclick={emailDocument}>
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
				{#if currentSection === 'conseils'}
					<div class="form-group">
						<label class="form-label">Conseils Pratiques</label>
						<TiptapEditor 
							bind:this={conseilsEditor}
							bind:content={prescriptionData.conseils}
							placeholder="Entrez les conseils pratiques pour le patient..."
							minHeight="400px"
						/>
					</div>
				{:else if currentSection === 'objectifs'}
					<div class="form-group">
						<label class="form-label">Objectifs Thérapeutiques</label>
						<TiptapEditor 
							bind:this={objectifsEditor}
							bind:content={prescriptionData.objectifs}
							placeholder="Définissez les objectifs thérapeutiques..."
							minHeight="300px"
						/>
					</div>
				{:else if currentSection === 'benefices'}
					<div class="form-group">
						<label class="form-label">Bénéfices Attendus</label>
						<TiptapEditor 
							bind:this={beneficesEditor}
							bind:content={prescriptionData.benefices}
							placeholder="Listez les bénéfices attendus..."
							minHeight="300px"
						/>
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
						<input type="text" class="form-input" bind:value={prescriptionData.programme.endurance.type} />
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
					<hr style="margin: 2rem 0; border: 1px solid #e5e7eb;">
					<div class="form-group">
						<label class="form-label">Étirements - Fréquence</label>
						<input type="text" class="form-input" bind:value={prescriptionData.programme.etirements.frequency} />
					</div>
					<div class="form-group">
						<label class="form-label">Étirements - Durée</label>
						<input type="text" class="form-input" bind:value={prescriptionData.programme.etirements.duration} />
					</div>
				{:else if currentSection === 'planification'}
					<div class="form-group">
						<label class="form-label">Planning Hebdomadaire</label>
						<TiptapEditor 
							bind:this={planificationEditor}
							bind:content={prescriptionData.planification}
							placeholder="Définissez le planning hebdomadaire..."
							minHeight="350px"
						/>
					</div>
				{:else if currentSection === 'limitations'}
					<div class="form-group">
						<label class="form-label">Limitations et Précautions</label>
						<TiptapEditor 
							bind:this={limitationsEditor}
							bind:content={prescriptionData.limitations}
							placeholder="Listez les limitations et précautions..."
							minHeight="250px"
						/>
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
				{/if}
			</div>
		</div>

		<!-- Preview Panel (Right) -->
		<div class="preview-panel">
			<div class="preview-document" id="preview-content">
				<!-- Page 1: Recommandations -->
				<div class="page">
					<div class="document-header">
						<h1 class="document-title">Recommandations d'Activité Physique Adaptée</h1>
						<div style="display: flex; justify-content: space-between; margin-top: 1rem; font-size: 12px;">
							<span>{doctorInfo.name}</span>
							<span>Date : {documentDate}</span>
						</div>
					</div>

					<!-- Conseils Pratiques -->
					<div class="section-box">
						<div class="section-header">CONSEILS PRATIQUES</div>
						<div class="preview-content">
							{@html prescriptionData.conseils}
						</div>
					</div>

					<!-- Objectifs -->
					<div class="section-box">
						<div class="section-header">OBJECTIFS THÉRAPEUTIQUES</div>
						<div class="preview-content">
							{@html prescriptionData.objectifs}
						</div>
					</div>

					<!-- Bénéfices -->
					<div class="section-box">
						<div class="section-header">BÉNÉFICES ATTENDUS</div>
						<div class="preview-content">
							{@html prescriptionData.benefices}
						</div>
					</div>

					<!-- Planning -->
					<div class="section-box">
						<div class="section-header">PLANNING HEBDOMADAIRE</div>
						<div class="preview-content">
							{@html prescriptionData.planification}
						</div>
					</div>

					<div class="footer-text">
						Ces conseils ne remplacent pas une consultation médicale
					</div>
				</div>

				<!-- Page 2: Ordonnance -->
				<div class="page">
					<div class="document-header">
						<h1 class="document-title">Prescription d'Activité Physique Adaptée</h1>
					</div>

					<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
						<div style="border: 2px solid #000; padding: 1rem; font-size: 11px;">
							<strong>{doctorInfo.name}</strong><br>
							Spécialité : {doctorInfo.specialty}<br>
							RPPS : {doctorInfo.rpps}<br>
							Adresse : {doctorInfo.address}<br>
							Téléphone : {doctorInfo.phone}
						</div>
						<div style="border: 2px solid #000; padding: 1rem; font-size: 11px;">
							<strong>Patient :</strong><br>
							{patientInfo.name}<br>
							Né(e) le : {patientInfo.birthDate}<br>
							{patientInfo.address}<br>
							{patientInfo.city}
						</div>
					</div>

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
							</div>
						</div>
					</div>

					<!-- Limitations -->
					<div class="section-box">
						<div class="section-header">LIMITATIONS</div>
						<div class="preview-content" style="color: #dc2626;">
							{@html prescriptionData.limitations}
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
					style="width: 100%; min-height: 80px; padding: 0.5rem; border: 2px solid #e5e7eb; border-radius: 0.25rem; font-family: 'Lato', sans-serif;"
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