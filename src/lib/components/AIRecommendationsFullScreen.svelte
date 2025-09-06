<script lang="ts">
	import type { AIRecommendation } from '$lib/services/vertexAI';
	import type { Answer, Question } from '$lib/supabase';
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';
	import PrescriptionDocument from './PrescriptionDocument.svelte';
	
	let {
		aiResponse,
		submissionId,
		patientAnswers = [],
		questions = [],
		onUpdate,
		onBack
	}: {
		aiResponse: AIRecommendation;
		submissionId: string;
		patientAnswers?: Answer[];
		questions?: Question[];
		onUpdate?: (response: AIRecommendation) => void;
		onBack?: () => void;
	} = $props();
	
	// States
	let currentPage = $state(0);
	let editMode = $state(false);
	let editedResponse = $state<AIRecommendation>({ 
		...aiResponse,
		programme_perso: {
			...aiResponse.programme_perso,
			equilibre: aiResponse.programme_perso?.equilibre || ''
		}
	});
	let doctorSignature = $state('');
	let showEmailModal = $state(false);
	let showPrintPreview = $state(false);
	let emailAddress = $state('');
	let sendingEmail = $state(false);
	let showChat = $state(false);
	let chatMessages = $state<Array<{role: 'user' | 'assistant', content: string}>>([]);
	let chatInput = $state('');
	let isGeneratingChat = $state(false);
	let showPrescription = $state(false);
	let prescriptionType = $state('apa');
	
	// Pages configuration  
	const pages = [
		{ key: 'conseils', title: 'Conseils Pratiques', icon: '📋', color: '#003087' },
		{ key: 'objectifs', title: 'Objectifs', icon: '🎯', color: '#00897b' },
		{ key: 'benefices', title: 'Bénéfices Attendus', icon: '✨', color: '#7b1fa2' },
		{ key: 'programme_perso', title: 'Programme Personnalisé', icon: '💪', color: '#f57c00' },
		{ key: 'planification', title: 'Planification', icon: '📅', color: '#5e35b1' },
		{ key: 'orientation', title: 'Orientation Médicale', icon: '🏥', color: '#d32f2f' }
	];
	
	onMount(async () => {
		// Load doctor signature
		const authUser = (await supabase.auth.getUser()).data.user;
		if (authUser) {
			const { data } = await supabase
				.from('users')
				.select('signature, first_name, last_name')
				.eq('email', authUser.email)
				.single();
			if (data) {
				doctorSignature = `Dr. ${data.first_name} ${data.last_name}`;
			}
		}
		
		// Initialize chat with welcome message
		chatMessages = [{
			role: 'assistant',
			content: "Bonjour Docteur, je suis votre assistant IA. Je peux vous aider à affiner les recommandations, répondre à vos questions sur le patient, ou adapter la prescription selon vos besoins. Comment puis-je vous aider ?"
		}];
	});
	
	$effect(() => {
		editedResponse = { 
			...aiResponse,
			programme_perso: {
				...aiResponse.programme_perso,
				equilibre: aiResponse.programme_perso?.equilibre || ''
			}
		};
	});
	
	function saveEdits() {
		aiResponse = { ...editedResponse };
		editMode = false;
		if (onUpdate) {
			onUpdate(aiResponse);
		}
		saveToDatabase();
	}
	
	function cancelEdits() {
		editedResponse = { ...aiResponse };
		editMode = false;
	}
	
	async function saveToDatabase() {
		try {
			const { error } = await supabase
				.from('llm_responses')
				.update({
					response_content: aiResponse,
					updated_at: new Date().toISOString()
				})
				.eq('submission_id', submissionId);
				
			if (error) console.error('Error saving AI response:', error);
		} catch (err) {
			console.error('Error saving:', err);
		}
	}
	
	function printRecommendations() {
		window.print();
	}
	
	async function sendByEmail() {
		if (!emailAddress) return;
		
		sendingEmail = true;
		try {
			// Simulate sending email - replace with actual implementation
			console.log('Sending to:', emailAddress);
			await new Promise(resolve => setTimeout(resolve, 2000));
			showEmailModal = false;
			emailAddress = '';
			alert('Email envoyé avec succès !');
		} catch (error) {
			console.error('Error sending email:', error);
		} finally {
			sendingEmail = false;
		}
	}
	
	function getPageContent(pageKey: string) {
		switch(pageKey) {
			case 'conseils':
				return editMode ? editedResponse.conseils : aiResponse.conseils;
			case 'objectifs':
				return editMode ? editedResponse.objectifs : aiResponse.objectifs;
			case 'benefices':
				return editMode ? editedResponse.benefices : aiResponse.benefices;
			case 'programme_perso':
				const prog = editMode ? editedResponse.programme_perso : aiResponse.programme_perso;
				return [
					`**Endurance:** ${prog.endurance}`,
					`**Renforcement:** ${prog.renforcement}`,
					`**Étirements:** ${prog.etirements}`,
					prog.equilibre ? `**Équilibre:** ${prog.equilibre}` : null
				].filter(Boolean);
			case 'planification':
				return [editMode ? editedResponse.planification : aiResponse.planification];
			case 'orientation':
				return editMode ? editedResponse.orientation : aiResponse.orientation;
			default:
				return [];
		}
	}
	
	async function sendChatMessage() {
		if (!chatInput.trim()) return;
		
		const userMessage = chatInput;
		chatInput = '';
		chatMessages = [...chatMessages, { role: 'user', content: userMessage }];
		
		isGeneratingChat = true;
		try {
			// Simulated AI response - replace with actual Vertex AI call
			const response = await simulateAIResponse(userMessage);
			chatMessages = [...chatMessages, { role: 'assistant', content: response }];
		} catch (error) {
			chatMessages = [...chatMessages, { 
				role: 'assistant', 
				content: 'Désolé, une erreur est survenue. Veuillez réessayer.' 
			}];
		} finally {
			isGeneratingChat = false;
		}
	}
	
	async function simulateAIResponse(message: string): Promise<string> {
		// Simulate AI processing delay
		await new Promise(resolve => setTimeout(resolve, 1500));
		
		// Simulated contextual responses
		if (message.toLowerCase().includes('modifier')) {
			return "Pour modifier les recommandations, cliquez sur le bouton '✏️ Modifier' en haut de la page. Vous pourrez alors éditer chaque section selon vos besoins cliniques.";
		}
		if (message.toLowerCase().includes('patient')) {
			return `D'après les réponses du questionnaire, le patient présente un profil d'activité ${patientAnswers.length > 10 ? 'actif' : 'sédentaire'}. Je recommande une approche progressive avec un suivi régulier.`;
		}
		if (message.toLowerCase().includes('exercice') || message.toLowerCase().includes('sport')) {
			return "Pour ce patient, je suggère de commencer par des exercices de faible intensité comme la marche rapide ou la natation, en augmentant progressivement la durée et l'intensité sur 4-6 semaines.";
		}
		
		return "Je comprends votre question. Basé sur le profil du patient et les réponses fournies, je maintiens les recommandations actuelles qui semblent appropriées. N'hésitez pas si vous avez des questions spécifiques.";
	}
	
	function requestCorrection(section: string) {
		chatInput = `Je souhaite modifier la section "${section}". Pouvez-vous me proposer une alternative ?`;
		sendChatMessage();
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');
	
	.container {
		font-family: "Lato", sans-serif;
		background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
		min-height: calc(100vh - 200px);
		padding: 2rem;
	}
	
	.main-grid {
		display: grid;
		grid-template-columns: 1fr 400px;
		gap: 2rem;
		max-width: 1600px;
		margin: 0 auto;
	}
	
	.main-content {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}
	
	.action-bar {
		background: linear-gradient(135deg, #003087 0%, #012169 100%);
		color: white;
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.tabs-container {
		display: flex;
		gap: 0.5rem;
		padding: 1rem;
		background: #f8f9fa;
		border-bottom: 2px solid #e5e7eb;
		overflow-x: auto;
	}
	
	.tab {
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		background: white;
		border: 2px solid #e5e7eb;
		cursor: pointer;
		transition: all 0.3s ease;
		white-space: nowrap;
		font-weight: 500;
		color: #6b7280;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.tab:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
	
	.tab.active {
		background: linear-gradient(135deg, #003087 0%, #012169 100%);
		color: white;
		border-color: #003087;
		font-weight: 700;
	}
	
	.content {
		padding: 2rem;
		min-height: 400px;
	}
	
	.content-item {
		background: #f8f9fa;
		border-left: 4px solid #003087;
		padding: 1rem 1.5rem;
		margin-bottom: 1rem;
		border-radius: 0 0.5rem 0.5rem 0;
		transition: all 0.3s ease;
	}
	
	.content-item:hover {
		background: #e8f4ff;
		transform: translateX(5px);
	}
	
	.edit-textarea {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-family: "Lato", sans-serif;
		font-size: 0.95rem;
		resize: vertical;
		min-height: 80px;
	}
	
	.edit-textarea:focus {
		outline: none;
		border-color: #003087;
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
	}
	
	.chat-container {
		background: white;
		border-radius: 1rem;
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
		padding: 1rem 1.5rem;
		border-radius: 1rem 1rem 0 0;
		font-weight: 700;
		display: flex;
		justify-content: space-between;
		align-items: center;
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
	}
	
	.chat-message.user .message-bubble {
		background: linear-gradient(135deg, #003087 0%, #012169 100%);
		color: white;
	}
	
	.chat-input-container {
		padding: 1rem;
		background: white;
		border-top: 2px solid #e5e7eb;
		border-radius: 0 0 1rem 1rem;
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
	}
	
	.btn {
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		border: none;
		font-family: "Lato", sans-serif;
	}
	
	.btn-primary {
		background: linear-gradient(135deg, #003087 0%, #012169 100%);
		color: white;
		box-shadow: 0 4px 15px rgba(0, 48, 135, 0.2);
	}
	
	.btn-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0, 48, 135, 0.3);
	}
	
	.btn-secondary {
		background: white;
		color: #003087;
		border: 2px solid #003087;
	}
	
	.btn-secondary:hover {
		background: #003087;
		color: white;
	}
	
	.btn-ghost {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border: 2px solid rgba(255, 255, 255, 0.3);
	}
	
	.btn-ghost:hover {
		background: rgba(255, 255, 255, 0.2);
	}
	
	.signature-section {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 2px solid #e5e7eb;
		text-align: right;
	}
	
	.signature-line {
		display: inline-block;
		width: 250px;
		border-bottom: 2px solid #003087;
		margin-bottom: 0.5rem;
	}
	
	.disclaimer {
		background: linear-gradient(135deg, #fff3cd 0%, #ffecb5 100%);
		border: 2px solid #ffc107;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-top: 2rem;
		color: #856404;
		font-weight: 500;
	}
	
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal {
		background: white;
		border-radius: 1rem;
		padding: 2rem;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
	}
	
	.modal-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #003087;
		margin-bottom: 1.5rem;
	}
	
	.input-group {
		margin-bottom: 1rem;
	}
	
	.input-label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #374151;
	}
	
	.input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		font-family: "Lato", sans-serif;
	}
	
	.input:focus {
		outline: none;
		border-color: #003087;
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
	}
	
	.modal-buttons {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}
	
	@media print {
		.action-bar, .tabs-container, .chat-container, .btn {
			display: none !important;
		}
		
		.main-grid {
			display: block !important;
		}
		
		.content-item {
			break-inside: avoid;
		}
	}
	
	.loading-dots {
		display: inline-flex;
		gap: 0.25rem;
	}
	
	.loading-dots span {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #003087;
		animation: bounce 1.4s infinite ease-in-out both;
	}
	
	.loading-dots span:nth-child(1) { animation-delay: -0.32s; }
	.loading-dots span:nth-child(2) { animation-delay: -0.16s; }
	
	@keyframes bounce {
		0%, 80%, 100% { transform: scale(0); }
		40% { transform: scale(1); }
	}
	
	.correction-prompt {
		background: #e8f4ff;
		border: 2px dashed #003087;
		border-radius: 0.5rem;
		padding: 0.75rem;
		margin-top: 0.5rem;
		cursor: pointer;
		text-align: center;
		color: #003087;
		font-weight: 500;
		transition: all 0.3s ease;
	}
	
	.correction-prompt:hover {
		background: #003087;
		color: white;
	}
</style>

<div class="container">
	<div class="main-grid">
		<!-- Main Content Area -->
		<div class="main-content">
			<!-- Action Bar -->
			<div class="action-bar">
				<div style="display: flex; gap: 1rem;">
					{#if !editMode}
						<button class="btn btn-ghost" onclick={() => editMode = true}>
							✏️ Modifier
						</button>
					{:else}
						<button class="btn btn-ghost" onclick={saveEdits}>
							💾 Sauvegarder
						</button>
						<button class="btn btn-ghost" onclick={cancelEdits}>
							❌ Annuler
						</button>
					{/if}
				</div>
				<div style="display: flex; gap: 1rem; align-items: center;">
					{#if showPrescription}
						<select class="btn btn-ghost" style="padding: 0.5rem;" bind:value={prescriptionType}>
							<option value="apa">Prescription APA</option>
							<option value="inaptitude">Certificat d'inaptitude</option>
							<option value="caci">CACI</option>
							<option value="kine">Ordonnance kiné</option>
							<option value="balneo">Balnéothérapie</option>
						</select>
					{/if}
					<button class="btn btn-ghost" onclick={() => showPrescription = !showPrescription}>
						📄 {showPrescription ? 'Retour aux recommandations' : 'Générer ordonnance'}
					</button>
					<button class="btn btn-ghost" onclick={printRecommendations}>
						🖨️ Imprimer
					</button>
					<button class="btn btn-ghost" onclick={() => showEmailModal = true}>
						📧 Envoyer par mail
					</button>
					{#if onBack}
						<button class="btn btn-ghost" onclick={onBack}>
							← Retour
						</button>
					{/if}
				</div>
			</div>
			
			<!-- Tabs -->
			{#if !showPrescription}
			<div class="tabs-container">
				{#each pages as page, index}
					<button 
						class="tab {currentPage === index ? 'active' : ''}"
						onclick={() => currentPage = index}
					>
						<span>{page.icon}</span>
						<span>{page.title}</span>
					</button>
				{/each}
			</div>
			{/if}
			
			<!-- Content -->
			<div class="content">
			{#if showPrescription}
				<!-- Prescription Document View -->
				<div style="width: 100%; max-width: 100%;">
					<PrescriptionDocument
						type={prescriptionType}
						aiRecommendations={aiResponse}
						patientInfo={{
							name: 'Patient Name',
							birthDate: '01/01/1990',
							address: 'Adresse du patient'
						}}
						onSave={(content) => {
							console.log('Saved:', content);
							alert('Ordonnance sauvegardée avec succès !');
						}}
						onPrint={() => window.print()}
						onEmail={(content) => {
							emailAddress = prompt('Email du patient :') || '';
							if (emailAddress) {
								console.log('Emailing to:', emailAddress, content);
								alert(`Ordonnance envoyée à ${emailAddress}`);
							}
						}}
					/>
				</div>
			{:else}
				<h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111827;">
					{pages[currentPage].icon} {pages[currentPage].title}
				</h2>
				
				{#if editMode}
					<!-- Edit Mode -->
					{#if pages[currentPage].key === 'planification'}
						<textarea 
							class="edit-textarea"
							bind:value={editedResponse.planification}
							placeholder="Planning hebdomadaire..."
						></textarea>
					{:else if pages[currentPage].key === 'programme_perso'}
						<div style="display: grid; gap: 1rem;">
							<div>
								<label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Endurance</label>
								<textarea 
									class="edit-textarea"
									bind:value={editedResponse.programme_perso.endurance}
								></textarea>
							</div>
							<div>
								<label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Renforcement</label>
								<textarea 
									class="edit-textarea"
									bind:value={editedResponse.programme_perso.renforcement}
								></textarea>
							</div>
							<div>
								<label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Étirements</label>
								<textarea 
									class="edit-textarea"
									bind:value={editedResponse.programme_perso.etirements}
								></textarea>
							</div>
							<div>
								<label style="font-weight: 600; display: block; margin-bottom: 0.5rem;">Équilibre</label>
								<textarea 
									class="edit-textarea"
									bind:value={editedResponse.programme_perso.equilibre}
									placeholder="Exercices d'équilibre (optionnel)"
								></textarea>
							</div>
						</div>
					{:else}
						{#each getPageContent(pages[currentPage].key) as item, i}
							<div style="margin-bottom: 1rem;">
								<textarea 
									class="edit-textarea"
									value={item}
									oninput={(e) => {
										const newValue = e.currentTarget.value;
										const key = pages[currentPage].key;
										if (key === 'conseils') {
											editedResponse.conseils[i] = newValue;
										} else if (key === 'objectifs') {
											editedResponse.objectifs[i] = newValue;
										} else if (key === 'benefices') {
											editedResponse.benefices[i] = newValue;
										} else if (key === 'orientation') {
											editedResponse.orientation[i] = newValue;
										}
									}}
								></textarea>
							</div>
						{/each}
					{/if}
				{:else}
					<!-- View Mode -->
					{#each getPageContent(pages[currentPage].key) as item, index}
						<div class="content-item">
							<div style="display: flex; align-items: start; gap: 1rem;">
								<span style="font-weight: 700; color: #003087;">{index + 1}.</span>
								<p style="flex: 1; margin: 0;">
									{@html item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
								</p>
							</div>
						</div>
					{/each}
					
					<!-- Correction Prompt -->
					<div 
						class="correction-prompt"
						onclick={() => requestCorrection(pages[currentPage].title)}
					>
						💬 Demander une correction via l'assistant IA
					</div>
				{/if}
				
				<!-- Signature Section -->
				{#if !editMode && doctorSignature}
					<div class="signature-section">
						<div>
							<div class="signature-line"></div>
							<p style="font-weight: 600; color: #003087;">{doctorSignature}</p>
							<p style="font-size: 0.875rem; color: #6b7280;">
								Généré le {new Date().toLocaleDateString('fr-FR')}
							</p>
						</div>
					</div>
				{/if}
				
				<!-- Disclaimer -->
				<div class="disclaimer">
					{aiResponse.disclaimer}
				</div>
			{/if}
			</div>
		</div>
		
		<!-- Chat Container -->
		<div class="chat-container">
			<div class="chat-header">
				<span>💬 Assistant IA</span>
				<span style="font-size: 0.875rem; font-weight: 400;">
					{isGeneratingChat ? 'En train de réfléchir...' : 'En ligne'}
				</span>
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
							<div class="loading-dots">
								<span></span>
								<span></span>
								<span></span>
							</div>
						</div>
					</div>
				{/if}
			</div>
			
			<div class="chat-input-container">
				<textarea 
					class="chat-input"
					bind:value={chatInput}
					placeholder="Posez une question ou demandez une modification..."
					rows="2"
					onkeydown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault();
							sendChatMessage();
						}
					}}
				></textarea>
				<button 
					class="btn btn-primary"
					onclick={sendChatMessage}
					disabled={!chatInput.trim() || isGeneratingChat}
				>
					{isGeneratingChat ? '⏳' : '➤'}
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Email Modal -->
{#if showEmailModal}
	<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showEmailModal = false; }}>
		<div class="modal">
			<h2 class="modal-title">📧 Envoyer les recommandations</h2>
			
			<div class="input-group">
				<label class="input-label" for="email">Adresse email du patient</label>
				<input 
					id="email"
					class="input"
					type="email"
					bind:value={emailAddress}
					placeholder="patient@example.com"
				/>
			</div>
			
			<div class="input-group">
				<label class="input-label">Message personnalisé (optionnel)</label>
				<textarea 
					class="edit-textarea"
					placeholder="Ajoutez un message personnalisé pour le patient..."
					rows="4"
				></textarea>
			</div>
			
			<div class="modal-buttons">
				<button class="btn btn-secondary" onclick={() => showEmailModal = false}>
					Annuler
				</button>
				<button 
					class="btn btn-primary" 
					onclick={sendByEmail}
					disabled={!emailAddress || sendingEmail}
				>
					{sendingEmail ? '⏳ Envoi...' : '📤 Envoyer'}
				</button>
			</div>
		</div>
	</div>
{/if}