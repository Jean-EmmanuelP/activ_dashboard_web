<script>
	import privacyContent from '$lib/data/privacy-content.json';
	
	function formatText(text) {
		return text.replace(/\n/g, '<br>');
	}
</script>

<svelte:head>
	<title>Conditions Générales et Politique de Confidentialité - ACTIV</title>
	<meta name="description" content="Conditions générales d'utilisation, conditions de vente et politique de confidentialité d'ACTIV" />
</svelte:head>

<div class="privacy-container">
	<header class="privacy-header">
		<h1>{privacyContent.title}</h1>
		<a href="/" class="close-button">✕</a>
	</header>

	<main class="privacy-content">
		<div class="date-text">{privacyContent.lastUpdated}</div>
		<p class="welcome-text">{privacyContent.welcome}</p>

		<!-- CGU Section -->
		<section class="section">
			<h2 class="section-title">{privacyContent.sections.cgu.title}</h2>
			{#each Object.entries(privacyContent.sections.cgu.subsections) as [key, subsection]}
				<div class="subsection">
					<h3 class="subsection-title">{subsection.title}</h3>
					<p class="body-text">{@html formatText(subsection.content)}</p>
				</div>
			{/each}
		</section>

		<!-- CGV Section -->
		<section class="section">
			<h2 class="section-title">{privacyContent.sections.cgv.title}</h2>
			{#each Object.entries(privacyContent.sections.cgv.subsections) as [key, subsection]}
				<div class="subsection">
					<h3 class="subsection-title">{subsection.title}</h3>
					<p class="body-text">{@html formatText(subsection.content)}</p>
				</div>
			{/each}
		</section>

		<!-- Privacy Policy Section -->
		<section class="section">
			<h2 class="section-title">{privacyContent.sections.privacy.title}</h2>
			<p class="body-text">{@html formatText(privacyContent.sections.privacy.intro)}</p>
			{#each Object.entries(privacyContent.sections.privacy.subsections) as [key, subsection]}
				<div class="subsection">
					<h3 class="subsection-title">{subsection.title}</h3>
					<p class="body-text">{@html formatText(subsection.content)}</p>
				</div>
			{/each}
		</section>

		<!-- Legal Mentions Section -->
		<section class="section">
			<h2 class="section-title">{privacyContent.sections.legal.title}</h2>
			<p class="body-text">{@html formatText(privacyContent.sections.legal.content)}</p>
		</section>
	</main>
</div>

<style>
	.privacy-container {
		min-height: 100vh;
		background-color: white;
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
	}

	.privacy-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid #e0e0e0;
		background-color: white;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.privacy-header h1 {
		font-size: 1.25rem;
		font-weight: 700;
		color: #333;
		margin: 0;
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.875rem;
		height: 1.875rem;
		border-radius: 50%;
		background-color: #f0f0f0;
		color: #666;
		text-decoration: none;
		font-size: 1rem;
		transition: background-color 0.2s;
	}

	.close-button:hover {
		background-color: #e0e0e0;
	}

	.privacy-content {
		padding: 1.25rem;
		max-width: 800px;
		margin: 0 auto;
	}

	.date-text {
		font-size: 0.875rem;
		color: #666;
		margin-bottom: 1rem;
		font-style: italic;
	}

	.welcome-text {
		font-size: 0.875rem;
		line-height: 1.6;
		color: #555;
		margin-bottom: 1.5rem;
		text-align: justify;
	}

	.section {
		margin-bottom: 2rem;
	}

	.section-title {
		font-size: 1.125rem;
		font-weight: 700;
		color: #333;
		margin: 1.5rem 0 1rem 0;
	}

	.subsection {
		margin-bottom: 1.5rem;
	}

	.subsection-title {
		font-size: 1rem;
		font-weight: 600;
		color: #444;
		margin: 1rem 0 0.5rem 0;
	}

	.body-text {
		font-size: 0.875rem;
		line-height: 1.6;
		color: #555;
		margin-bottom: 1rem;
		text-align: justify;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.privacy-content {
			padding: 1rem;
		}
		
		.privacy-header {
			padding: 1rem;
		}
		
		.privacy-header h1 {
			font-size: 1.125rem;
		}
	}
</style>