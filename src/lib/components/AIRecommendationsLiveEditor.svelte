<script lang="ts">
	import type { AIRecommendation } from '$lib/services/vertexAI';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	
	let {
		aiResponse,
		submissionId,
		onUpdate,
		onBack,
		onPrint,
		onEmail
	}: {
		aiResponse: AIRecommendation;
		submissionId: string;
		onUpdate?: (response: AIRecommendation) => void;
		onBack?: () => void;
		onPrint?: () => void;
		onEmail?: () => void;
	} = $props();

	let doctorInfo = $state({
		name: '',
		title: 'Docteur',
		signature: '',
		rpps: '',
		address: '',
		phone: ''
	});

	let documentDate = new Date().toLocaleDateString('fr-FR');
	let editedResponse = $state({ ...aiResponse });
	let currentSection = $state('conseils');
	let previewRef = $state<HTMLDivElement>();

	const sections = [
		{ id: 'conseils', label: 'Conseils Pratiques', icon: '📋' },
		{ id: 'objectifs', label: 'Objectifs Thérapeutiques', icon: '🎯' },
		{ id: 'benefices', label: 'Bénéfices Attendus', icon: '✨' },
		{ id: 'programme', label: 'Programme Personnalisé', icon: '💪' },
		{ id: 'planification', label: 'Planning Hebdomadaire', icon: '📅' },
		{ id: 'orientation', label: 'Orientation et Suivi', icon: '🏥' }
	];

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
				doctorInfo.name = `Dr. ${data.first_name} ${data.last_name}`;
				doctorInfo.signature = `Dr. ${data.first_name} ${data.last_name}`;
				doctorInfo.rpps = data.rpps || '';
			}
		}
	});

	function saveDocument() {
		if (onUpdate) {
			onUpdate(editedResponse);
		}
		// Save to database
		supabase
			.from('llm_responses')
			.update({
				response_content: editedResponse,
				updated_at: new Date().toISOString()
			})
			.eq('submission_id', submissionId);
	}

	function printDocument() {
		const printWindow = window.open('', '_blank');
		if (printWindow && previewRef) {
			printWindow.document.write(`
				<!DOCTYPE html>
				<html>
				<head>
					<title>Prescription d'Activité Physique Adaptée</title>
					<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
					<style>
						@page { size: A4; margin: 1cm; }
						body { font-family: 'Lato', Arial, sans-serif; margin: 0; padding: 0; }
						.page { page-break-after: always; min-height: 297mm; }
					</style>
				</head>
				<body>
					${previewRef.innerHTML}
				</body>
				</html>
			`);
			printWindow.document.close();
			printWindow.print();
		}
		if (onPrint) onPrint();
	}

	function updateConseil(index: number, value: string) {
		editedResponse.conseils[index] = value;
	}

	function addConseil() {
		editedResponse.conseils = [...editedResponse.conseils, 'Nouveau conseil'];
	}

	function removeConseil(index: number) {
		editedResponse.conseils = editedResponse.conseils.filter((_, i) => i !== index);
	}

	function updateObjectif(index: number, value: string) {
		editedResponse.objectifs[index] = value;
	}

	function addObjectif() {
		editedResponse.objectifs = [...editedResponse.objectifs, 'Nouvel objectif'];
	}

	function removeObjectif(index: number) {
		editedResponse.objectifs = editedResponse.objectifs.filter((_, i) => i !== index);
	}

	function updateBenefice(index: number, value: string) {
		editedResponse.benefices[index] = value;
	}

	function addBenefice() {
		editedResponse.benefices = [...editedResponse.benefices, 'Nouveau bénéfice'];
	}

	function removeBenefice(index: number) {
		editedResponse.benefices = editedResponse.benefices.filter((_, i) => i !== index);
	}

	function updateOrientation(index: number, value: string) {
		editedResponse.orientation[index] = value;
	}

	function addOrientation() {
		editedResponse.orientation = [...editedResponse.orientation, 'Nouvelle orientation'];
	}

	function removeOrientation(index: number) {
		editedResponse.orientation = editedResponse.orientation.filter((_, i) => i !== index);
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');
	
	.container {
		font-family: "Lato", sans-serif;
		background: #f5f7fa;
		min-height: 100vh;
		display: flex;
		flex-direction: column;
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
		align-items: center;
	}

	.btn {
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		border: 2px solid transparent;
		font-family: "Lato", sans-serif;
		background: rgba(255, 255, 255, 0.1);
		color: white;
		backdrop-filter: blur(10px);
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
		font-weight: 700;
	}

	.btn.primary:hover {
		background: #f0f7ff;
	}

	.main-content {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		padding: 2rem;
		max-width: 1600px;
		margin: 0 auto;
		width: 100%;
	}

	.editor-panel {
		background: white;
		border-radius: 8px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
		padding: 2rem;
		overflow-y: auto;
		max-height: calc(100vh - 200px);
	}

	.preview-panel {
		background: white;
		border-radius: 8px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
		overflow-y: auto;
		max-height: calc(100vh - 200px);
		position: relative;
	}

	.preview-document {
		padding: 40px;
		font-size: 12px;
		line-height: 1.6;
		color: #000;
		background: white;
		min-height: 100%;
	}

	.section-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 2px solid #e5e7eb;
		padding-bottom: 0.5rem;
	}

	.tab {
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		color: #6b7280;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		border-radius: 0.5rem 0.5rem 0 0;
		font-family: "Lato", sans-serif;
	}

	.tab.active {
		background: #003087;
		color: white;
	}

	.tab:hover:not(.active) {
		background: #f3f4f6;
	}

	.editor-section {
		display: none;
	}

	.editor-section.active {
		display: block;
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

	.form-input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-family: "Lato", sans-serif;
		font-size: 14px;
		transition: all 0.3s ease;
	}

	.form-input:focus {
		outline: none;
		border-color: #003087;
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
	}

	.form-textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-family: "Lato", sans-serif;
		font-size: 14px;
		min-height: 100px;
		resize: vertical;
		transition: all 0.3s ease;
	}

	.form-textarea:focus {
		outline: none;
		border-color: #003087;
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
	}

	.list-editor {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.list-item {
		display: flex;
		gap: 0.5rem;
		align-items: start;
	}

	.list-item-input {
		flex: 1;
		padding: 0.5rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-family: "Lato", sans-serif;
		font-size: 14px;
	}

	.list-item-input:focus {
		outline: none;
		border-color: #003087;
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
	}

	.btn-icon {
		padding: 0.5rem;
		background: #ef4444;
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-icon:hover {
		background: #dc2626;
	}

	.btn-add {
		padding: 0.5rem 1rem;
		background: #10b981;
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.3s ease;
		margin-top: 0.5rem;
	}

	.btn-add:hover {
		background: #059669;
	}

	/* Preview styles */
	.page {
		min-height: 297mm;
		padding: 40px;
		background: white;
		margin-bottom: 20px;
		box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
		position: relative;
	}

	.page-header {
		text-align: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 3px solid #003087;
	}

	.page-title {
		font-size: 20px;
		font-weight: 900;
		color: #003087;
		text-transform: uppercase;
		margin-bottom: 0.5rem;
	}

	.page-subtitle {
		font-size: 16px;
		font-weight: 700;
		color: #003087;
		margin-bottom: 0.5rem;
	}

	.page-info {
		display: flex;
		justify-content: space-between;
		margin-top: 0.5rem;
		font-size: 11px;
		color: #666;
	}

	.section-content {
		margin: 1.5rem 0;
	}

	.section-title {
		font-size: 14px;
		font-weight: 700;
		color: #003087;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border-left: 4px solid #003087;
		padding-left: 1rem;
	}

	.conseil-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.conseil-item {
		padding: 0.75rem;
		margin-bottom: 0.5rem;
		background: #f8f9fa;
		border-radius: 4px;
		display: flex;
		align-items: start;
		gap: 0.75rem;
	}

	.conseil-number {
		font-weight: 700;
		color: #003087;
		min-width: 20px;
	}

	.programme-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-top: 1rem;
	}

	.programme-item {
		padding: 0.75rem;
		background: #f8f9fa;
		border-radius: 4px;
		border-left: 3px solid #003087;
	}

	.programme-label {
		font-weight: 700;
		color: #003087;
		margin-bottom: 0.5rem;
		font-size: 11px;
		text-transform: uppercase;
	}

	.signature-section {
		position: absolute;
		bottom: 40px;
		left: 40px;
		right: 40px;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding-top: 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.signature-block {
		text-align: center;
		min-width: 200px;
	}

	.signature-line {
		border-bottom: 2px solid #000;
		margin-bottom: 0.5rem;
		height: 40px;
	}

	.disclaimer {
		background: #fff3cd;
		border: 1px solid #ffc107;
		border-radius: 4px;
		padding: 0.75rem;
		margin-top: 1rem;
		font-size: 11px;
		color: #856404;
		text-align: center;
	}

	.watermark {
		position: absolute;
		top: 10px;
		right: 10px;
		background: #003087;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
	}
</style>

<div class="container">
	<!-- Toolbar -->
	<div class="toolbar">
		<div class="toolbar-buttons">
			<button class="btn" onclick={printDocument}>
				🖨️ Imprimer
			</button>
			<button class="btn" onclick={() => {
				const email = prompt('Email du patient :');
				if (email && onEmail) onEmail();
			}}>
				📧 Envoyer par mail
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

	<!-- Main Content -->
	<div class="main-content">
		<!-- Editor Panel -->
		<div class="editor-panel">
			<h2 style="margin-bottom: 1.5rem; color: #003087;">✏️ Éditeur de Prescription</h2>
			
			<!-- Section Tabs -->
			<div class="section-tabs">
				{#each sections as section}
					<button 
						class="tab {currentSection === section.id ? 'active' : ''}"
						onclick={() => currentSection = section.id}
					>
						{section.icon} {section.label}
					</button>
				{/each}
			</div>

			<!-- Editor Sections -->
			<div class="editor-section {currentSection === 'conseils' ? 'active' : ''}">
				<div class="form-group">
					<label class="form-label">Conseils Pratiques</label>
					<div class="list-editor">
						{#each editedResponse.conseils as conseil, i}
							<div class="list-item">
								<input 
									type="text" 
									class="list-item-input"
									value={conseil}
									oninput={(e) => updateConseil(i, e.currentTarget.value)}
									placeholder="Entrez un conseil..."
								/>
								<button class="btn-icon" onclick={() => removeConseil(i)}>
									🗑️
								</button>
							</div>
						{/each}
						<button class="btn-add" onclick={addConseil}>
							➕ Ajouter un conseil
						</button>
					</div>
				</div>
			</div>

			<div class="editor-section {currentSection === 'objectifs' ? 'active' : ''}">
				<div class="form-group">
					<label class="form-label">Objectifs Thérapeutiques</label>
					<div class="list-editor">
						{#each editedResponse.objectifs as objectif, i}
							<div class="list-item">
								<input 
									type="text" 
									class="list-item-input"
									value={objectif}
									oninput={(e) => updateObjectif(i, e.currentTarget.value)}
									placeholder="Entrez un objectif..."
								/>
								<button class="btn-icon" onclick={() => removeObjectif(i)}>
									🗑️
								</button>
							</div>
						{/each}
						<button class="btn-add" onclick={addObjectif}>
							➕ Ajouter un objectif
						</button>
					</div>
				</div>
			</div>

			<div class="editor-section {currentSection === 'benefices' ? 'active' : ''}">
				<div class="form-group">
					<label class="form-label">Bénéfices Attendus</label>
					<div class="list-editor">
						{#each editedResponse.benefices as benefice, i}
							<div class="list-item">
								<input 
									type="text" 
									class="list-item-input"
									value={benefice}
									oninput={(e) => updateBenefice(i, e.currentTarget.value)}
									placeholder="Entrez un bénéfice..."
								/>
								<button class="btn-icon" onclick={() => removeBenefice(i)}>
									🗑️
								</button>
							</div>
						{/each}
						<button class="btn-add" onclick={addBenefice}>
							➕ Ajouter un bénéfice
						</button>
					</div>
				</div>
			</div>

			<div class="editor-section {currentSection === 'programme' ? 'active' : ''}">
				<div class="form-group">
					<label class="form-label">Programme - Endurance</label>
					<textarea 
						class="form-textarea"
						bind:value={editedResponse.programme_perso.endurance}
						placeholder="Décrivez le programme d'endurance..."
					></textarea>
				</div>
				<div class="form-group">
					<label class="form-label">Programme - Renforcement</label>
					<textarea 
						class="form-textarea"
						bind:value={editedResponse.programme_perso.renforcement}
						placeholder="Décrivez le programme de renforcement..."
					></textarea>
				</div>
				<div class="form-group">
					<label class="form-label">Programme - Étirements</label>
					<textarea 
						class="form-textarea"
						bind:value={editedResponse.programme_perso.etirements}
						placeholder="Décrivez le programme d'étirements..."
					></textarea>
				</div>
				<div class="form-group">
					<label class="form-label">Programme - Équilibre</label>
					<textarea 
						class="form-textarea"
						bind:value={editedResponse.programme_perso.equilibre}
						placeholder="Décrivez le programme d'équilibre..."
					></textarea>
				</div>
			</div>

			<div class="editor-section {currentSection === 'planification' ? 'active' : ''}">
				<div class="form-group">
					<label class="form-label">Planning Hebdomadaire</label>
					<textarea 
						class="form-textarea"
						bind:value={editedResponse.planification}
						placeholder="Décrivez le planning hebdomadaire..."
						style="min-height: 200px;"
					></textarea>
				</div>
			</div>

			<div class="editor-section {currentSection === 'orientation' ? 'active' : ''}">
				<div class="form-group">
					<label class="form-label">Orientation et Suivi</label>
					<div class="list-editor">
						{#each editedResponse.orientation as orient, i}
							<div class="list-item">
								<input 
									type="text" 
									class="list-item-input"
									value={orient}
									oninput={(e) => updateOrientation(i, e.currentTarget.value)}
									placeholder="Entrez une orientation..."
								/>
								<button class="btn-icon" onclick={() => removeOrientation(i)}>
									🗑️
								</button>
							</div>
						{/each}
						<button class="btn-add" onclick={addOrientation}>
							➕ Ajouter une orientation
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Preview Panel -->
		<div class="preview-panel">
			<div class="watermark">Aperçu PDF</div>
			<div class="preview-document" bind:this={previewRef}>
				<!-- Page 1: Conseils -->
				<div class="page">
					<div class="page-header">
						<h1 class="page-title">Prescription d'Activité Physique Adaptée</h1>
						<h2 class="page-subtitle">📋 Conseils Pratiques</h2>
						<div class="page-info">
							<span>{doctorInfo.name}</span>
							<span>Date : {documentDate}</span>
						</div>
					</div>
					
					<div class="section-content">
						<p style="margin-bottom: 1.5rem; line-height: 1.8;">
							Je soussigné, {doctorInfo.name}, docteur en médecine, prescris au patient les conseils pratiques suivants dans le cadre d'une activité physique adaptée :
						</p>
						<ul class="conseil-list">
							{#each editedResponse.conseils as conseil, i}
								<li class="conseil-item">
									<span class="conseil-number">{i + 1}.</span>
									<span>{conseil}</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class="signature-section">
						<div class="signature-block">
							<div>Fait à ________________</div>
							<div>Le {documentDate}</div>
						</div>
						<div class="signature-block">
							<div class="signature-line"></div>
							<div>{doctorInfo.signature}</div>
							{#if doctorInfo.rpps}
								<div style="font-size: 10px;">RPPS : {doctorInfo.rpps}</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Page 2: Objectifs -->
				<div class="page">
					<div class="page-header">
						<h1 class="page-title">Prescription d'Activité Physique Adaptée</h1>
						<h2 class="page-subtitle">🎯 Objectifs Thérapeutiques</h2>
						<div class="page-info">
							<span>{doctorInfo.name}</span>
							<span>Date : {documentDate}</span>
						</div>
					</div>
					
					<div class="section-content">
						<p style="margin-bottom: 1.5rem; line-height: 1.8;">
							Les objectifs thérapeutiques suivants ont été définis en fonction de l'état de santé et des capacités du patient :
						</p>
						<ul class="conseil-list">
							{#each editedResponse.objectifs as objectif, i}
								<li class="conseil-item">
									<span class="conseil-number">•</span>
									<span>{objectif}</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class="signature-section">
						<div class="signature-block">
							<div>Fait à ________________</div>
							<div>Le {documentDate}</div>
						</div>
						<div class="signature-block">
							<div class="signature-line"></div>
							<div>{doctorInfo.signature}</div>
							{#if doctorInfo.rpps}
								<div style="font-size: 10px;">RPPS : {doctorInfo.rpps}</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Page 3: Bénéfices -->
				<div class="page">
					<div class="page-header">
						<h1 class="page-title">Prescription d'Activité Physique Adaptée</h1>
						<h2 class="page-subtitle">✨ Bénéfices Attendus</h2>
						<div class="page-info">
							<span>{doctorInfo.name}</span>
							<span>Date : {documentDate}</span>
						</div>
					</div>
					
					<div class="section-content">
						<p style="margin-bottom: 1.5rem; line-height: 1.8;">
							Les bénéfices attendus de ce programme d'activité physique adaptée sont les suivants :
						</p>
						<ul class="conseil-list">
							{#each editedResponse.benefices as benefice, i}
								<li class="conseil-item">
									<span class="conseil-number">•</span>
									<span>{benefice}</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class="signature-section">
						<div class="signature-block">
							<div>Fait à ________________</div>
							<div>Le {documentDate}</div>
						</div>
						<div class="signature-block">
							<div class="signature-line"></div>
							<div>{doctorInfo.signature}</div>
							{#if doctorInfo.rpps}
								<div style="font-size: 10px;">RPPS : {doctorInfo.rpps}</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Page 4: Programme -->
				<div class="page">
					<div class="page-header">
						<h1 class="page-title">Prescription d'Activité Physique Adaptée</h1>
						<h2 class="page-subtitle">💪 Programme Personnalisé</h2>
						<div class="page-info">
							<span>{doctorInfo.name}</span>
							<span>Date : {documentDate}</span>
						</div>
					</div>
					
					<div class="section-content">
						<p style="margin-bottom: 1.5rem; line-height: 1.8;">
							Programme d'activité physique personnalisé adapté aux besoins et capacités du patient :
						</p>
						<div class="programme-grid">
							<div class="programme-item">
								<div class="programme-label">Endurance</div>
								<div>{editedResponse.programme_perso.endurance}</div>
							</div>
							<div class="programme-item">
								<div class="programme-label">Renforcement</div>
								<div>{editedResponse.programme_perso.renforcement}</div>
							</div>
							<div class="programme-item">
								<div class="programme-label">Étirements</div>
								<div>{editedResponse.programme_perso.etirements}</div>
							</div>
							<div class="programme-item">
								<div class="programme-label">Équilibre</div>
								<div>{editedResponse.programme_perso.equilibre || 'À définir selon évaluation'}</div>
							</div>
						</div>
					</div>

					<div class="signature-section">
						<div class="signature-block">
							<div>Fait à ________________</div>
							<div>Le {documentDate}</div>
						</div>
						<div class="signature-block">
							<div class="signature-line"></div>
							<div>{doctorInfo.signature}</div>
							{#if doctorInfo.rpps}
								<div style="font-size: 10px;">RPPS : {doctorInfo.rpps}</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Page 5: Planning -->
				<div class="page">
					<div class="page-header">
						<h1 class="page-title">Prescription d'Activité Physique Adaptée</h1>
						<h2 class="page-subtitle">📅 Planning Hebdomadaire</h2>
						<div class="page-info">
							<span>{doctorInfo.name}</span>
							<span>Date : {documentDate}</span>
						</div>
					</div>
					
					<div class="section-content">
						<p style="margin-bottom: 1.5rem; line-height: 1.8;">
							Planning hebdomadaire recommandé pour optimiser les bénéfices de l'activité physique :
						</p>
						<div style="background: #f8f9fa; padding: 1.5rem; border-radius: 4px; line-height: 2;">
							{editedResponse.planification}
						</div>
					</div>

					<div class="signature-section">
						<div class="signature-block">
							<div>Fait à ________________</div>
							<div>Le {documentDate}</div>
						</div>
						<div class="signature-block">
							<div class="signature-line"></div>
							<div>{doctorInfo.signature}</div>
							{#if doctorInfo.rpps}
								<div style="font-size: 10px;">RPPS : {doctorInfo.rpps}</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Page 6: Orientation -->
				<div class="page">
					<div class="page-header">
						<h1 class="page-title">Prescription d'Activité Physique Adaptée</h1>
						<h2 class="page-subtitle">🏥 Orientation et Suivi</h2>
						<div class="page-info">
							<span>{doctorInfo.name}</span>
							<span>Date : {documentDate}</span>
						</div>
					</div>
					
					<div class="section-content">
						<p style="margin-bottom: 1.5rem; line-height: 1.8;">
							Orientation et suivi recommandés pour accompagner le patient dans sa démarche :
						</p>
						<ul class="conseil-list">
							{#each editedResponse.orientation as orient, i}
								<li class="conseil-item">
									<span class="conseil-number">•</span>
									<span>{orient}</span>
								</li>
							{/each}
						</ul>
					</div>

					<div class="disclaimer">
						{editedResponse.disclaimer}
					</div>

					<div class="signature-section">
						<div class="signature-block">
							<div>Fait à ________________</div>
							<div>Le {documentDate}</div>
						</div>
						<div class="signature-block">
							<div class="signature-line"></div>
							<div>{doctorInfo.signature}</div>
							{#if doctorInfo.rpps}
								<div style="font-size: 10px;">RPPS : {doctorInfo.rpps}</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>