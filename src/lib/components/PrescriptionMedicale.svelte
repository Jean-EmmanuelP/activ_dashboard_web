<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';

	let {
		submission = null,
		aiResponse = null
	}: {
		submission: any;
		aiResponse: any;
	} = $props();

	let element = $state<HTMLDivElement>();
	let editorState = $state<{ editor: Editor | null }>({ editor: null });

	function generatePrescriptionContent() {
		const patient = submission?.patient_info || {};
		const date = new Date().toLocaleDateString('fr-FR');
		
		return `
			<div class="header-info">
				<p><strong>Docteur</strong> ………………………………</p>
				<p><strong>Adresse</strong> ………………………………</p>
				<p><strong>Tél/mail</strong> ………………………………</p>
				<p><strong>Spécialité</strong> ………………………………</p>
				<p><strong>RPPS</strong> ………………………………</p>
			</div>

			<div class="patient-info">
				<p>A l'intention de <strong>${patient.firstName || '…………'} ${patient.lastName || '…………'}</strong>, né(e) le <strong>${patient.dateOfBirth || '……/……/……'}</strong></p>
				<p>Fait à ………………………, le <strong>${date}</strong></p>
			</div>

			<h1>PRESCRIPTION D'ACTIVITÉ PHYSIQUE ADAPTÉE</h1>

			<div class="prescription-content">
				<p><strong>Je prescris une activité physique et/ou sportive adaptée</strong></p>
				<p>Pendant <strong>………………</strong>, à adapter en fonction de l'évolution des aptitudes du patient.</p>
				
				<h2>Préconisation d'activité et recommandations :</h2>
				
				<h3>🏃‍♂️ Endurance</h3>
				<ul>
					<li><strong>Fréquence :</strong> ≥2/sem</li>
					<li><strong>Intensité :</strong> Modérée (150 min/sem) ou Élevée (75 min/sem)</li>
					<li><strong>Temps :</strong> ………………</li>
					<li><strong>Type :</strong> Marche active, vélo, natation</li>
					<li><strong>Conseils pratiques :</strong> Adapter selon chaque patient</li>
				</ul>

				<h3>🏋️‍♀️ Renforcement musculaire</h3>
				<ul>
					<li><strong>Fréquence :</strong> ≥1/sem</li>
					<li><strong>Intensité :</strong> 60-80% charge maximale</li>
					<li><strong>Temps :</strong> ………………</li>
					<li><strong>Type :</strong> Stretching, gym douce</li>
					<li><strong>Conseils pratiques :</strong> 10 répétitions, 2-4 séries par exercice</li>
				</ul>

				<h3>🧘‍♀️ Étirements</h3>
				<ul>
					<li><strong>Fréquence :</strong> ≥1/sem</li>
					<li><strong>Intensité :</strong> Maintien ≥10 secondes</li>
					<li><strong>Temps :</strong> ………………</li>
					<li><strong>Type :</strong> Yoga, pilates, taï-chi</li>
					<li><strong>Conseils pratiques :</strong> 8 exercices, 4 répétitions</li>
				</ul>

				<h3>Limitations :</h3>
				<p>………………………………………………………………</p>
				<p>………………………………………………………………</p>
				<p>………………………………………………………………</p>

				<h3>Type d'intervenant(s) appelé(s) à dispenser l'activité physique :</h3>
				<p>………………………………………………………………</p>

				<div class="footer-notes">
					<p>Merci de joindre lors du suivi : la satisfaction et la motivation du patient, les progrès, les résultats des tests de condition physique si disponible, les effets indésirables ressentis par le patient (fatigue, douleur, limitations fonctionnelles…), les propositions pour pérenniser l'activité physique (structure relais, outils d'autonomisation…)</p>
					
					<p class="disclaimer">La dispensation de l'activité physique adaptée ne peut pas donner lieu à une prise en charge par l'assurance maladie</p>
					
					<p>☐ Document remis en main propre</p>
				</div>

				<div class="signature">
					<p><strong>Docteur</strong> ………………………………</p>
					<p><strong>Signature</strong></p>
					<br><br><br>
					<p>………………………………</p>
				</div>

				<p class="note-footer">✳️ Nos conseils ne remplacent pas une consultation médicale</p>
			</div>
		`;
	}

	onMount(() => {
		if (!element) return;
		
		const editor = new Editor({
			element: element,
			extensions: [
				StarterKit.configure({
					heading: {
						levels: [1, 2, 3]
					}
				})
			],
			content: generatePrescriptionContent(),
			onTransaction: ({ editor }) => {
				editorState = { editor };
			}
		});

		editorState = { editor };
	});

	onDestroy(() => {
		if (editorState.editor) {
			editorState.editor.destroy();
		}
	});

	function handlePrint() {
		window.print();
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');

	.prescription-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #f5f7fa;
		font-family: 'Lato', sans-serif;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1rem;
		background: white;
		border-bottom: 1px solid #dee2e6;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.toolbar-title {
		font-size: 16px;
		font-weight: 700;
		color: #003087;
		margin-right: auto;
	}

	.toolbar-button {
		padding: 0.5rem 1rem;
		background: white;
		color: #003087;
		border: 1px solid #003087;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.toolbar-button:hover {
		background: #003087;
		color: white;
	}

	.editor-wrapper {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
		display: flex;
		justify-content: center;
	}

	.editor-content {
		width: 100%;
		max-width: 900px;
		background: white;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		padding: 3rem;
		border-radius: 4px;
		margin: 0 auto;
		box-sizing: border-box;
	}

	:global(.ProseMirror) {
		font-family: 'Times New Roman', serif;
		font-size: 11pt;
		line-height: 1.5;
		color: #000;
		min-height: 100%;
		outline: none;
	}

	:global(.ProseMirror .header-info) {
		margin-bottom: 2rem;
	}

	:global(.ProseMirror .header-info p) {
		margin: 0.25rem 0;
		font-size: 10pt;
	}

	:global(.ProseMirror .patient-info) {
		margin-bottom: 2rem;
	}

	:global(.ProseMirror .patient-info p) {
		margin: 0.5rem 0;
	}

	:global(.ProseMirror h1) {
		font-size: 14pt;
		font-weight: bold;
		text-align: center;
		margin: 2rem 0;
		text-decoration: underline;
	}

	:global(.ProseMirror h2) {
		font-size: 12pt;
		font-weight: bold;
		margin: 1.5rem 0 0.75rem 0;
		color: #000;
	}

	:global(.ProseMirror h3) {
		font-size: 11pt;
		font-weight: bold;
		margin: 1rem 0 0.5rem 0;
		color: #000;
	}

	:global(.ProseMirror ul) {
		margin: 0.5rem 0;
		padding-left: 2rem;
	}

	:global(.ProseMirror li) {
		margin: 0.25rem 0;
	}

	:global(.ProseMirror .footer-notes) {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid #dee2e6;
	}

	:global(.ProseMirror .footer-notes p) {
		font-size: 9pt;
		margin: 0.75rem 0;
		text-align: justify;
	}

	:global(.ProseMirror .disclaimer) {
		font-style: italic;
		color: #666;
	}

	:global(.ProseMirror .signature) {
		margin-top: 3rem;
	}

	:global(.ProseMirror .signature p) {
		margin: 0.5rem 0;
	}

	:global(.ProseMirror .note-footer) {
		text-align: center;
		font-size: 9pt;
		color: #666;
		margin-top: 2rem;
	}

	@media print {
		.toolbar {
			display: none;
		}

		.editor-wrapper {
			padding: 0;
		}

		.editor-content {
			box-shadow: none;
			border-radius: 0;
			max-width: 100%;
			padding: 20mm;
		}
	}
</style>

<div class="prescription-container">
	<div class="toolbar">
		<span class="toolbar-title">Prescription Médicale APA</span>
		<button class="toolbar-button" onclick={handlePrint}>
			📄 Imprimer
		</button>
	</div>
	
	<div class="editor-wrapper">
		<div class="editor-content">
			<div bind:this={element}></div>
		</div>
	</div>
</div>