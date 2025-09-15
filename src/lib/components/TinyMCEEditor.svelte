<script lang="ts">
	import { onMount } from 'svelte';
	import Editor from '@tinymce/tinymce-svelte';
	import signatureImg from '$lib/assets/signature.png';

	let {
		content = $bindable(''),
		placeholder = 'Commencez à écrire...',
		minHeight = 200,
		readonly = false,
		onUpdate = undefined,
		apiKey = 'dpou6ablp085r2lirbun3cab140dkcrlmwuekrlo9h1g6j7h',
		showHeader = false,
		doctorInfo = {
			name: 'Dr. [Nom du médecin]',
			specialty: 'Médecin prescripteur',
			rpps: '[RPPS]',
			address: '[Adresse du cabinet]',
			phone: '[Téléphone]',
			email: '[Email]'
		},
		patientInfo = {
			name: '[Nom du patient]',
			birthDate: '[Date de naissance]'
		},
		documentDate = new Date().toLocaleDateString('fr-FR')
	}: {
		content: string;
		placeholder?: string;
		minHeight?: number;
		readonly?: boolean;
		onUpdate?: (content: string) => void;
		apiKey?: string;
		showHeader?: boolean;
		doctorInfo?: {
			name: string;
			specialty: string;
			rpps: string;
			address: string;
			phone: string;
			email: string;
		};
		patientInfo?: {
			name: string;
			birthDate: string;
		};
		documentDate?: string;
	} = $props();

	let editorRef: any = null;

	// Generate header HTML if needed
	function generateHeader() {
		if (!showHeader) return '';
		
		return `
			<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding: 20px; border-bottom: 2px solid #000; page-break-inside: avoid;">
				<div style="flex: 1; border: 2px solid #000; padding: 15px; margin-right: 30px; font-size: 11px; line-height: 1.4;">
					<strong>${doctorInfo.name}</strong><br/>
					Spécialité : ${doctorInfo.specialty}<br/>
					RPPS : ${doctorInfo.rpps}<br/>
					Adresse : ${doctorInfo.address}<br/>
					Téléphone : ${doctorInfo.phone}<br/>
					Mail : ${doctorInfo.email}
				</div>
				<div style="flex: 1; border: 2px solid #000; padding: 15px; margin-left: 30px; font-size: 11px; line-height: 1.4;">
					<strong>${patientInfo.name}</strong><br/><br/>
					Date de naissance ${patientInfo.birthDate}
				</div>
			</div>
			<div style="text-align: right; margin-bottom: 20px; font-size: 12px;">
				Le ${documentDate}
			</div>
		`;
	}

	const conf = {
		height: minHeight,
		menubar: false,
		plugins: [
			'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
			'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
			'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount', 'pagebreak'
		],
		toolbar: readonly ? false : 'undo redo | blocks | ' +
			'bold italic forecolor | alignleft aligncenter ' +
			'alignright alignjustify | bullist numlist outdent indent | ' +
			'removeformat | pagebreak | insertSignature | help',
		placeholder: placeholder,
		readonly: readonly,
		content_style: `
			@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');
			body {
				font-family: 'Lato', sans-serif;
				font-size: 14px;
				line-height: 1.8;
				color: #111827;
				padding: 1rem;
			}
			@media print {
				@page {
					size: A4;
					margin: 1cm;
				}
				.mce-pagebreak {
					page-break-before: always;
				}
			}
			h1 {
				font-size: 1.875rem;
				font-weight: 900;
				color: #003087;
				margin: 1.5rem 0 1rem;
			}
			h2 {
				font-size: 1.5rem;
				font-weight: 700;
				color: #003087;
				margin: 1.25rem 0 0.75rem;
			}
			h3 {
				font-size: 1.25rem;
				font-weight: 600;
				color: #003087;
				margin: 1rem 0 0.5rem;
			}
			strong {
				font-weight: 700;
				color: #003087;
			}
			blockquote {
				border-left: 4px solid #003087;
				padding-left: 1rem;
				margin: 1rem 0;
				color: #6b7280;
				font-style: italic;
			}
		`,
		setup: (editor: any) => {
			editorRef = editor;
			
			// Add header when editor is ready if showHeader is true
			editor.on('init', () => {
				if (showHeader && content) {
					// Process content to add headers on each page
					const processedContent = addHeadersToContent(content);
					editor.setContent(processedContent);
				}
			});
			
			editor.on('change', () => {
				const newContent = editor.getContent();
				content = newContent;
				if (onUpdate) {
					onUpdate(newContent);
				}
			});
			
			// Add custom command to insert header
			editor.addCommand('insertHeader', () => {
				const header = generateHeader();
				if (header) {
					editor.insertContent(header);
				}
			});
			
			// Add custom button for signature
			editor.ui.registry.addButton('insertSignature', {
				text: 'Signature',
				tooltip: 'Insérer la signature',
				onAction: () => {
					const signatureHtml = `
						<p style="font-size: 10px; margin: 0.75rem 0;">Document remis en main propre</p>
						<div style="text-align: right; margin-top: 2rem;">
							<img src="${signatureImg}" alt="Signature" style="height: 60px; margin-bottom: 0.5rem; display: block; margin-left: auto;" />
							<div>${doctorInfo.name}</div>
						</div>
					`;
					editor.insertContent(signatureHtml);
				}
			});
		}
	};

	// Function to add headers to content at page breaks
	function addHeadersToContent(htmlContent: string) {
		if (!showHeader) return htmlContent;
		
		const header = generateHeader();
		
		// Split content by page breaks
		const pageBreakRegex = /<div class="mce-pagebreak"[^>]*>.*?<\/div>|<!-- pagebreak -->/gi;
		const pages = htmlContent.split(pageBreakRegex);
		
		// Add header to each page
		let processedContent = '';
		for (let i = 0; i < pages.length; i++) {
			if (i === 0) {
				// First page - add header at the beginning
				processedContent += header + pages[i];
			} else {
				// Subsequent pages - add page break, then header, then content
				processedContent += '<div class="mce-pagebreak" style="page-break-before: always;"></div>';
				processedContent += header + pages[i];
			}
		}
		
		return processedContent;
	}
	
	// Export functions for external use
	export function getContent() {
		return editorRef?.getContent() || '';
	}

	export function getTextContent() {
		return editorRef?.getContent({ format: 'text' }) || '';
	}

	export function setContent(newContent: string) {
		if (editorRef) {
			const processedContent = showHeader ? addHeadersToContent(newContent) : newContent;
			editorRef.setContent(processedContent);
		}
	}
	
	export function insertPageBreakWithHeader() {
		if (editorRef) {
			const pageBreak = '<div class="mce-pagebreak" style="page-break-before: always;"></div>';
			const header = generateHeader();
			editorRef.insertContent(pageBreak + header);
		}
	}

	export function insertSignature() {
		if (editorRef) {
			const signatureHtml = `
				<p style="font-size: 10px; margin: 0.75rem 0;">Document remis en main propre</p>
				<div style="text-align: right; margin-top: 2rem;">
					<img src="${signatureImg}" alt="Signature" style="height: 60px; margin-bottom: 0.5rem;" />
					<div>${doctorInfo.name}</div>
				</div>
			`;
			editorRef.insertContent(signatureHtml);
		}
	}

	export function clearContent() {
		if (editorRef) {
			editorRef.setContent('');
		}
	}

	export function focus() {
		if (editorRef) {
			editorRef.focus();
		}
	}

	export function print() {
		if (editorRef) {
			const content = editorRef.getContent();
			const printWindow = window.open('', '_blank');
			if (printWindow) {
				printWindow.document.write(`
					<!DOCTYPE html>
					<html>
					<head>
						<title>Prescription d'Activité Physique Adaptée</title>
						<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
						<style>
							@page { 
								size: A4; 
								margin: 1cm;
							}
							body { 
								font-family: 'Lato', Arial, sans-serif;
								font-size: 12px;
								line-height: 1.6;
							}
							.mce-pagebreak {
								page-break-before: always;
							}
							@media print {
								.mce-pagebreak {
									page-break-before: always;
								}
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
	}
</script>

<style>
	.tinymce-container {
		width: 100%;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		overflow: hidden;
		transition: all 0.3s ease;
		background: white;
	}

	.tinymce-container:focus-within {
		border-color: #003087;
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
	}

	.tinymce-container.readonly {
		background: #f9fafb;
		border-color: #d1d5db;
	}

	:global(.tox-tinymce) {
		border: none !important;
	}

	:global(.tox .tox-toolbar__primary) {
		background: #f9fafb !important;
		border-bottom: 1px solid #e5e7eb !important;
	}

	:global(.tox .tox-tbtn) {
		color: #374151 !important;
	}

	:global(.tox .tox-tbtn:hover) {
		background: #e5e7eb !important;
	}

	:global(.tox .tox-tbtn--enabled) {
		background: #003087 !important;
		color: white !important;
	}

	/* Readonly styles */
	:global(.readonly .tox-editor-header) {
		display: none !important;
	}

	/* Print styles */
	@media print {
		.tinymce-container {
			border: none;
			padding: 0;
		}
	}
</style>

<div class="tinymce-container {readonly ? 'readonly' : ''}">
	<Editor
		{apiKey}
		value={content}
		{conf}
		on:change={() => {
			// Handler already set in setup
		}}
	/>
</div>