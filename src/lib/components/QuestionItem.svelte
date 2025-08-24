<script lang="ts">
	import type { Question, Answer } from '$lib/supabase';
	import { Label } from 'flowbite-svelte';
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
	
	// Find the answer for this specific question
	const currentAnswer = $derived(answers.find(a => a.question_id === question.id));
	const value = $derived(currentAnswer?.value || '');
	
	// Local state for editing - initialize with current value
	let localValue = $state('');
	
	// Set initial value and update when answer changes
	$effect(() => {
		const newValue = currentAnswer?.value || '';
		if (newValue !== localValue) {
			localValue = newValue;
		}
	});
	
	// Check if question should be visible based on condition
	const isVisible = $derived(
		!question.condition || 
		!(question.condition as any).parent_value || 
		(question.condition as any).parent_value === parentAnswer
	);
	
	function handleChange(newValue: string) {
		localValue = newValue;
		if (onUpdate) {
			onUpdate(question.id, newValue);
		}
	}
</script>

{#if isVisible}
	<div class="mb-4 {level > 0 ? `ml-${level * 4}` : ''} border-l-2 {level > 0 ? 'border-gray-200' : 'border-transparent'} pl-4">
		<Label for={`q-${question.id}`} class="mb-2 block text-sm font-medium text-gray-700">
			{question.text}
			{#if question.is_required}
				<span class="text-red-500 ml-1">*</span>
			{/if}
		</Label>
		
		{#if question.notes}
			<p class="text-xs text-gray-500 mb-2">{question.notes}</p>
		{/if}
		
		{#if editMode}
			{#if question.type === 'text'}
				<input
					id={`q-${question.id}`}
					type="text"
					value={localValue}
					on:input={(e) => handleChange(e.currentTarget.value)}
					required={question.is_required}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			{:else if question.type === 'number'}
				<input
					id={`q-${question.id}`}
					type="number"
					value={localValue}
					on:input={(e) => handleChange(e.currentTarget.value)}
					required={question.is_required}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			{:else if question.type === 'textarea'}
				<textarea
					id={`q-${question.id}`}
					value={localValue}
					on:input={(e) => handleChange(e.currentTarget.value)}
					required={question.is_required}
					rows="3"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			{:else if question.type === 'yesno'}
				<div class="flex gap-4">
					<label class="flex items-center cursor-pointer">
						<input
							type="radio"
							name={`q-${question.id}`}
							value="oui"
							checked={localValue === 'oui'}
							on:change={() => handleChange('oui')}
							class="mr-2"
						/>
						<span>Oui</span>
					</label>
					<label class="flex items-center cursor-pointer">
						<input
							type="radio"
							name={`q-${question.id}`}
							value="non"
							checked={localValue === 'non'}
							on:change={() => handleChange('non')}
							class="mr-2"
						/>
						<span>Non</span>
					</label>
				</div>
			{:else if question.type === 'select' && question.options}
				{@const optionsList = question.options?.values || question.options || []}
				<select
					id={`q-${question.id}`}
					value={localValue}
					on:change={(e) => handleChange(e.currentTarget.value)}
					required={question.is_required}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
				>
					<option value="">Sélectionner...</option>
					{#each optionsList as option}
						<option value={option}>{option}</option>
					{/each}
				</select>
			{/if}
		{:else}
			<div class="rounded-lg bg-blue-50 border border-blue-200 p-3">
				{#if localValue}
					<span class="text-blue-900 font-medium">{localValue}</span>
				{:else}
					<span class="text-gray-400 italic">Non renseigné</span>
				{/if}
			</div>
		{/if}
		
		{#if question.children && question.children.length > 0}
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
		{/if}
	</div>
{/if}