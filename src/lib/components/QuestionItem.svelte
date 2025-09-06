<script lang="ts">
	import type { Question, Answer } from '$lib/supabase';
	import QuestionItem from './QuestionItem.svelte';
	
	let {
		question,
		answers = [],
		editMode = false,
		level = 0,
		onUpdate,
		parentAnswer = null
	}: {
		question: Question;
		answers?: Answer[];
		editMode?: boolean;
		level?: number;
		onUpdate?: (questionId: number, value: string) => void;
		parentAnswer?: string | null;
	} = $props();
	
	const currentAnswer = $derived(answers.find(a => a.question_id === question.id));
	const value = $derived(currentAnswer?.value || '');
	
	let localValue = $state('');
	
	$effect(() => {
		const newValue = currentAnswer?.value || '';
		if (newValue !== localValue) {
			localValue = newValue;
		}
	});
	
	function checkCondition(condition: any): boolean {
		if (!condition) return true;
		
		if (condition.and && Array.isArray(condition.and)) {
			return condition.and.every((cond: any) => {
				if (cond.type === 'equals') {
					const parentAns = answers.find(a => a.question_id === cond.parent_id);
					return parentAns?.value === cond.value;
				}
				if (cond.type === 'less_than') {
					const parentAns = answers.find(a => a.question_id === cond.parent_id);
					const numValue = parseFloat(parentAns?.value || '999');
					return numValue < cond.value;
				}
				return true;
			});
		}
		
		if (condition.parent_value) {
			if (Array.isArray(condition.parent_value)) {
				return condition.parent_value.includes(parentAnswer);
			}
			return condition.parent_value === parentAnswer;
		}
		
		if (condition.previous) {
			return true;
		}
		
		return true;
	}
	
	const isVisible = $derived(checkCondition(question.condition));
	
	function handleChange(newValue: string) {
		localValue = newValue;
		if (onUpdate) {
			onUpdate(question.id, newValue);
		}
	}
</script>

<style>
	.question-input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		font-size: 1rem;
		font-family: "Lato", sans-serif;
		transition: all 0.2s ease;
		background-color: white;
	}
	
	.question-input:focus {
		outline: none;
		border-color: #60CDFF;
		box-shadow: 0 0 0 3px rgba(96, 205, 255, 0.1);
	}
	
	.question-input:disabled {
		background-color: #f9fafb;
		cursor: not-allowed;
	}
	
	.question-textarea {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		font-size: 1rem;
		font-family: "Lato", sans-serif;
		transition: all 0.2s ease;
		background-color: white;
		resize: vertical;
		min-height: 100px;
	}
	
	.question-textarea:focus {
		outline: none;
		border-color: #60CDFF;
		box-shadow: 0 0 0 3px rgba(96, 205, 255, 0.1);
	}
	
	.question-select {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		font-size: 1rem;
		font-family: "Lato", sans-serif;
		transition: all 0.2s ease;
		background-color: white;
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
		background-position: right 0.5rem center;
		background-repeat: no-repeat;
		background-size: 1.5em 1.5em;
		padding-right: 2.5rem;
	}
	
	.question-select:focus {
		outline: none;
		border-color: #60CDFF;
		box-shadow: 0 0 0 3px rgba(96, 205, 255, 0.1);
	}
	
	.radio-option {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
		background-color: white;
	}
	
	.radio-option:hover {
		border-color: #60CDFF;
		background-color: #f0f9ff;
	}
	
	.radio-option.selected {
		border-color: #60CDFF;
		background-color: rgba(96, 205, 255, 0.1);
	}
	
	.radio-input {
		width: 1.25rem;
		height: 1.25rem;
		margin-right: 0.75rem;
		accent-color: #012991;
	}
	
	.value-display {
		padding: 1rem;
		border-radius: 0.75rem;
		background-color: rgba(96, 205, 255, 0.1);
		border: 2px solid #60CDFF;
		font-family: "Lato", sans-serif;
	}
	
	.question-label {
		display: block;
		font-weight: 600;
		color: #374151;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
		font-family: "Lato", sans-serif;
	}
	
	.question-notes {
		font-size: 0.875rem;
		color: #6b7280;
		margin-top: 0.25rem;
		margin-bottom: 0.75rem;
		font-style: italic;
		font-family: "Lato", sans-serif;
	}
</style>

{#if isVisible}
	<div class="mb-6 {level > 0 ? `ml-${level * 4}` : ''} {level > 0 ? 'pl-6' : ''}" style="{level > 0 ? 'border-left: 3px solid #60CDFF; padding-left: 1.5rem;' : ''}">
		<label for={`q-${question.id}`} class="question-label">
			{question.text}
			{#if question.is_required}
				<span style="color: #ef4444;" class="ml-1">*</span>
			{/if}
		</label>
		
		{#if question.notes}
			<p class="question-notes">{question.notes}</p>
		{/if}
		
		{#if editMode}
			{#if question.type === 'group'}
				<div style="padding: 1rem; background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 0.75rem;">
					<span style="color: #6b7280; font-size: 0.875rem;">Groupe de questions</span>
				</div>
			{:else if question.type === 'text'}
				<input
					id={`q-${question.id}`}
					type="text"
					value={localValue}
					oninput={(e) => handleChange(e.currentTarget.value)}
					required={question.is_required}
					class="question-input"
				/>
			{:else if question.type === 'number'}
				{@const range = question.range as any || {}}
				<input
					id={`q-${question.id}`}
					type="number"
					value={localValue}
					min={range.min}
					max={range.max}
					oninput={(e) => handleChange(e.currentTarget.value)}
					required={question.is_required}
					class="question-input"
				/>
				{#if range.min !== undefined || range.max !== undefined}
					<p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem;">
						{#if range.min !== undefined && range.max !== undefined}
							Valeur entre {range.min} et {range.max}
						{:else if range.min !== undefined}
							Valeur minimum: {range.min}
						{:else}
							Valeur maximum: {range.max}
						{/if}
					</p>
				{/if}
			{:else if question.type === 'textarea'}
				<textarea
					id={`q-${question.id}`}
					value={localValue}
					oninput={(e) => handleChange(e.currentTarget.value)}
					required={question.is_required}
					class="question-textarea"
				></textarea>
			{:else if question.type === 'yesno'}
				{@const yesnoOptions = question.options?.values || ['oui', 'non']}
				<div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
					{#each yesnoOptions as option}
						<label class="radio-option {localValue === option ? 'selected' : ''}">
							<input
								type="radio"
								name={`q-${question.id}`}
								value={option}
								checked={localValue === option}
								onchange={() => handleChange(option)}
								class="radio-input"
							/>
							<span style="text-transform: capitalize;">{option === 'oui' ? 'Oui' : option === 'non' ? 'Non' : option}</span>
						</label>
					{/each}
				</div>
			{:else if question.type === 'select'}
				{@const optionsList = (question.options as any)?.values || []}
				{#if optionsList.length > 0}
					<select
						id={`q-${question.id}`}
						value={localValue}
						onchange={(e) => handleChange(e.currentTarget.value)}
						required={question.is_required}
						class="question-select"
					>
						<option value="">Sélectionner...</option>
						{#each optionsList as option}
							<option value={option}>{option}</option>
						{/each}
					</select>
				{:else}
					<div style="padding: 0.75rem; background-color: #fef3c7; color: #92400e; border-radius: 0.5rem; font-size: 0.875rem;">
						Aucune option disponible
					</div>
				{/if}
			{/if}
		{:else}
			{#if question.type !== 'group'}
				<div class="value-display">
					{#if localValue}
						<span style="font-weight: 600; color: #012991;">{localValue}</span>
					{:else}
						<span style="font-style: italic; color: #9ca3af;">Non renseigné</span>
					{/if}
				</div>
			{/if}
		{/if}
		
		{#if question.children && question.children.length > 0}
			<div style="margin-top: 1rem;">
				{#each question.children as childQuestion}
					<QuestionItem
						question={childQuestion}
						answers={answers}
						editMode={editMode}
						level={level + 1}
						onUpdate={onUpdate}
						parentAnswer={localValue}
					/>
				{/each}
			</div>
		{/if}
	</div>
{/if}