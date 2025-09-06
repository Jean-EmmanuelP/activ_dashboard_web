<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Editor } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Placeholder from '@tiptap/extension-placeholder';
	import Typography from '@tiptap/extension-typography';

	let {
		content = $bindable(''),
		placeholder = 'Commencez à écrire...',
		minHeight = '200px',
		readonly = false,
		onUpdate = undefined
	}: {
		content: string;
		placeholder?: string;
		minHeight?: string;
		readonly?: boolean;
		onUpdate?: (content: string) => void;
	} = $props();

	let element = $state<HTMLDivElement>();
	let editor: Editor | null = null;

	onMount(() => {
		if (!element) return;
		
		editor = new Editor({
			element: element,
			extensions: [
				StarterKit.configure({
					heading: {
						levels: [1, 2, 3]
					},
					bulletList: {
						keepMarks: true,
						keepAttributes: false
					},
					orderedList: {
						keepMarks: true,
						keepAttributes: false
					}
				}),
				Placeholder.configure({
					placeholder: placeholder
				}),
				Typography
			],
			content: content,
			editable: !readonly,
			onUpdate: ({ editor }) => {
				const newContent = editor.getHTML();
				content = newContent;
				if (onUpdate) {
					onUpdate(newContent);
				}
			}
		});
	});

	// Watch for external content changes
	$effect(() => {
		if (editor && content !== editor.getHTML()) {
			editor.commands.setContent(content);
		}
	});

	// Watch for readonly changes
	$effect(() => {
		if (editor) {
			editor.setEditable(!readonly);
		}
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});

	// Export functions for external use
	export function getContent() {
		return editor?.getHTML() || '';
	}

	export function getTextContent() {
		return editor?.getText() || '';
	}

	export function setContent(newContent: string) {
		if (editor) {
			editor.commands.setContent(newContent);
		}
	}

	export function clearContent() {
		if (editor) {
			editor.commands.clearContent();
		}
	}

	export function focus() {
		if (editor) {
			editor.commands.focus();
		}
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');

	.tiptap-container {
		width: 100%;
		border: 2px solid #e5e7eb;
		border-radius: 0.5rem;
		overflow: hidden;
		transition: all 0.3s ease;
		background: white;
	}

	.tiptap-container:focus-within {
		border-color: #003087;
		box-shadow: 0 0 0 3px rgba(0, 48, 135, 0.1);
	}

	.tiptap-container.readonly {
		background: #f9fafb;
		border-color: #d1d5db;
	}

	:global(.tiptap) {
		padding: 1rem;
		font-family: 'Lato', sans-serif;
		font-size: 14px;
		line-height: 1.8;
		color: #111827;
		outline: none;
	}

	:global(.tiptap p) {
		margin: 0.5rem 0;
	}

	:global(.tiptap p:first-child) {
		margin-top: 0;
	}

	:global(.tiptap p:last-child) {
		margin-bottom: 0;
	}

	:global(.tiptap h1) {
		font-size: 1.875rem;
		font-weight: 900;
		color: #003087;
		margin: 1.5rem 0 1rem;
	}

	:global(.tiptap h2) {
		font-size: 1.5rem;
		font-weight: 700;
		color: #003087;
		margin: 1.25rem 0 0.75rem;
	}

	:global(.tiptap h3) {
		font-size: 1.25rem;
		font-weight: 600;
		color: #003087;
		margin: 1rem 0 0.5rem;
	}

	:global(.tiptap ul) {
		list-style-type: disc;
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	:global(.tiptap ol) {
		list-style-type: decimal;
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	:global(.tiptap li) {
		margin: 0.25rem 0;
	}

	:global(.tiptap strong) {
		font-weight: 700;
		color: #003087;
	}

	:global(.tiptap em) {
		font-style: italic;
	}

	:global(.tiptap blockquote) {
		border-left: 4px solid #003087;
		padding-left: 1rem;
		margin: 1rem 0;
		color: #6b7280;
		font-style: italic;
	}

	:global(.tiptap code) {
		background: #f3f4f6;
		border: 1px solid #e5e7eb;
		border-radius: 0.25rem;
		padding: 0.125rem 0.25rem;
		font-family: monospace;
		font-size: 0.875em;
	}

	:global(.tiptap pre) {
		background: #1f2937;
		color: #f9fafb;
		padding: 1rem;
		border-radius: 0.5rem;
		overflow-x: auto;
		margin: 1rem 0;
	}

	:global(.tiptap pre code) {
		background: none;
		border: none;
		padding: 0;
		color: inherit;
		font-size: 0.875rem;
	}

	:global(.tiptap hr) {
		border: none;
		border-top: 2px solid #e5e7eb;
		margin: 2rem 0;
	}

	/* Placeholder styles */
	:global(.tiptap p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		float: left;
		color: #9ca3af;
		pointer-events: none;
		height: 0;
	}

	:global(.tiptap.ProseMirror-focused p.is-editor-empty:first-child::before) {
		color: #d1d5db;
	}

	/* Selection styles */
	:global(.tiptap ::selection) {
		background: rgba(0, 48, 135, 0.1);
	}

	/* Focus styles */
	:global(.tiptap:focus) {
		outline: none;
	}

	/* Readonly styles */
	:global(.readonly .tiptap) {
		cursor: default;
		color: #6b7280;
	}

	/* Print styles */
	@media print {
		:global(.tiptap) {
			border: none;
			padding: 0;
		}
	}
</style>

<div 
	class="tiptap-container {readonly ? 'readonly' : ''}" 
	style="min-height: {minHeight};"
>
	<div bind:this={element}></div>
</div>