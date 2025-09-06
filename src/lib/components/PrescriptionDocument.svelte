<script lang="ts">
	import type { AIRecommendation } from '$lib/services/vertexAI';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	
	let {
		type = 'apa', // 'apa' | 'inaptitude' | 'caci' | 'kine' | 'balneo'
		aiRecommendations = null,
		patientInfo = {},
		onSave,
		onPrint,
		onEmail
	}: {
		type?: string;
		aiRecommendations?: AIRecommendation | null;
		patientInfo?: any;
		onSave?: (content: string) => void;
		onPrint?: () => void;
		onEmail?: (content: string) => void;
	} = $props();

	let doctorInfo = $state({
		name: '',
		title: 'Docteur',
		signature: '',
		rpps: '',
		address: '',
		phone: '',
		email: ''
	});

	let documentContent = $state('');
	let isEditing = $state(true);
	let selectedTemplate = $state(type);
	let documentDate = new Date().toLocaleDateString('fr-FR');
	
	// Editable fields for each template
	let prescriptionFields = $state({
		duration: '3 mois',
		activity: '',
		limitations: '',
		intervenant: 'Éducateur APA',
		patientName: patientInfo?.name || '',
		patientBirthDate: patientInfo?.birthDate || '',
		patientAddress: patientInfo?.address || '',
		sport: '',
		indication: '',
		exercises: '',
		region: '',
		pathology: '',
		antecedents: ''
	});

	onMount(async () => {
		// Load doctor info
		const authUser = (await supabase.auth.getUser()).data.user;
		if (authUser) {
			const { data } = await supabase
				.from('users')
				.select('*')
				.eq('email', authUser.email)
				.single();
			if (data) {
				doctorInfo.name = `${data.first_name} ${data.last_name}`;
				doctorInfo.signature = data.signature || '';
				doctorInfo.rpps = data.rpps || '';
			}
		}
		
		// Initialize content based on AI recommendations if available
		if (aiRecommendations) {
			initializeFromAI();
		} else {
			loadTemplate(selectedTemplate);
		}
	});
	
	function initializeFromAI() {
		if (!aiRecommendations) return;
		
		// Auto-fill based on AI recommendations
		prescriptionFields.activity = aiRecommendations.programme_perso?.endurance || '';
		prescriptionFields.limitations = aiRecommendations.contraindications?.join(', ') || '';
		prescriptionFields.exercises = [
			aiRecommendations.programme_perso?.endurance,
			aiRecommendations.programme_perso?.renforcement,
			aiRecommendations.programme_perso?.etirements
		].filter(Boolean).join('\n');
		
		loadTemplate(selectedTemplate);
	}
	
	function loadTemplate(templateType: string) {
		selectedTemplate = templateType;
		
		switch(templateType) {
			case 'apa':
				documentContent = `
<div class="document-header">
	<h1>PRESCRIPTION D'ACTIVITÉ PHYSIQUE ADAPTÉE</h1>
	<div class="header-info">
		<div>Dr. ${doctorInfo.name}</div>
		<div>Date : ${documentDate}</div>
	</div>
</div>

<div class="document-body">
	<p class="intro">Je prescris une activité physique et/ou sportive adaptée</p>
	
	<div class="field-group">
		<label>Pendant :</label>
		<span class="field-value editable" contenteditable="${isEditing}">${prescriptionFields.duration}</span>, à adapter en fonction de l'évolution des aptitudes du patient.
	</div>
	
	<div class="field-group">
		<label>Préconisation d'activité et recommandations :</label>
		<div class="field-value editable multiline" contenteditable="${isEditing}">${prescriptionFields.activity || aiRecommendations?.planification || 'À définir'}</div>
	</div>
	
	<div class="field-group">
		<label>Limitations :</label>
		<div class="field-value editable multiline" contenteditable="${isEditing}">${prescriptionFields.limitations || 'Aucune limitation particulière'}</div>
	</div>
	
	<div class="field-group">
		<label>Type d'intervenant(s) appelé(s) à dispenser l'activité physique :</label>
		<span class="field-value editable" contenteditable="${isEditing}">${prescriptionFields.intervenant}</span>
	</div>
	
	<div class="note-box">
		<p><strong>Merci de joindre lors du suivi :</strong></p>
		<ul>
			<li>La satisfaction et la motivation du patient</li>
			<li>Les progrès</li>
			<li>Les résultats des tests de condition physique si disponible</li>
			<li>Les effets indésirables ressentis par le patient</li>
			<li>Les propositions pour pérenniser l'activité physique</li>
		</ul>
	</div>
	
	<p class="disclaimer">La dispensation de l'activité physique adaptée ne peut pas donner lieu à une prise en charge par l'assurance maladie</p>
	
	<p class="footer-note">Document remis en main propre</p>
</div>

<div class="signature-section">
	<div class="signature-block">
		<div class="signature-line"></div>
		<div>Dr. ${doctorInfo.name}</div>
		${doctorInfo.rpps ? `<div>RPPS : ${doctorInfo.rpps}</div>` : ''}
	</div>
</div>`;
				break;
				
			case 'inaptitude':
				documentContent = `
<div class="document-header">
	<h1>CERTIFICAT MÉDICAL D'INAPTITUDE PARTIELLE À LA PRATIQUE DE L'ÉDUCATION PHYSIQUE ET SPORTIVE</h1>
	<div class="header-info">
		<div>Dr. ${doctorInfo.name}</div>
		<div>Date : ${documentDate}</div>
	</div>
</div>

<div class="document-body">
	<p>Je soussigné(e), Dr <span class="field-value editable inline" contenteditable="${isEditing}">${doctorInfo.name}</span>, 
	certifie avoir examiné(e) <span class="field-value editable inline" contenteditable="${isEditing}">${prescriptionFields.patientName}</span>, 
	né(e) le <span class="field-value editable inline" contenteditable="${isEditing}">${prescriptionFields.patientBirthDate}</span>, 
	et constaté que son état de santé entraîne une inaptitude partielle à la pratique de l'éducation physique et sportive (EPS)</p>
	
	<div class="checkbox-group">
		<label><input type="checkbox" ${isEditing ? '' : 'disabled'}/> Pour l'année scolaire</label>
		<label><input type="checkbox" ${isEditing ? '' : 'disabled'}/> Pour une durée de <span class="field-value editable inline" contenteditable="${isEditing}">............</span> à compter de ce jour</label>
	</div>
	
	<p><strong>Afin de permettre une adaptation de l'enseignement d'EPS aux possibilités de l'élève, il est nécessaire :</strong></p>
	
	<div class="checkbox-group">
		<label><input type="checkbox" ${isEditing ? '' : 'disabled'}/> d'aménager les activités physiques qui sollicitent les articulations suivantes : 
			<span class="field-value editable inline" contenteditable="${isEditing}">............</span>
		</label>
		<label><input type="checkbox" ${isEditing ? '' : 'disabled'}/> d'aménager les activités physiques qui sollicitent les fonctions cardio-respiratoires</label>
	</div>
	
	<p><strong>Il est préférable :</strong></p>
	<div class="checkbox-group">
		<label><input type="checkbox" ${isEditing ? '' : 'disabled'}/> de privilégier les activités d'intensité modérée sur des durées prolongées</label>
		<label><input type="checkbox" ${isEditing ? '' : 'disabled'}/> de permettre à l'élève de faire des pauses pendant l'effort si nécessaire</label>
		<label><input type="checkbox" ${isEditing ? '' : 'disabled'}/> d'adapter les temps de récupération</label>
	</div>
	
	<p class="note">L'essoufflement n'est pas un signe d'appel pour arrêter ou aménager l'activité.</p>
	
	<div class="field-group">
		<label>Autres recommandations :</label>
		<div class="field-value editable multiline" contenteditable="${isEditing}">............</div>
	</div>
</div>

<div class="signature-section">
	<div class="signature-block">
		<div class="signature-line"></div>
		<div>Dr. ${doctorInfo.name}</div>
		${doctorInfo.rpps ? `<div>RPPS : ${doctorInfo.rpps}</div>` : ''}
	</div>
</div>`;
				break;
				
			case 'caci':
				documentContent = `
<div class="document-header">
	<h1>CERTIFICAT ATTESTANT DE L'ABSENCE DE CONTRE INDICATION À LA PRATIQUE DU SPORT</h1>
	<div class="header-info">
		<div>Dr. ${doctorInfo.name}</div>
		<div>Date : ${documentDate}</div>
	</div>
</div>

<div class="document-body">
	<p>Je soussigné, Docteur <span class="field-value editable inline" contenteditable="${isEditing}">${doctorInfo.name}</span>, 
	certifie, au terme de mon examen de Mr/Mme <span class="field-value editable inline" contenteditable="${isEditing}">${prescriptionFields.patientName}</span>, 
	né(e) le <span class="field-value editable inline" contenteditable="${isEditing}">${prescriptionFields.patientBirthDate}</span>, 
	demeurant <span class="field-value editable inline" contenteditable="${isEditing}">${prescriptionFields.patientAddress}</span>, 
	n'avoir pas constaté à ce jour de signes cliniques apparents évocateurs de contre-indication médicale à la pratique de 
	<span class="field-value editable inline" contenteditable="${isEditing}">${prescriptionFields.sport}</span> 
	à l'entraînement, en loisir et en compétition (dans sa catégorie d'âge).</p>
	
	<p>Certificat médical réalisé à la demande de Mr/Mme <span class="field-value editable inline" contenteditable="${isEditing}">${prescriptionFields.patientName}</span> 
	et remis en main propre pour faire valoir ce que de droit.</p>
</div>

<div class="signature-section">
	<div class="signature-block">
		<div class="signature-line"></div>
		<div>Dr. ${doctorInfo.name}</div>
		${doctorInfo.rpps ? `<div>RPPS : ${doctorInfo.rpps}</div>` : ''}
	</div>
</div>`;
				break;
				
			case 'kine':
				documentContent = `
<div class="document-header">
	<h1>ORDONNANCE DE KINÉSITHÉRAPIE</h1>
	<div class="header-info">
		<div>Dr. ${doctorInfo.name}</div>
		<div>Date : ${documentDate}</div>
	</div>
</div>

<div class="document-body">
	<p class="intro"><strong>À RÉALISER CHEZ UN KINESITHERAPEUTE</strong></p>
	
	<div class="field-group">
		<label>Indication :</label>
		<div class="field-value editable multiline" contenteditable="${isEditing}">${prescriptionFields.indication}</div>
	</div>
	
	<div class="field-group">
		<label>Exercices préconisés :</label>
		<div class="field-value editable multiline" contenteditable="${isEditing}">${prescriptionFields.exercises || aiRecommendations?.programme_perso?.renforcement || ''}</div>
	</div>
	
	<p>Nombre de séances définies lors du bilan initial avec le kiné</p>
	
	<div class="note-box">
		<p><strong>Merci de joindre lors du suivi :</strong></p>
		<ul>
			<li>La satisfaction et la motivation du patient</li>
			<li>Les progrès</li>
			<li>Les résultats des tests de condition physique si disponible</li>
			<li>Les effets indésirables ressentis par le patient</li>
			<li>Les propositions pour pérenniser l'activité physique</li>
		</ul>
	</div>
</div>

<div class="signature-section">
	<div class="signature-block">
		<div class="signature-line"></div>
		<div>Dr. ${doctorInfo.name}</div>
		${doctorInfo.rpps ? `<div>RPPS : ${doctorInfo.rpps}</div>` : ''}
	</div>
</div>`;
				break;
				
			case 'balneo':
				documentContent = `
<div class="document-header">
	<h1>PRESCRIPTION DE RÉÉDUCATION PAR BALNÉOTHÉRAPIE</h1>
	<div class="header-info">
		<div>Dr. ${doctorInfo.name}</div>
		<div>Date : ${documentDate}</div>
	</div>
</div>

<div class="document-body">
	<p>Merci de réaliser d'un bilan de rééducation initial et de séances de balnéothérapie dans le cadre des prises en charges suivantes :</p>
	
	<div class="field-group">
		<label>- Région à traiter :</label>
		<span class="field-value editable inline" contenteditable="${isEditing}">${prescriptionFields.region}</span>
	</div>
	
	<div class="field-group">
		<label>- Limitation :</label>
		<span class="field-value editable inline" contenteditable="${isEditing}">${prescriptionFields.limitations}</span>
	</div>
	
	<div class="checkbox-group">
		<label><input type="checkbox" ${isEditing ? '' : 'disabled'}/> Rééducation à la marche</label>
		<label><input type="checkbox" ${isEditing ? '' : 'disabled'}/> Réentrainement à l'effort</label>
		<label><input type="checkbox" ${isEditing ? '' : 'disabled'}/> Travail de la proprioception</label>
		<label><input type="checkbox" ${isEditing ? '' : 'disabled'}/> Travail fonctionnel varié</label>
	</div>
	
	<div class="field-group">
		<label>dans le cadre de la prise en charge d'un patient présentant une</label>
		<span class="field-value editable inline" contenteditable="${isEditing}">${prescriptionFields.pathology}</span>
	</div>
	
	<div class="field-group">
		<label>Si impact sur la rééducation, antécédents notables :</label>
		<div class="field-value editable multiline" contenteditable="${isEditing}">${prescriptionFields.antecedents}</div>
	</div>
	
	<div class="note-box">
		<p><strong>Merci de joindre lors du suivi :</strong></p>
		<ul>
			<li>La satisfaction et la motivation du patient</li>
			<li>Les progrès</li>
			<li>Les résultats des tests de condition physique si disponible</li>
			<li>Les effets indésirables ressentis par le patient</li>
			<li>Les propositions pour pérenniser l'activité physique</li>
		</ul>
	</div>
</div>

<div class="signature-section">
	<div class="signature-block">
		<div class="signature-line"></div>
		<div>Dr. ${doctorInfo.name}</div>
		${doctorInfo.rpps ? `<div>RPPS : ${doctorInfo.rpps}</div>` : ''}
	</div>
</div>`;
				break;
		}
	}
	
	function toggleEdit() {
		isEditing = !isEditing;
		if (!isEditing && onSave) {
			const content = document.querySelector('.document-container')?.innerHTML || '';
			onSave(content);
		}
	}
	
	function printDocument() {
		window.print();
		if (onPrint) onPrint();
	}
	
	function emailDocument() {
		if (onEmail) {
			const content = document.querySelector('.document-container')?.innerHTML || '';
			onEmail(content);
		}
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&family=Arial&family=Calibri&display=swap');
	
	.prescription-container {
		font-family: 'Calibri', 'Arial', sans-serif;
		background: transparent;
		padding: 0;
	}
	
	.toolbar {
		background: white;
		border: 1px solid #d0d0d0;
		border-radius: 4px;
		padding: 0.75rem;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}
	
	.toolbar-section {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0 1rem;
		border-right: 1px solid #e0e0e0;
	}
	
	.toolbar-section:last-child {
		border-right: none;
	}
	
	.template-selector {
		padding: 0.5rem 1rem;
		border: 1px solid #d0d0d0;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		font-size: 0.9rem;
	}
	
	.toolbar-btn {
		padding: 0.5rem 1rem;
		border: 1px solid #d0d0d0;
		border-radius: 4px;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.toolbar-btn:hover {
		background: #f0f0f0;
		border-color: #0066cc;
	}
	
	.toolbar-btn.primary {
		background: #0066cc;
		color: white;
		border-color: #0066cc;
	}
	
	.toolbar-btn.primary:hover {
		background: #0052a3;
	}
	
	.document-wrapper {
		max-width: 100%;
		background: white;
		border: 1px solid #d0d0d0;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.08);
	}
	
	.document-container {
		background: white;
		padding: 40px;
		min-height: 600px;
		line-height: 1.6;
		color: #000;
		position: relative;
		border-radius: 8px;
	}
	
	.document-header {
		margin-bottom: 2rem;
		border-bottom: 2px solid #000;
		padding-bottom: 1rem;
	}
	
	.document-header h1 {
		font-size: 18px;
		font-weight: bold;
		text-align: center;
		margin: 0 0 1rem 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	
	.header-info {
		display: flex;
		justify-content: space-between;
		font-size: 14px;
		margin-top: 1rem;
	}
	
	.document-body {
		font-size: 14px;
		line-height: 1.8;
	}
	
	.intro {
		font-weight: bold;
		margin-bottom: 1.5rem;
	}
	
	.field-group {
		margin: 1.5rem 0;
	}
	
	.field-group label {
		font-weight: bold;
		display: inline-block;
		margin-bottom: 0.5rem;
	}
	
	.field-value {
		display: inline-block;
		min-width: 100px;
		padding: 2px 8px;
		margin: 0 4px;
		border-bottom: 1px solid #666;
		background: transparent;
		transition: all 0.2s ease;
	}
	
	.field-value.editable {
		background: #fffbf0;
	}
	
	.field-value.editable[contenteditable="true"]:hover {
		background: #fff3cd;
		border-bottom: 2px solid #0066cc;
	}
	
	.field-value.editable[contenteditable="true"]:focus {
		outline: none;
		background: #e7f3ff;
		border-bottom: 2px solid #0066cc;
	}
	
	.field-value.inline {
		display: inline;
		min-width: 80px;
	}
	
	.field-value.multiline {
		display: block;
		width: 100%;
		min-height: 60px;
		padding: 8px;
		border: 1px solid #d0d0d0;
		border-radius: 4px;
		margin-top: 0.5rem;
		white-space: pre-wrap;
	}
	
	.checkbox-group {
		margin: 1rem 0;
	}
	
	.checkbox-group label {
		display: block;
		margin: 0.5rem 0;
		font-weight: normal;
	}
	
	.checkbox-group input[type="checkbox"] {
		margin-right: 0.5rem;
		transform: scale(1.2);
	}
	
	.note-box {
		background: #f8f9fa;
		border: 1px solid #d0d0d0;
		border-radius: 4px;
		padding: 1rem;
		margin: 1.5rem 0;
		font-size: 13px;
	}
	
	.note-box ul {
		margin: 0.5rem 0 0 1rem;
		padding: 0;
	}
	
	.note-box li {
		margin: 0.25rem 0;
	}
	
	.disclaimer {
		font-style: italic;
		font-size: 12px;
		color: #666;
		margin-top: 2rem;
		padding: 1rem;
		background: #f9f9f9;
		border-left: 3px solid #ffc107;
	}
	
	.footer-note {
		margin-top: 2rem;
		font-weight: bold;
		text-align: center;
	}
	
	.signature-section {
		margin-top: 60px;
		width: 300px;
		text-align: center;
		margin-left: auto;
	}
	
	.signature-block {
		margin-top: 3rem;
	}
	
	.signature-line {
		border-bottom: 1px solid #000;
		margin-bottom: 0.5rem;
		height: 40px;
	}
	
	@media print {
		.prescription-container {
			background: white;
			padding: 0;
		}
		
		.toolbar {
			display: none !important;
		}
		
		.document-wrapper {
			box-shadow: none;
		}
		
		.document-container {
			padding: 40px;
		}
		
		.field-value.editable {
			background: transparent !important;
			border-bottom: 1px solid #666 !important;
		}
		
		.field-value.multiline {
			border: none !important;
			padding: 0 !important;
		}
		
		.note {
			font-size: 11px;
		}
		
		@page {
			size: A4;
			margin: 1cm;
		}
	}
	
	.edit-mode-indicator {
		position: fixed;
		top: 1rem;
		right: 1rem;
		background: #ffc107;
		color: #000;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-weight: bold;
		z-index: 1000;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
</style>

<div class="prescription-container">
	{#if isEditing}
		<div class="edit-mode-indicator">
			✏️ Mode édition
		</div>
	{/if}
	
	<div class="toolbar">
		<div class="toolbar-section">
			<label>Type de document :</label>
			<select class="template-selector" bind:value={selectedTemplate} onchange={() => loadTemplate(selectedTemplate)}>
				<option value="apa">Prescription APA</option>
				<option value="inaptitude">Certificat d'inaptitude partielle</option>
				<option value="caci">CACI</option>
				<option value="kine">Ordonnance kinésithérapie</option>
				<option value="balneo">Prescription balnéothérapie</option>
			</select>
		</div>
		
		<div class="toolbar-section">
			<button class="toolbar-btn" onclick={toggleEdit}>
				{isEditing ? '👁️ Prévisualiser' : '✏️ Modifier'}
			</button>
			<button class="toolbar-btn" onclick={printDocument}>
				🖨️ Imprimer
			</button>
			<button class="toolbar-btn" onclick={emailDocument}>
				📧 Envoyer
			</button>
		</div>
		
		<div class="toolbar-section" style="border: none;">
			<button class="toolbar-btn primary" onclick={() => {
				if (onSave) {
					const content = document.querySelector('.document-container')?.innerHTML || '';
					onSave(content);
				}
			}}>
				💾 Sauvegarder
			</button>
		</div>
	</div>
	
	<div class="document-wrapper">
		<div class="document-container">
			{@html documentContent}
		</div>
	</div>
</div>