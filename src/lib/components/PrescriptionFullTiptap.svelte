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

	// Generate full prescription content
	function generatePrescriptionContent() {
		const patient = submission?.patient_info || {};
		const date = new Date().toLocaleDateString('fr-FR');
		
		return `
			<h1>PRESCRIPTION D'ACTIVITÉ<br>PHYSIQUE ADAPTÉE</h1>
			<p style="text-align: center; margin-bottom: 2rem;"><strong>Date:</strong> ${date}</p>
			
			<div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 2rem;">
				<h2 style="margin-top: 0;">INFORMATIONS PATIENT</h2>
				<p><strong>Patient:</strong> ${patient.firstName || 'Prénom'} ${patient.lastName || 'Nom'}</p>
				<p><strong>Date de naissance:</strong> ${patient.dateOfBirth || 'JJ/MM/AAAA'}</p>
				<p style="margin-bottom: 0;"><strong>N° Sécurité sociale:</strong> ${patient.socialSecurityNumber || 'À renseigner'}</p>
			</div>

			<h2>CONSEILS PRATIQUES</h2>
			<h3>Conseils pratiques pour votre activité physique</h3>
			<ul>
				<li>Commencer progressivement avec 15 minutes d'activité par jour</li>
				<li>Maintenir une alimentation équilibrée et une hydratation suffisante</li>
				<li>Boire 1.5 à 2 litres d'eau par jour plus pendant l'effort</li>
				<li>Prendre 3 repas par jour plus collations si besoin</li>
				<li>Éviter les efforts intenses le soir</li>
				<li>Augmenter progressivement l'intensité sur 4 semaines</li>
				<li>Intégrer des exercices de respiration et de relaxation</li>
				<li>Tenir un journal de vos activités physiques</li>
				<li>Privilégier les activités en groupe pour la motivation</li>
				<li>Se fixer des objectifs réalistes et mesurables</li>
				<li>Faire un bilan mensuel avec votre médecin</li>
			</ul>

			<h2>LIMITATIONS</h2>
			<ul>
				<li>Éviter les exercices de haute intensité sans supervision médicale</li>
				<li>Limiter les activités à impact élevé sur les articulations</li>
				<li>Ne pas dépasser 140 bpm de fréquence cardiaque</li>
				<li>Éviter les efforts prolongés en cas de fatigue inhabituelle</li>
			</ul>

			<h2>ORIENTATION</h2>
			<ul>
				<li>Kinésithérapeute spécialisé en réadaptation cardiaque</li>
				<li>Suivi avec éducateur APA certifié</li>
				<li>Consultation de suivi dans 3 mois</li>
				<li>Programme sport-santé municipal possible</li>
			</ul>

			<h2>PROGRAMME D'ACTIVITÉ</h2>
			<h3>Semaine 1-2: Phase d'initiation</h3>
			<ul>
				<li>Marche: 15-20 minutes par jour à allure modérée</li>
				<li>Exercices de respiration: 5 minutes matin et soir</li>
				<li>Étirements doux: 10 minutes après chaque séance</li>
			</ul>
			
			<h3>Semaine 3-4: Phase de progression</h3>
			<ul>
				<li>Marche: 25-30 minutes par jour avec variations de rythme</li>
				<li>Natation ou aquagym: 2 fois par semaine, 30 minutes</li>
				<li>Renforcement musculaire léger: 2 fois par semaine</li>
			</ul>
			
			<h3>Semaine 5-8: Phase de consolidation</h3>
			<ul>
				<li>Activité aérobie: 30-45 minutes, 4-5 fois par semaine</li>
				<li>Renforcement musculaire: 2-3 fois par semaine</li>
				<li>Activités de coordination et équilibre: 1-2 fois par semaine</li>
			</ul>

			<h2>PLANNING HEBDOMADAIRE</h2>
			<ul style="list-style: none; padding-left: 0;">
				<li><strong>Lundi:</strong> Marche 30min (matin) • Étirements 10min (soir)</li>
				<li><strong>Mardi:</strong> Natation 30min (matin) • Relaxation 15min (soir)</li>
				<li><strong>Mercredi:</strong> Renforcement 20min (matin) • Marche 20min (PM)</li>
				<li><strong>Jeudi:</strong> Repos (matin) • Aquagym 30min (après-midi)</li>
				<li><strong>Vendredi:</strong> Marche 30min (matin) • Yoga 20min (soir)</li>
				<li><strong>Samedi:</strong> Activité libre 45min (matin) • Étirements (soir)</li>
				<li><strong>Dimanche:</strong> Repos actif • Balade famille (après-midi)</li>
			</ul>

			<h2>RECOMMANDATIONS</h2>
			<p>Tenir un carnet de suivi pour noter vos sensations. En cas de douleur ou fatigue inhabituelle, arrêtez l'activité et consultez. Adaptez selon votre forme du jour.</p>

			<div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #dee2e6;">
				<p><strong>Dr. Jean-Emmanuel Perraumat</strong><br>
				Médecin traitant</p>
				<p style="margin-top: 3rem;">Signature: _______________________</p>
				<p>Date: ${date}</p>
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
				// Force re-render so `editor.isActive` works as expected
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

	function exportToWord() {
		// Future implementation for DOCX export
		alert('L\'export Word sera disponible prochainement');
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');

	.editor-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
		font-family: 'Lato', sans-serif;
	}

	.toolbar {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.5rem 1rem;
		background: linear-gradient(to bottom, #ffffff, #f8f9fa);
		border-bottom: 1px solid #dee2e6;
		flex-wrap: wrap;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		position: sticky;
		top: 0;
		z-index: 100;
		min-height: 52px;
	}

	.toolbar-group {
		display: flex;
		gap: 2px;
		padding: 0 0.25rem;
		position: relative;
	}
	
	.toolbar-group::after {
		content: '';
		position: absolute;
		right: -0.25rem;
		top: 50%;
		transform: translateY(-50%);
		height: 24px;
		width: 1px;
		background: #dee2e6;
	}

	.toolbar-group:last-child::after {
		display: none;
	}
	
	.toolbar-group.end {
		margin-left: auto;
	}

	.toolbar-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		height: 32px;
		padding: 0 8px;
		border: 1px solid transparent;
		background: transparent;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
		color: #495057;
		font-family: 'Lato', sans-serif;
		font-weight: 500;
		font-size: 13px;
		white-space: nowrap;
		position: relative;
	}

	.toolbar-button:hover:not(:disabled) {
		background: rgba(0, 48, 135, 0.08);
		color: #003087;
	}

	.toolbar-button.active {
		background: rgba(0, 48, 135, 0.12);
		color: #003087;
		border: 1px solid rgba(0, 48, 135, 0.2);
		font-weight: 600;
	}

	.toolbar-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		color: #adb5bd;
	}
	
	.toolbar-button.icon-button {
		min-width: 32px;
		padding: 0;
		font-weight: 700;
	}
	
	.toolbar-button.text-button {
		padding: 0 12px;
		gap: 4px;
	}
	
	.toolbar-separator {
		width: 1px;
		height: 24px;
		background: #dee2e6;
		margin: 0 4px;
	}

	.editor-wrapper {
		flex: 1;
		overflow-y: auto;
		padding: 2rem 1rem;
		display: flex;
		justify-content: center;
		background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
	}

	.editor-content {
		width: 210mm;
		max-width: 210mm;
		background: white;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 8px rgba(0, 0, 0, 0.06);
		min-height: 297mm;
		padding: 20mm 15mm 20mm 20mm;
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.05);
		margin: 0 auto;
		position: relative;
		box-sizing: border-box;
		background-image: 
			repeating-linear-gradient(
				to bottom,
				transparent 0,
				transparent calc(297mm - 2px),
				rgba(0, 48, 135, 0.1) calc(297mm - 2px),
				rgba(0, 48, 135, 0.1) 297mm
			);
		background-size: 100% 297mm;
	}

	:global(.ProseMirror) {
		font-family: 'Lato', sans-serif;
		font-size: 12pt;
		line-height: 1.6;
		color: #111827;
		min-height: 100%;
		outline: none;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	:global(.ProseMirror h1) {
		font-size: 20pt;
		font-weight: 900;
		color: #003087;
		text-align: center;
		margin: 0 0 1.5rem 0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		page-break-after: avoid;
	}

	:global(.ProseMirror h2) {
		font-size: 14pt;
		font-weight: 700;
		color: #003087;
		margin: 1.5rem 0 0.75rem 0;
		text-transform: uppercase;
		border-bottom: 1px solid #e5e7eb;
		padding-bottom: 0.4rem;
		page-break-after: avoid;
		page-break-inside: avoid;
	}

	:global(.ProseMirror h3) {
		font-size: 12pt;
		font-weight: 600;
		color: #003087;
		margin: 1rem 0 0.5rem 0;
		page-break-after: avoid;
	}

	:global(.ProseMirror p) {
		margin: 0.75rem 0;
		text-align: justify;
		orphans: 3;
		widows: 3;
	}

	:global(.ProseMirror ul) {
		list-style-type: disc;
		padding-left: 1.5rem;
		margin: 0.75rem 0;
		page-break-inside: avoid;
	}

	:global(.ProseMirror ol) {
		list-style-type: decimal;
		padding-left: 2rem;
		margin: 1rem 0;
	}

	:global(.ProseMirror li) {
		margin: 0.4rem 0;
		line-height: 1.5;
		page-break-inside: avoid;
	}

	:global(.ProseMirror strong) {
		font-weight: 700;
		color: #003087;
	}

	:global(.ProseMirror em) {
		font-style: italic;
	}

	:global(.ProseMirror blockquote) {
		border-left: 4px solid #003087;
		padding-left: 1rem;
		margin: 1rem 0;
		color: #6b7280;
		font-style: italic;
		page-break-inside: avoid;
	}

	.editor-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		background: white;
		border-bottom: 1px solid #dee2e6;
	}

	.editor-title {
		font-size: 18px;
		font-weight: 700;
		color: #003087;
		margin: 0;
		letter-spacing: -0.02em;
	}

	.editor-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.status-badge {
		padding: 4px 12px;
		background: rgba(0, 48, 135, 0.1);
		color: #003087;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	/* Page break rules */
	:global(.ProseMirror > *) {
		page-break-inside: avoid;
	}

	:global(.ProseMirror h1 + *),
	:global(.ProseMirror h2 + *),
	:global(.ProseMirror h3 + *) {
		page-break-before: avoid;
	}

	/* Ensure sections stay together */
	:global(.ProseMirror h2) {
		break-before: auto;
		break-after: avoid;
	}

	/* Force new page for major sections if needed */
	:global(.ProseMirror h2 + h3) {
		page-break-before: avoid;
	}

	/* Print styles */
	@media print {
		.editor-container {
			background: white;
		}
		
		.editor-header,
		.toolbar {
			display: none;
		}

		.editor-wrapper {
			padding: 0;
		}

		.editor-content {
			box-shadow: none;
			border-radius: 0;
			border: none;
			padding: 25mm 20mm;
			width: 210mm;
			min-height: 297mm;
		}

		:global(.ProseMirror) {
			max-width: 100%;
		}
	}
</style>

<div class="editor-container">
	<div class="editor-header">
		<h2 class="editor-title">Prescription d'Activité Physique Adaptée</h2>
		<div class="editor-actions">
			<span class="status-badge">En cours d'édition</span>
		</div>
	</div>
	<div class="toolbar">
		<div class="toolbar-group">
			<button 
				class="toolbar-button icon-button"
				class:active={editorState.editor?.isActive('heading', { level: 1 })}
				onclick={() => editorState.editor?.chain().focus().toggleHeading({ level: 1 }).run()}
				disabled={!editorState.editor}
				title="Titre 1"
			>
				H₁
			</button>
			<button 
				class="toolbar-button icon-button"
				class:active={editorState.editor?.isActive('heading', { level: 2 })}
				onclick={() => editorState.editor?.chain().focus().toggleHeading({ level: 2 }).run()}
				disabled={!editorState.editor}
				title="Titre 2"
			>
				H₂
			</button>
			<button 
				class="toolbar-button icon-button"
				class:active={editorState.editor?.isActive('heading', { level: 3 })}
				onclick={() => editorState.editor?.chain().focus().toggleHeading({ level: 3 }).run()}
				disabled={!editorState.editor}
				title="Titre 3"
			>
				H₃
			</button>
			<button 
				class="toolbar-button icon-button"
				class:active={editorState.editor?.isActive('paragraph')}
				onclick={() => editorState.editor?.chain().focus().setParagraph().run()}
				disabled={!editorState.editor}
				title="Paragraphe"
			>
				¶
			</button>
		</div>
		
		<div class="toolbar-group">
			<button 
				class="toolbar-button icon-button"
				class:active={editorState.editor?.isActive('bold')}
				onclick={() => editorState.editor?.chain().focus().toggleBold().run()}
				disabled={!editorState.editor}
				title="Gras (Ctrl+B)"
				style="font-weight: 700;"
			>
				B
			</button>
			<button 
				class="toolbar-button icon-button"
				class:active={editorState.editor?.isActive('italic')}
				onclick={() => editorState.editor?.chain().focus().toggleItalic().run()}
				disabled={!editorState.editor}
				title="Italique (Ctrl+I)"
				style="font-style: italic;"
			>
				I
			</button>
			<button 
				class="toolbar-button icon-button"
				class:active={editorState.editor?.isActive('strike')}
				onclick={() => editorState.editor?.chain().focus().toggleStrike().run()}
				disabled={!editorState.editor}
				title="Barré"
				style="text-decoration: line-through;"
			>
				S
			</button>
		</div>
		
		<div class="toolbar-group">
			<button 
				class="toolbar-button text-button"
				class:active={editorState.editor?.isActive('bulletList')}
				onclick={() => editorState.editor?.chain().focus().toggleBulletList().run()}
				disabled={!editorState.editor}
				title="Liste à puces"
			>
				• Liste
			</button>
			<button 
				class="toolbar-button text-button"
				class:active={editorState.editor?.isActive('orderedList')}
				onclick={() => editorState.editor?.chain().focus().toggleOrderedList().run()}
				disabled={!editorState.editor}
				title="Liste numérotée"
			>
				1. Liste
			</button>
		</div>

		<div class="toolbar-group">
			<button 
				class="toolbar-button icon-button"
				onclick={() => editorState.editor?.chain().focus().undo().run()}
				disabled={!editorState.editor?.can().undo()}
				title="Annuler (Ctrl+Z)"
			>
				↶
			</button>
			<button 
				class="toolbar-button icon-button"
				onclick={() => editorState.editor?.chain().focus().redo().run()}
				disabled={!editorState.editor?.can().redo()}
				title="Rétablir (Ctrl+Y)"
			>
				↷
			</button>
		</div>
		
		<div class="toolbar-group end">
			<button class="toolbar-button text-button" onclick={handlePrint} title="Imprimer le document">
				🖨️ Imprimer
			</button>
			<button class="toolbar-button text-button" onclick={exportToWord} title="Exporter en format Word">
				📄 Export Word
			</button>
		</div>
	</div>
	
	<div class="editor-wrapper">
		<div class="editor-content">
			<div bind:this={element}></div>
		</div>
	</div>
</div>