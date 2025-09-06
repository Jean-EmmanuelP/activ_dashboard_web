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

	function generateConseilsContent() {
		const patient = submission?.patient_info || {};
		const date = new Date().toLocaleDateString('fr-FR');
		
		return `
			<h1>CONSEILS D'ACTIVITÉ PHYSIQUE ADAPTÉE</h1>
			<p class="subtitle">Document personnalisé pour ${patient.firstName || 'Prénom'} ${patient.lastName || 'Nom'}<br>Remis le ${date}</p>

			<div class="section">
				<h2>✅ DIX CONSEILS PRATIQUES</h2>
				<ol style="line-height: 1.8;">
					<li style="margin-bottom: 1rem;"><strong>Le maître mot est de prendre du plaisir</strong><br>
						<span style="color: #666; font-size: 0.95em;">Choisissez des activités qui vous plaisent pour maintenir votre motivation sur le long terme.</span>
					</li>
					<li style="margin-bottom: 1rem;"><strong>Prévoir un échauffement de 5-10 minutes avant chaque activité</strong><br>
						<span style="color: #666; font-size: 0.95em;">Commencez doucement pour préparer votre corps à l'effort.</span>
					</li>
					<li style="margin-bottom: 1rem;"><strong>Rompre les périodes de sédentarité</strong><br>
						<span style="color: #666; font-size: 0.95em;">Toutes les 2 heures en position assise, levez-vous et bougez pendant au moins 5 minutes (marche, étirements, activités domestiques).</span>
					</li>
					<li style="margin-bottom: 1rem;"><strong>Fractionner si nécessaire</strong><br>
						<span style="color: #666; font-size: 0.95em;">En cas de manque de temps, vous pouvez diviser vos séances en périodes de 10 minutes.</span>
					</li>
					<li style="margin-bottom: 1rem;"><strong>Comprendre l'intensité de l'activité</strong><br>
						<span style="color: #666; font-size: 0.95em;">
						• <strong>Modérée :</strong> Respiration accélérée mais conversation possible (marche, jardinage)<br>
						• <strong>Élevée :</strong> Respiration rapide et conversation difficile (course, natation)
						</span>
					</li>
					<li style="margin-bottom: 1rem;"><strong>Respecter les temps de récupération</strong><br>
						<span style="color: #666; font-size: 0.95em;">Prévoyez au moins un jour de repos entre deux séances similaires (ex: musculation).</span>
					</li>
					<li style="margin-bottom: 1rem;"><strong>Conditions à éviter</strong><br>
						<span style="color: #666; font-size: 0.95em;">
						• Température extérieure >28°C ou <5°C<br>
						• Pics de pollution atmosphérique<br>
						• Fièvre ou 8 jours après une infection
						</span>
					</li>
					<li style="margin-bottom: 1rem;"><strong>Ne jamais fumer</strong><br>
						<span style="color: #666; font-size: 0.95em;">Interdiction de fumer dans les 2 heures avant et après l'activité physique.</span>
					</li>
					<li style="margin-bottom: 1rem;"><strong>Suivi personnalisé</strong><br>
						<span style="color: #666; font-size: 0.95em;">Ces recommandations peuvent être ajustées avec un professionnel de santé.</span>
					</li>
					<li style="margin-bottom: 0;"><strong>Progression adaptée</strong><br>
						<span style="color: #666; font-size: 0.95em;">Commencez doucement et augmentez progressivement selon vos capacités.</span>
					</li>
				</ol>
			</div>

			<div class="section">
				<h2>💚 BÉNÉFICES ATTENDUS</h2>
				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
					<div>
						<h3 style="color: #003087; font-size: 1.1em; margin-bottom: 0.75rem;">Santé Physique</h3>
						<ul style="list-style: none; padding-left: 0;">
							<li style="margin: 0.5rem 0;">✓ Amélioration de la condition cardiovasculaire</li>
							<li style="margin: 0.5rem 0;">✓ Renforcement musculaire</li>
							<li style="margin: 0.5rem 0;">✓ Amélioration de l'équilibre et coordination</li>
							<li style="margin: 0.5rem 0;">✓ Réduction des risques de maladies chroniques</li>
							<li style="margin: 0.5rem 0;">✓ Contrôle du poids</li>
						</ul>
					</div>
					<div>
						<h3 style="color: #003087; font-size: 1.1em; margin-bottom: 0.75rem;">Bien-être Mental</h3>
						<ul style="list-style: none; padding-left: 0;">
							<li style="margin: 0.5rem 0;">✓ Réduction du stress et de l'anxiété</li>
							<li style="margin: 0.5rem 0;">✓ Amélioration de la qualité du sommeil</li>
							<li style="margin: 0.5rem 0;">✓ Augmentation de l'estime de soi</li>
							<li style="margin: 0.5rem 0;">✓ Amélioration de l'humeur</li>
							<li style="margin: 0.5rem 0;">✓ Meilleure concentration</li>
						</ul>
					</div>
				</div>
			</div>

			<div class="section">
				<h2>📅 EXEMPLE DE PLANIFICATION HEBDOMADAIRE</h2>
				<p style="margin-bottom: 1.5rem; color: #666;">Voici un exemple de programme adapté à vos besoins. N'hésitez pas à l'ajuster selon vos disponibilités et votre forme du jour.</p>
				<table style="width: 100%; border-collapse: collapse;">
					<thead>
						<tr style="background: linear-gradient(135deg, #003087, #004bb5);">
							<th style="padding: 1rem; color: white; text-align: left; width: 20%;">Jour</th>
							<th style="padding: 1rem; color: white; text-align: left;">Matin</th>
							<th style="padding: 1rem; color: white; text-align: left;">Après-midi</th>
							<th style="padding: 1rem; color: white; text-align: left;">Soir</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #003087;">Lundi</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">🚶 Marche 30 min</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; color: #999;">Repos</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">🧘 Étirements 10 min</td>
						</tr>
						<tr style="background: #f9fafb;">
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #003087;">Mardi</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; color: #999;">Repos</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">🏊 Natation 30 min</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">🧘 Relaxation 15 min</td>
						</tr>
						<tr>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #003087;">Mercredi</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">💪 Renforcement 20 min</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">🚶 Marche 20 min</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; color: #999;">Repos</td>
						</tr>
						<tr style="background: #f9fafb;">
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #003087;">Jeudi</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; color: #999;">Repos</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">🧘 Yoga 30 min</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; color: #999;">Repos</td>
						</tr>
						<tr>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #003087;">Vendredi</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">🚶 Marche 30 min</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; color: #999;">Repos</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">🧘 Étirements 10 min</td>
						</tr>
						<tr style="background: #f9fafb;">
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #003087;">Samedi</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">✨ Activité libre 45 min</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; color: #999;">Repos</td>
							<td style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; color: #999;">Repos</td>
						</tr>
						<tr>
							<td style="padding: 0.75rem; font-weight: 600; color: #003087;">Dimanche</td>
							<td style="padding: 0.75rem;">🌳 Repos actif</td>
							<td style="padding: 0.75rem;">👨‍👩‍👧 Balade famille</td>
							<td style="padding: 0.75rem; color: #999;">Repos</td>
						</tr>
					</tbody>
				</table>
				<div style="margin-top: 1.5rem; padding: 1rem; background: #e8f4fd; border-left: 4px solid #003087; border-radius: 4px;">
					<p style="margin: 0; font-size: 0.95em;"><strong>Rappel important :</strong> Ce planning est flexible. Écoutez votre corps et adaptez selon votre forme du jour.</p>
				</div>
			</div>

			<div class="section">
				<h2>🧭 Proposition d'orientation</h2>
				
				<h3>Enseignant en Activité Physique Adaptée</h3>
				<p>Pour un accompagnement personnalisé, vous pouvez contacter :</p>
				<ul>
					<li><strong>Structure :</strong> ………………………………</li>
					<li><strong>Adresse :</strong> ………………………………</li>
					<li><strong>Téléphone :</strong> ………………………………</li>
					<li><strong>Email :</strong> ………………………………</li>
				</ul>
				<p>Ou rendez-vous sur : <a href="https://monbilansportsante.fr/patient/etape3">monbilansportsante.fr</a></p>
				<p class="info-box">Le sport sur ordonnance avec des enseignants en activité physique adaptée ne bénéficie pas d'un remboursement par la sécurité sociale, mais certaines mutuelles les prennent en charge.</p>

				<h3>Ressources en ligne</h3>
				<ul>
					<li>Pour trouver des équipements sportifs : <a href="https://equipements.sports.gouv.fr">equipements.sports.gouv.fr</a></li>
					<li>Application mobile : Decathlon Coach pour des séances à domicile</li>
					<li>Vidéos d'exercices adaptés : Chaîne YouTube Fresh & Fit</li>
				</ul>
			</div>

			<div class="section">
				<h2>📝 Notes personnalisées</h2>
				<p>………………………………………………………………………………</p>
				<p>………………………………………………………………………………</p>
				<p>………………………………………………………………………………</p>
			</div>

			<div class="footer">
				<p class="disclaimer">✳️ Nos conseils ne remplacent pas une consultation médicale</p>
				<p class="sources">Sources : HAS - Guide de promotion, consultation et prescription médicale d'activité physique et sportive pour la santé (2022)</p>
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
			content: generateConseilsContent(),
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

	.conseils-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
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
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
		padding: 3rem;
		border-radius: 8px;
		margin: 0 auto;
		box-sizing: border-box;
	}

	:global(.ProseMirror) {
		font-family: 'Lato', sans-serif;
		font-size: 12pt;
		line-height: 1.6;
		color: #333;
		min-height: 100%;
		outline: none;
	}

	:global(.ProseMirror h1) {
		font-size: 22pt;
		font-weight: 900;
		color: #003087;
		text-align: center;
		margin: 0 0 1rem 0;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	:global(.ProseMirror .subtitle) {
		text-align: center;
		color: #666;
		font-style: italic;
		margin-bottom: 2rem;
	}

	:global(.ProseMirror h2) {
		font-size: 16pt;
		font-weight: 700;
		color: #003087;
		margin: 2rem 0 1rem 0;
		border-bottom: 2px solid #003087;
		padding-bottom: 0.5rem;
	}

	:global(.ProseMirror h3) {
		font-size: 13pt;
		font-weight: 600;
		color: #003087;
		margin: 1.5rem 0 0.75rem 0;
	}

	:global(.ProseMirror .section) {
		margin-bottom: 3rem;
	}

	:global(.ProseMirror ol),
	:global(.ProseMirror ul) {
		margin: 1rem 0;
		padding-left: 2rem;
	}

	:global(.ProseMirror li) {
		margin: 0.5rem 0;
		line-height: 1.6;
	}

	:global(.ProseMirror table) {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
		font-size: 11pt;
	}

	:global(.ProseMirror th) {
		background: #003087;
		color: white;
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
	}

	:global(.ProseMirror td) {
		padding: 0.75rem;
		border: 1px solid #dee2e6;
	}

	:global(.ProseMirror tr:nth-child(even)) {
		background: #f8f9fa;
	}

	:global(.ProseMirror .info-box) {
		background: #e8f4fd;
		border-left: 4px solid #003087;
		padding: 1rem;
		margin: 1rem 0;
		font-style: italic;
	}

	:global(.ProseMirror a) {
		color: #003087;
		text-decoration: underline;
	}

	:global(.ProseMirror .footer) {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 2px solid #dee2e6;
	}

	:global(.ProseMirror .disclaimer) {
		text-align: center;
		font-weight: 600;
		color: #666;
		margin-bottom: 0.5rem;
	}

	:global(.ProseMirror .sources) {
		text-align: center;
		font-size: 10pt;
		color: #999;
		font-style: italic;
	}

	@media print {
		.toolbar {
			display: none;
		}

		.editor-wrapper {
			padding: 0;
			background: white;
		}

		.editor-content {
			box-shadow: none;
			border-radius: 0;
			max-width: 100%;
			padding: 20mm;
		}
	}
</style>

<div class="conseils-container">
	<div class="toolbar">
		<span class="toolbar-title">Conseils d'Activité Physique Adaptée</span>
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