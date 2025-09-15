<script>
    import QuestionItem from './QuestionItem.svelte';

    let {
        questions = [],
        sections = [],
        answers = [],
        editMode = $bindable(false),
        hasChanges = false,
        saving = false,
        generatingAI = false,
        onUpdateAnswer,
        onCancelChanges,
        onSaveChanges,
        onSubmit
    } = $props();

    function getQuestionsForSection(sectionId) {
        return buildQuestionTree(questions.filter(q => q.section_id === sectionId && !q.parent_id), sectionId);
    }

    function buildQuestionTree(parentQuestions, sectionId) {
        return parentQuestions
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map(question => {
                const children = questions
                    .filter(q => q.parent_id === question.id)
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
                
                return {
                    ...question,
                    children: children.length > 0 ? buildQuestionTree(children, sectionId) : []
                };
            });
    }

    function handleUpdateAnswer(questionId, value, additionalNotes) {
        onUpdateAnswer?.(questionId, value, additionalNotes);
    }

    function cancelChanges() {
        editMode = false;
        onCancelChanges?.();
    }

    function saveAllChanges() {
        onSaveChanges?.();
    }

    function handleSubmit() {
        onSubmit?.();
    }
</script>

<div class="bg-white rounded-2xl shadow-lg p-8 mb-8">
    <div class="flex justify-between items-center mb-8 pb-6 border-b-2 border-gray-200">
        <div>
            <h2 class="text-2xl font-bold text-gray-900">
                Formulaire de santé
            </h2>
            <p class="text-gray-600 mt-1">
                {questions.length} questions • {answers.length} réponses
                {#if hasChanges}
                    <span class="text-amber-500 ml-2">⚠️ Modifications non sauvegardées</span>
                {/if}
            </p>
        </div>
        <div class="flex gap-3">
            {#if !editMode}
                <button class="bg-gradient-to-r from-blue-900 to-blue-800 text-white border-0 px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all duration-300 shadow-lg shadow-blue-900/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-900/30" onclick={() => editMode = true}>
                    ✏️ Modifier
                </button>
            {:else}
                <button class="bg-transparent text-gray-600 border-2 border-gray-200 px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:border-gray-400 hover:bg-gray-50" onclick={cancelChanges}>
                    Annuler
                </button>
                {#if hasChanges}
                    <button class="bg-white text-blue-900 border-2 border-blue-900 px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all duration-300 hover:bg-blue-900 hover:text-white disabled:opacity-50" onclick={saveAllChanges} disabled={saving}>
                        {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
                    </button>
                {/if}
                <button class="bg-gradient-to-r from-blue-900 to-blue-800 text-white border-0 px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all duration-300 shadow-lg shadow-blue-900/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-900/30 disabled:opacity-50" onclick={handleSubmit} disabled={saving || generatingAI}>
                    {generatingAI ? '🤖 Génération IA en cours...' : saving ? '⏳ En cours...' : '🚀 Soumettre & Générer IA'}
                </button>
            {/if}
        </div>
    </div>
    
    <!-- Sections and Questions -->
    {#each sections as section}
        {@const sectionQuestions = getQuestionsForSection(section.id)}
        <div class="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 transition-all duration-300 hover:border-blue-900 hover:shadow-lg hover:shadow-blue-900/10">
            <h3 class="text-xl font-bold text-blue-900 mb-2">
                {section.name}
                <span class="font-normal text-gray-500 ml-2 text-sm">
                    ({sectionQuestions.length} questions)
                </span>
            </h3>
            {#if section.description}
                <p class="text-gray-600 mb-4 text-sm">
                    {section.description}
                </p>
            {/if}
            
            <div class="mt-4">
                {#each sectionQuestions as question}
                    <QuestionItem
                        question={question}
                        answers={answers}
                        editMode={editMode}
                        onUpdate={handleUpdateAnswer}
                    />
                {/each}
            </div>
        </div>
    {/each}
    
    <!-- Orphan Questions -->
    {#each [buildQuestionTree(questions.filter(q => !q.section_id && !q.parent_id), null)] as orphanQuestions}
        {#if orphanQuestions.length > 0}
            <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-6 transition-all duration-300 hover:border-blue-900 hover:shadow-lg hover:shadow-blue-900/10">
                <h3 class="text-xl font-bold text-gray-600 mb-2">
                    Autres questions
                </h3>
                <div class="mt-4">
                    {#each orphanQuestions as question}
                        <QuestionItem
                            question={question}
                            answers={answers}
                            editMode={editMode}
                            onUpdate={handleUpdateAnswer}
                        />
                    {/each}
                </div>
            </div>
        {/if}
    {/each}
</div>