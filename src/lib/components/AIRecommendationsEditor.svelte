<script lang="ts">
	import type { AIRecommendation } from '$lib/services/vertexAI';
	import { supabase } from '$lib/supabase';
	import { onMount, onDestroy } from 'svelte';
	
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

	let editorInstance: any = null;
	let editorContainer = $state<HTMLDivElement>();
	let documentContent = $state('');
	let doctorInfo = $state({
		name: '',
		title: 'Docteur',
		signature: '',
		rpps: '',
		address: '',
		phone: ''
	});
	let documentDate = new Date().toLocaleDateString('fr-FR');

	// Générer le contenu HTML initial
	function generateDocumentHTML() {
		return `
			<div style="font-family: 'Lato', Arial, sans-serif; max-width: 210mm; margin: 0 auto; padding: 20mm;">
				<!-- En-tête -->
				<div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #003087; padding-bottom: 20px;">
					<h1 style="color: #003087; font-size: 24px; margin: 10px 0;">PRESCRIPTION D'ACTIVITÉ PHYSIQUE ADAPTÉE</h1>
					<p style="color: #666; margin: 5px 0;">${doctorInfo.name}</p>
					<p style="color: #666; margin: 5px 0;">Date : ${documentDate}</p>
				</div>

				<!-- Introduction -->
				<p style="line-height: 1.8; margin: 20px 0;">
					Je soussigné, <strong>${doctorInfo.name}</strong>, docteur en médecine, prescris au patient les recommandations 
					d'activité physique adaptée suivantes, basées sur l'évaluation complète de son état de santé et de ses capacités physiques actuelles.
				</p>

				<!-- Page 1: Conseils Pratiques -->
				<div style="page-break-before: auto; min-height: 297mm; display: flex; flex-direction: column;">
					<h2 style="color: #003087; border-left: 4px solid #003087; padding-left: 15px; margin: 30px 0 20px 0;">
						📋 CONSEILS PRATIQUES
					</h2>
					<ol style="line-height: 2; margin: 20px 0;">
						${aiResponse.conseils.map(conseil => `<li style="margin: 10px 0;">${conseil}</li>`).join('')}
					</ol>
					<div style="margin-top: auto; padding-top: 50px;">
						<div style="display: flex; justify-content: space-between; align-items: flex-end;">
							<div>
								<p>Fait à _______________, le ${documentDate}</p>
							</div>
							<div style="text-align: center;">
								<div style="border-bottom: 2px solid #000; width: 250px; height: 60px; margin-bottom: 10px;"></div>
								<p><strong>${doctorInfo.signature}</strong></p>
								${doctorInfo.rpps ? `<p style="font-size: 12px;">RPPS : ${doctorInfo.rpps}</p>` : ''}
							</div>
						</div>
					</div>
				</div>

				<!-- Page 2: Objectifs Thérapeutiques -->
				<div style="page-break-before: always; min-height: 297mm; display: flex; flex-direction: column;">
					<h2 style="color: #003087; border-left: 4px solid #003087; padding-left: 15px; margin: 30px 0 20px 0;">
						🎯 OBJECTIFS THÉRAPEUTIQUES
					</h2>
					<p style="line-height: 1.8; margin: 20px 0;">
						Les objectifs thérapeutiques suivants ont été définis en fonction de l'état de santé et des capacités du patient :
					</p>
					<ul style="line-height: 2; margin: 20px 0;">
						${aiResponse.objectifs.map(obj => `<li style="margin: 10px 0;">${obj}</li>`).join('')}
					</ul>
					<div style="margin-top: auto; padding-top: 50px;">
						<div style="display: flex; justify-content: space-between; align-items: flex-end;">
							<div>
								<p>Fait à _______________, le ${documentDate}</p>
							</div>
							<div style="text-align: center;">
								<div style="border-bottom: 2px solid #000; width: 250px; height: 60px; margin-bottom: 10px;"></div>
								<p><strong>${doctorInfo.signature}</strong></p>
								${doctorInfo.rpps ? `<p style="font-size: 12px;">RPPS : ${doctorInfo.rpps}</p>` : ''}
							</div>
						</div>
					</div>
				</div>

				<!-- Page 3: Bénéfices Attendus -->
				<div style="page-break-before: always; min-height: 297mm; display: flex; flex-direction: column;">
					<h2 style="color: #003087; border-left: 4px solid #003087; padding-left: 15px; margin: 30px 0 20px 0;">
						✨ BÉNÉFICES ATTENDUS
					</h2>
					<p style="line-height: 1.8; margin: 20px 0;">
						Les bénéfices attendus de ce programme d'activité physique adaptée sont les suivants :
					</p>
					<ul style="line-height: 2; margin: 20px 0;">
						${aiResponse.benefices.map(ben => `<li style="margin: 10px 0;">${ben}</li>`).join('')}
					</ul>
					<div style="margin-top: auto; padding-top: 50px;">
						<div style="display: flex; justify-content: space-between; align-items: flex-end;">
							<div>
								<p>Fait à _______________, le ${documentDate}</p>
							</div>
							<div style="text-align: center;">
								<div style="border-bottom: 2px solid #000; width: 250px; height: 60px; margin-bottom: 10px;"></div>
								<p><strong>${doctorInfo.signature}</strong></p>
								${doctorInfo.rpps ? `<p style="font-size: 12px;">RPPS : ${doctorInfo.rpps}</p>` : ''}
							</div>
						</div>
					</div>
				</div>

				<!-- Page 4: Programme Personnalisé -->
				<div style="page-break-before: always; min-height: 297mm; display: flex; flex-direction: column;">
					<h2 style="color: #003087; border-left: 4px solid #003087; padding-left: 15px; margin: 30px 0 20px 0;">
						💪 PROGRAMME PERSONNALISÉ
					</h2>
					<p style="line-height: 1.8; margin: 20px 0;">
						Programme d'activité physique personnalisé adapté aux besoins et capacités du patient :
					</p>
					<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
						<tr>
							<td style="border: 1px solid #ddd; padding: 15px; background: #f8f9fa;">
								<strong style="color: #003087;">ENDURANCE</strong>
								<p style="margin-top: 10px;">${aiResponse.programme_perso.endurance}</p>
							</td>
							<td style="border: 1px solid #ddd; padding: 15px; background: #f8f9fa;">
								<strong style="color: #003087;">RENFORCEMENT</strong>
								<p style="margin-top: 10px;">${aiResponse.programme_perso.renforcement}</p>
							</td>
						</tr>
						<tr>
							<td style="border: 1px solid #ddd; padding: 15px; background: #f8f9fa;">
								<strong style="color: #003087;">ÉTIREMENTS</strong>
								<p style="margin-top: 10px;">${aiResponse.programme_perso.etirements}</p>
							</td>
							<td style="border: 1px solid #ddd; padding: 15px; background: #f8f9fa;">
								<strong style="color: #003087;">ÉQUILIBRE</strong>
								<p style="margin-top: 10px;">${aiResponse.programme_perso.equilibre || 'À définir selon évaluation'}</p>
							</td>
						</tr>
					</table>
					<div style="margin-top: auto; padding-top: 50px;">
						<div style="display: flex; justify-content: space-between; align-items: flex-end;">
							<div>
								<p>Fait à _______________, le ${documentDate}</p>
							</div>
							<div style="text-align: center;">
								<div style="border-bottom: 2px solid #000; width: 250px; height: 60px; margin-bottom: 10px;"></div>
								<p><strong>${doctorInfo.signature}</strong></p>
								${doctorInfo.rpps ? `<p style="font-size: 12px;">RPPS : ${doctorInfo.rpps}</p>` : ''}
							</div>
						</div>
					</div>
				</div>

				<!-- Page 5: Planning Hebdomadaire -->
				<div style="page-break-before: always; min-height: 297mm; display: flex; flex-direction: column;">
					<h2 style="color: #003087; border-left: 4px solid #003087; padding-left: 15px; margin: 30px 0 20px 0;">
						📅 PLANNING HEBDOMADAIRE
					</h2>
					<p style="line-height: 1.8; margin: 20px 0;">
						Planning hebdomadaire recommandé pour optimiser les bénéfices de l'activité physique :
					</p>
					<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
						<p style="line-height: 2;">${aiResponse.planification}</p>
					</div>
					<div style="margin-top: auto; padding-top: 50px;">
						<div style="display: flex; justify-content: space-between; align-items: flex-end;">
							<div>
								<p>Fait à _______________, le ${documentDate}</p>
							</div>
							<div style="text-align: center;">
								<div style="border-bottom: 2px solid #000; width: 250px; height: 60px; margin-bottom: 10px;"></div>
								<p><strong>${doctorInfo.signature}</strong></p>
								${doctorInfo.rpps ? `<p style="font-size: 12px;">RPPS : ${doctorInfo.rpps}</p>` : ''}
							</div>
						</div>
					</div>
				</div>

				<!-- Page 6: Orientation et Suivi -->
				<div style="page-break-before: always; min-height: 297mm; display: flex; flex-direction: column;">
					<h2 style="color: #003087; border-left: 4px solid #003087; padding-left: 15px; margin: 30px 0 20px 0;">
						🏥 ORIENTATION ET SUIVI
					</h2>
					<p style="line-height: 1.8; margin: 20px 0;">
						Orientation et suivi recommandés pour accompagner le patient dans sa démarche :
					</p>
					<ul style="line-height: 2; margin: 20px 0;">
						${aiResponse.orientation.map(orient => `<li style="margin: 10px 0;">${orient}</li>`).join('')}
					</ul>
					<div style="margin-top: auto; padding-top: 50px;">
						<div style="display: flex; justify-content: space-between; align-items: flex-end;">
							<div>
								<p>Fait à _______________, le ${documentDate}</p>
							</div>
							<div style="text-align: center;">
								<div style="border-bottom: 2px solid #000; width: 250px; height: 60px; margin-bottom: 10px;"></div>
								<p><strong>${doctorInfo.signature}</strong></p>
								${doctorInfo.rpps ? `<p style="font-size: 12px;">RPPS : ${doctorInfo.rpps}</p>` : ''}
							</div>
						</div>
					</div>
					
					<!-- Disclaimer -->
					<div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; margin-top: 30px; text-align: center;">
						<p style="color: #856404; font-size: 13px; margin: 0;">
							${aiResponse.disclaimer}
						</p>
					</div>
				</div>
			</div>
		`;
	}

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

		// Generate document content
		documentContent = generateDocumentHTML();

		// Initialize CKEditor
		if (typeof window !== 'undefined') {
			const ClassicEditor = (await import('@ckeditor/ckeditor5-editor-classic')).default.ClassicEditor;
			const Essentials = (await import('@ckeditor/ckeditor5-essentials')).default.Essentials;
			const Paragraph = (await import('@ckeditor/ckeditor5-paragraph')).default.Paragraph;
			const Bold = (await import('@ckeditor/ckeditor5-basic-styles')).default.Bold;
			const Italic = (await import('@ckeditor/ckeditor5-basic-styles')).default.Italic;
			const Underline = (await import('@ckeditor/ckeditor5-basic-styles')).default.Underline;
			const Heading = (await import('@ckeditor/ckeditor5-heading')).default.Heading;
			const List = (await import('@ckeditor/ckeditor5-list')).default.List;
			const Alignment = (await import('@ckeditor/ckeditor5-alignment')).default.Alignment;
			const FontSize = (await import('@ckeditor/ckeditor5-font')).default.FontSize;
			const FontColor = (await import('@ckeditor/ckeditor5-font')).default.FontColor;
			const FontBackgroundColor = (await import('@ckeditor/ckeditor5-font')).default.FontBackgroundColor;
			const Table = (await import('@ckeditor/ckeditor5-table')).default.Table;
			const TableToolbar = (await import('@ckeditor/ckeditor5-table')).default.TableToolbar;
			const PageBreak = (await import('@ckeditor/ckeditor5-page-break')).default.PageBreak;

			if (editorContainer) {
				editorInstance = await ClassicEditor.create(editorContainer, {
					plugins: [
						Essentials, Paragraph, Bold, Italic, Underline,
						Heading, List, Alignment, FontSize, FontColor, 
						FontBackgroundColor, Table, TableToolbar, PageBreak
					],
					toolbar: {
						items: [
							'heading', '|',
							'bold', 'italic', 'underline', '|',
							'fontSize', 'fontColor', 'fontBackgroundColor', '|',
							'alignment', '|',
							'bulletedList', 'numberedList', '|',
							'insertTable', '|',
							'pageBreak', '|',
							'undo', 'redo'
						]
					},
					heading: {
						options: [
							{ model: 'paragraph', title: 'Paragraphe', class: 'ck-heading_paragraph' },
							{ model: 'heading1', view: 'h1', title: 'Titre 1', class: 'ck-heading_heading1' },
							{ model: 'heading2', view: 'h2', title: 'Titre 2', class: 'ck-heading_heading2' },
							{ model: 'heading3', view: 'h3', title: 'Titre 3', class: 'ck-heading_heading3' }
						]
					},
					table: {
						contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
					},
					language: 'fr'
				});

				// Set initial content
				editorInstance.setData(documentContent);
			}
		}
	});

	onDestroy(() => {
		if (editorInstance) {
			editorInstance.destroy();
		}
	});

	function saveDocument() {
		if (editorInstance) {
			const content = editorInstance.getData();
			// Save to database
			supabase
				.from('llm_responses')
				.update({
					response_content: { ...aiResponse, generated_html: content },
					updated_at: new Date().toISOString()
				})
				.eq('submission_id', submissionId);
		}
		if (onUpdate) {
			onUpdate(aiResponse);
		}
	}

	function printDocument() {
		if (editorInstance) {
			const content = editorInstance.getData();
			const printWindow = window.open('', '_blank');
			if (printWindow) {
				printWindow.document.write(`
					<!DOCTYPE html>
					<html>
					<head>
						<title>Prescription d'Activité Physique Adaptée</title>
						<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
						<style>
							@page { size: A4; margin: 1cm; }
							body { font-family: 'Lato', Arial, sans-serif; }
							@media print {
								.page-break { page-break-before: always; }
							}
						</style>
					</head>
					<body>
						${content}
					</body>
					</html>
				`);
				printWindow.document.close();
				printWindow.print();
			}
		}
		if (onPrint) onPrint();
	}

	async function emailDocument() {
		const email = prompt('Email du patient :');
		if (email) {
			// TODO: Implement email sending
			if (onEmail) onEmail();
		}
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');
	
	:global(.ck-editor__editable) {
		min-height: 800px;
		font-family: 'Lato', Arial, sans-serif !important;
	}

	:global(.ck-content) {
		font-size: 14px;
		line-height: 1.8;
	}

	:global(.ck-content h1) {
		color: #003087;
		font-size: 24px;
		font-weight: 900;
		text-transform: uppercase;
	}

	:global(.ck-content h2) {
		color: #003087;
		font-size: 18px;
		font-weight: 700;
		border-left: 4px solid #003087;
		padding-left: 15px;
	}

	.container {
		font-family: "Lato", sans-serif;
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

	.editor-wrapper {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 2rem;
	}

	.editor-container {
		background: white;
		border-radius: 8px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
		overflow: hidden;
	}
</style>

<div class="container">
	<!-- Toolbar -->
	<div class="toolbar">
		<div class="toolbar-buttons">
			<button class="btn" onclick={printDocument}>
				🖨️ Imprimer
			</button>
			<button class="btn" onclick={emailDocument}>
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

	<!-- Editor -->
	<div class="editor-wrapper">
		<div class="editor-container">
			<div bind:this={editorContainer}></div>
		</div>
	</div>
</div>