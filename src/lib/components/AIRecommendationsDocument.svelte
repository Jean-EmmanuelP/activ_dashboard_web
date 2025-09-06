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

	let isEditing = $state(false);
	let documentDate = new Date().toLocaleDateString('fr-FR');
	let documentRef = $state<HTMLDivElement>();
	let showChat = $state(false);
	let chatMessages = $state<Array<{role: 'user' | 'assistant', content: string}>>([]);
	let chatInput = $state('');
	let isGeneratingChat = $state(false);
	let currentPage = $state(0);
	let viewMode = $state<'single' | 'all'>('single'); // Pour basculer entre vue page par page et vue complète
	
	// Définition des pages
	const pages = [
		{ key: 'conseils', title: 'Conseils Pratiques', icon: '📋' },
		{ key: 'objectifs', title: 'Objectifs Thérapeutiques', icon: '🎯' },
		{ key: 'benefices', title: 'Bénéfices Attendus', icon: '✨' },
		{ key: 'programme', title: 'Programme Personnalisé', icon: '💪' },
		{ key: 'planification', title: 'Planning Hebdomadaire', icon: '📅' },
		{ key: 'orientation', title: 'Orientation et Suivi', icon: '🏥' }
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
		
		// Initialize chat
		chatMessages = [{
			role: 'assistant',
			content: "Je suis votre assistant pour personnaliser cette prescription. Comment puis-je vous aider ?"
		}];
	});

	function toggleEdit() {
		isEditing = !isEditing;
		if (!isEditing && documentRef) {
			// Save content when exiting edit mode
			saveDocument();
		}
	}

	function saveDocument() {
		if (onUpdate) {
			onUpdate(aiResponse);
		}
		// Save to database
		supabase
			.from('llm_responses')
			.update({
				response_content: aiResponse,
				updated_at: new Date().toISOString()
			})
			.eq('submission_id', submissionId);
	}

	function printDocument() {
		window.print();
		if (onPrint) onPrint();
	}

	async function sendChatMessage() {
		if (!chatInput.trim()) return;
		
		const userMessage = chatInput;
		chatInput = '';
		chatMessages = [...chatMessages, { role: 'user', content: userMessage }];
		
		isGeneratingChat = true;
		try {
			// Simulated AI response
			await new Promise(resolve => setTimeout(resolve, 1500));
			chatMessages = [...chatMessages, { 
				role: 'assistant', 
				content: 'Je comprends votre demande. Vous pouvez directement modifier le texte dans le document en cliquant sur le bouton "✏️ Modifier".' 
			}];
		} finally {
			isGeneratingChat = false;
		}
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');
	
	.container {
		font-family: "Lato", sans-serif;
		min-height: calc(100vh - 200px);
		background: #f5f7fa;
		padding: 0;
	}

	.toolbar {
		background: linear-gradient(135deg, #003087 0%, #012169 100%);
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 2px 10px rgba(0, 48, 135, 0.1);
	}

	.toolbar-left {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.toolbar-right {
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
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 2rem;
		padding: 2rem;
		max-width: 1600px;
		margin: 0 auto;
	}

	.document-wrapper {
		background: white;
		border-radius: 8px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}

	.document-container {
		padding: 60px;
		min-height: 800px;
		font-size: 14px;
		line-height: 1.8;
		color: #000;
		background: white;
		position: relative;
	}

	.page-container {
		min-height: 297mm; /* A4 height */
		width: 100%;
		padding: 60px;
		background: white;
		position: relative;
		display: flex;
		flex-direction: column;
		page-break-after: always;
	}

	.page-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.page-navigation {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.page-nav-btn {
		padding: 0.5rem 1rem;
		background: white;
		border: 2px solid #003087;
		border-radius: 0.5rem;
		color: #003087;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.page-nav-btn:hover:not(:disabled) {
		background: #003087;
		color: white;
	}

	.page-nav-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-indicator {
		font-weight: 700;
		color: #003087;
		padding: 0.5rem 1rem;
		background: white;
		border-radius: 0.5rem;
		min-width: 200px;
		text-align: center;
	}

	.document-header {
		text-align: center;
		margin-bottom: 3rem;
		padding-bottom: 2rem;
		border-bottom: 3px solid #003087;
	}

	.document-title {
		font-size: 24px;
		font-weight: 900;
		color: #003087;
		text-transform: uppercase;
		letter-spacing: 1px;
		margin-bottom: 1rem;
	}

	.document-subtitle {
		font-size: 18px;
		font-weight: 700;
		color: #003087;
		margin-bottom: 0.5rem;
	}

	.document-info {
		display: flex;
		justify-content: space-between;
		margin-top: 1rem;
		font-size: 13px;
		color: #666;
	}

	.document-body {
		margin: 2rem 0;
	}

	.prescription-section {
		margin: 2rem 0;
		padding: 1.5rem;
		background: #f8f9fa;
		border-left: 4px solid #003087;
		border-radius: 0 8px 8px 0;
	}

	.section-title {
		font-size: 16px;
		font-weight: 700;
		color: #003087;
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.editable-content {
		padding: 1rem;
		background: white;
		border-radius: 4px;
		min-height: 100px;
		white-space: pre-wrap;
		line-height: 1.8;
		transition: all 0.3s ease;
	}

	.editable-content[contenteditable="true"] {
		border: 2px solid #003087;
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
		background: #f0f7ff;
	}

	.editable-content[contenteditable="true"]:focus {
		outline: none;
		background: white;
	}

	.conseils-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.conseil-item {
		padding: 1rem;
		margin-bottom: 0.75rem;
		background: white;
		border-radius: 4px;
		display: flex;
		align-items: start;
		gap: 1rem;
		transition: all 0.3s ease;
	}

	.conseil-item[contenteditable="true"]:hover {
		background: #f0f7ff;
		border: 1px solid #003087;
	}

	.conseil-number {
		font-weight: 700;
		color: #003087;
		min-width: 24px;
	}

	.conseil-text {
		flex: 1;
		line-height: 1.6;
	}

	.programme-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		margin-top: 1rem;
	}

	.programme-item {
		padding: 1rem;
		background: white;
		border-radius: 4px;
		border: 1px solid #e5e7eb;
	}

	.programme-label {
		font-weight: 700;
		color: #003087;
		margin-bottom: 0.5rem;
		font-size: 13px;
		text-transform: uppercase;
	}

	.signature-section {
		margin-top: 4rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
	}

	.signature-block {
		text-align: center;
		min-width: 250px;
	}

	.signature-line {
		border-bottom: 2px solid #000;
		margin-bottom: 0.5rem;
		height: 60px;
	}

	.signature-name {
		font-weight: 700;
		margin-bottom: 0.25rem;
	}

	.disclaimer-box {
		background: #fff3cd;
		border: 2px solid #ffc107;
		border-radius: 8px;
		padding: 1rem;
		margin-top: 2rem;
		font-size: 13px;
		color: #856404;
		text-align: center;
	}

	.chat-panel {
		background: white;
		border-radius: 8px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		height: calc(100vh - 250px);
		position: sticky;
		top: 2rem;
	}

	.chat-header {
		background: linear-gradient(135deg, #003087 0%, #012169 100%);
		color: white;
		padding: 1.25rem;
		border-radius: 8px 8px 0 0;
		font-weight: 700;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.chat-messages {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		background: #f8f9fa;
	}

	.chat-message {
		margin-bottom: 1rem;
		display: flex;
		gap: 0.75rem;
	}

	.chat-message.user {
		flex-direction: row-reverse;
	}

	.message-bubble {
		max-width: 80%;
		padding: 0.75rem 1rem;
		border-radius: 1rem;
		background: white;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		line-height: 1.5;
	}

	.chat-message.user .message-bubble {
		background: linear-gradient(135deg, #003087 0%, #012169 100%);
		color: white;
	}

	.chat-input-container {
		padding: 1rem;
		background: white;
		border-top: 2px solid #e5e7eb;
		display: flex;
		gap: 0.75rem;
	}

	.chat-input {
		flex: 1;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-family: "Lato", sans-serif;
		resize: none;
	}

	.chat-input:focus {
		outline: none;
		border-color: #003087;
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
	}

	.edit-indicator {
		position: fixed;
		top: 80px;
		right: 2rem;
		background: #ffc107;
		color: #000;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		font-weight: 700;
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
	}

	@media print {
		.toolbar, .chat-panel, .edit-indicator, .page-navigation {
			display: none !important;
		}
		
		.main-content {
			display: block !important;
		}
		
		.document-container, .page-container {
			padding: 40px;
			page-break-after: always;
			min-height: 297mm;
		}
		
		.editable-content[contenteditable="true"] {
			border: none !important;
			background: white !important;
			box-shadow: none !important;
		}
		
		.page-container:last-child {
			page-break-after: auto;
		}
		
		@page {
			size: A4;
			margin: 1cm;
		}
	}
</style>

<div class="container">
	{#if isEditing}
		<div class="edit-indicator">
			✏️ Mode édition activé - Cliquez sur les zones pour modifier
		</div>
	{/if}

	<!-- Toolbar -->
	<div class="toolbar">
		<div class="toolbar-left">
			<button class="btn" onclick={toggleEdit}>
				{isEditing ? '👁️ Prévisualiser' : '✏️ Modifier'}
			</button>
			<button class="btn" onclick={() => viewMode = viewMode === 'single' ? 'all' : 'single'}>
				{viewMode === 'single' ? '📄 Vue complète' : '📃 Vue page par page'}
			</button>
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
		<div class="toolbar-right">
			<button class="btn primary" onclick={saveDocument}>
				💾 Sauvegarder
			</button>
		</div>
	</div>

	<!-- Main Content -->
	<div class="main-content">
		<!-- Document -->
		<div class="document-wrapper">
			{#if viewMode === 'single'}
				<!-- Page Navigation -->
				<div class="page-navigation">
					<button 
						class="page-nav-btn" 
						onclick={() => currentPage = Math.max(0, currentPage - 1)}
						disabled={currentPage === 0}
					>
						← Précédent
					</button>
					<div class="page-indicator">
						{pages[currentPage].icon} {pages[currentPage].title} ({currentPage + 1}/{pages.length})
					</div>
					<button 
						class="page-nav-btn" 
						onclick={() => currentPage = Math.min(pages.length - 1, currentPage + 1)}
						disabled={currentPage === pages.length - 1}
					>
						Suivant →
					</button>
				</div>

				<!-- Single Page View -->
				<div class="page-container" bind:this={documentRef}>
					<div class="page-content">
						<!-- Page Header -->
						<div class="document-header">
							<h1 class="document-title">Prescription d'Activité Physique Adaptée</h1>
							<h2 class="document-subtitle">{pages[currentPage].icon} {pages[currentPage].title}</h2>
							<div class="document-info">
								<span>{doctorInfo.name}</span>
								<span>Date : {documentDate}</span>
							</div>
						</div>

						<!-- Page Content Based on Current Page -->
						<div class="document-body" style="flex: 1;">
							{#if currentPage === 0}
								<!-- Conseils Pratiques -->
								<div class="prescription-section">
									<div class="editable-content" contenteditable={isEditing} style="margin-bottom: 2rem;">
Je soussigné, {doctorInfo.name}, docteur en médecine, prescris au patient les conseils pratiques suivants dans le cadre d'une activité physique adaptée :
									</div>
									<ul class="conseils-list">
										{#each aiResponse.conseils as conseil, i}
											<li class="conseil-item" contenteditable={isEditing}>
												<span class="conseil-number">{i + 1}.</span>
												<span class="conseil-text">{conseil}</span>
											</li>
										{/each}
									</ul>
								</div>
							{:else if currentPage === 1}
								<!-- Objectifs -->
								<div class="prescription-section">
									<div class="editable-content" contenteditable={isEditing} style="margin-bottom: 2rem;">
Les objectifs thérapeutiques suivants ont été définis en fonction de l'état de santé et des capacités du patient :
									</div>
									<div class="editable-content" contenteditable={isEditing} style="font-size: 16px; line-height: 2;">
• {aiResponse.objectifs.join('\n• ')}
									</div>
								</div>
							{:else if currentPage === 2}
								<!-- Bénéfices -->
								<div class="prescription-section">
									<div class="editable-content" contenteditable={isEditing} style="margin-bottom: 2rem;">
Les bénéfices attendus de ce programme d'activité physique adaptée sont les suivants :
									</div>
									<div class="editable-content" contenteditable={isEditing} style="font-size: 16px; line-height: 2;">
• {aiResponse.benefices.join('\n• ')}
									</div>
								</div>
							{:else if currentPage === 3}
								<!-- Programme -->
								<div class="prescription-section">
									<div class="editable-content" contenteditable={isEditing} style="margin-bottom: 2rem;">
Programme d'activité physique personnalisé adapté aux besoins et capacités du patient :
									</div>
									<div class="programme-grid">
										<div class="programme-item">
											<div class="programme-label">Endurance</div>
											<div class="editable-content" contenteditable={isEditing}>
{aiResponse.programme_perso.endurance}
											</div>
										</div>
										<div class="programme-item">
											<div class="programme-label">Renforcement</div>
											<div class="editable-content" contenteditable={isEditing}>
{aiResponse.programme_perso.renforcement}
											</div>
										</div>
										<div class="programme-item">
											<div class="programme-label">Étirements</div>
											<div class="editable-content" contenteditable={isEditing}>
{aiResponse.programme_perso.etirements}
											</div>
										</div>
										<div class="programme-item">
											<div class="programme-label">Équilibre</div>
											<div class="editable-content" contenteditable={isEditing}>
{aiResponse.programme_perso.equilibre || 'À définir selon évaluation'}
											</div>
										</div>
									</div>
								</div>
							{:else if currentPage === 4}
								<!-- Planning -->
								<div class="prescription-section">
									<div class="editable-content" contenteditable={isEditing} style="margin-bottom: 2rem;">
Planning hebdomadaire recommandé pour optimiser les bénéfices de l'activité physique :
									</div>
									<div class="editable-content" contenteditable={isEditing} style="font-size: 16px; line-height: 2; padding: 2rem; background: #f8f9fa; border-radius: 8px;">
{aiResponse.planification}
									</div>
								</div>
							{:else if currentPage === 5}
								<!-- Orientation -->
								<div class="prescription-section">
									<div class="editable-content" contenteditable={isEditing} style="margin-bottom: 2rem;">
Orientation et suivi recommandés pour accompagner le patient dans sa démarche :
									</div>
									<div class="editable-content" contenteditable={isEditing} style="font-size: 16px; line-height: 2;">
• {aiResponse.orientation.join('\n• ')}
									</div>
								</div>
							{/if}
						</div>

						<!-- Signature at bottom of each page -->
						<div class="signature-section">
							<div class="signature-block">
								<div>Fait à ________________</div>
								<div>Le {documentDate}</div>
							</div>
							<div class="signature-block">
								<div class="signature-line"></div>
								<div class="signature-name">{doctorInfo.signature}</div>
								{#if doctorInfo.rpps}
									<div>RPPS : {doctorInfo.rpps}</div>
								{/if}
							</div>
						</div>

						<!-- Disclaimer -->
						<div class="disclaimer-box">
							{aiResponse.disclaimer}
						</div>
					</div>
				</div>
			{:else}
				<!-- All Pages View for Printing -->
				<div bind:this={documentRef}>
					{#each pages as page, pageIndex}
						<div class="page-container">
							<div class="page-content">
								<!-- Page Header -->
								<div class="document-header">
									<h1 class="document-title">Prescription d'Activité Physique Adaptée</h1>
									<h2 class="document-subtitle">{page.icon} {page.title}</h2>
									<div class="document-info">
										<span>{doctorInfo.name}</span>
										<span>Date : {documentDate}</span>
									</div>
								</div>

								<!-- Page Content -->
								<div class="document-body" style="flex: 1;">
									{#if pageIndex === 0}
										<!-- Conseils Pratiques -->
										<div class="prescription-section">
											<div class="editable-content" contenteditable={isEditing} style="margin-bottom: 2rem;">
Je soussigné, {doctorInfo.name}, docteur en médecine, prescris au patient les conseils pratiques suivants dans le cadre d'une activité physique adaptée :
											</div>
											<ul class="conseils-list">
												{#each aiResponse.conseils as conseil, i}
													<li class="conseil-item" contenteditable={isEditing}>
														<span class="conseil-number">{i + 1}.</span>
														<span class="conseil-text">{conseil}</span>
													</li>
												{/each}
											</ul>
										</div>
									{:else if pageIndex === 1}
										<!-- Objectifs -->
										<div class="prescription-section">
											<div class="editable-content" contenteditable={isEditing} style="margin-bottom: 2rem;">
Les objectifs thérapeutiques suivants ont été définis en fonction de l'état de santé et des capacités du patient :
											</div>
											<div class="editable-content" contenteditable={isEditing} style="font-size: 16px; line-height: 2;">
• {aiResponse.objectifs.join('\n• ')}
											</div>
										</div>
									{:else if pageIndex === 2}
										<!-- Bénéfices -->
										<div class="prescription-section">
											<div class="editable-content" contenteditable={isEditing} style="margin-bottom: 2rem;">
Les bénéfices attendus de ce programme d'activité physique adaptée sont les suivants :
											</div>
											<div class="editable-content" contenteditable={isEditing} style="font-size: 16px; line-height: 2;">
• {aiResponse.benefices.join('\n• ')}
											</div>
										</div>
									{:else if pageIndex === 3}
										<!-- Programme -->
										<div class="prescription-section">
											<div class="editable-content" contenteditable={isEditing} style="margin-bottom: 2rem;">
Programme d'activité physique personnalisé adapté aux besoins et capacités du patient :
											</div>
											<div class="programme-grid">
												<div class="programme-item">
													<div class="programme-label">Endurance</div>
													<div class="editable-content" contenteditable={isEditing}>
{aiResponse.programme_perso.endurance}
													</div>
												</div>
												<div class="programme-item">
													<div class="programme-label">Renforcement</div>
													<div class="editable-content" contenteditable={isEditing}>
{aiResponse.programme_perso.renforcement}
													</div>
												</div>
												<div class="programme-item">
													<div class="programme-label">Étirements</div>
													<div class="editable-content" contenteditable={isEditing}>
{aiResponse.programme_perso.etirements}
													</div>
												</div>
												<div class="programme-item">
													<div class="programme-label">Équilibre</div>
													<div class="editable-content" contenteditable={isEditing}>
{aiResponse.programme_perso.equilibre || 'À définir selon évaluation'}
													</div>
												</div>
											</div>
										</div>
									{:else if pageIndex === 4}
										<!-- Planning -->
										<div class="prescription-section">
											<div class="editable-content" contenteditable={isEditing} style="margin-bottom: 2rem;">
Planning hebdomadaire recommandé pour optimiser les bénéfices de l'activité physique :
											</div>
											<div class="editable-content" contenteditable={isEditing} style="font-size: 16px; line-height: 2; padding: 2rem; background: #f8f9fa; border-radius: 8px;">
{aiResponse.planification}
											</div>
										</div>
									{:else if pageIndex === 5}
										<!-- Orientation -->
										<div class="prescription-section">
											<div class="editable-content" contenteditable={isEditing} style="margin-bottom: 2rem;">
Orientation et suivi recommandés pour accompagner le patient dans sa démarche :
											</div>
											<div class="editable-content" contenteditable={isEditing} style="font-size: 16px; line-height: 2;">
• {aiResponse.orientation.join('\n• ')}
											</div>
										</div>
									{/if}
								</div>

								<!-- Signature at bottom of each page -->
								<div class="signature-section">
									<div class="signature-block">
										<div>Fait à ________________</div>
										<div>Le {documentDate}</div>
									</div>
									<div class="signature-block">
										<div class="signature-line"></div>
										<div class="signature-name">{doctorInfo.signature}</div>
										{#if doctorInfo.rpps}
											<div>RPPS : {doctorInfo.rpps}</div>
										{/if}
									</div>
								</div>

								<!-- Disclaimer -->
								<div class="disclaimer-box">
									{aiResponse.disclaimer}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Chat Panel -->
		<div class="chat-panel">
			<div class="chat-header">
				💬 Assistant IA
			</div>
			
			<div class="chat-messages">
				{#each chatMessages as message}
					<div class="chat-message {message.role}">
						<div class="message-bubble">
							{message.content}
						</div>
					</div>
				{/each}
				
				{#if isGeneratingChat}
					<div class="chat-message assistant">
						<div class="message-bubble">
							<span>En train de réfléchir...</span>
						</div>
					</div>
				{/if}
			</div>
			
			<div class="chat-input-container">
				<textarea 
					class="chat-input"
					bind:value={chatInput}
					placeholder="Demandez une modification..."
					rows="2"
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							sendChatMessage();
						}
					}}
				></textarea>
				<button 
					class="btn primary"
					onclick={sendChatMessage}
					disabled={!chatInput.trim() || isGeneratingChat}
					style="padding: 0.75rem 1rem;"
				>
					➤
				</button>
			</div>
		</div>
	</div>
</div>