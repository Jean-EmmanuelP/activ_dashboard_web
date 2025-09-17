<script lang="ts">
	import { onMount } from 'svelte';
	import TinyMCEEditor from './TinyMCEEditor.svelte';
	import { supabase } from '$lib/supabase';
	import type { AIRecommendationResponse } from '$lib/types/ai';

	let {
		submission = null,
		aiResponse = null
	}: {
		submission: any;
		aiResponse: AIRecommendationResponse | null;
	} = $props();

	let editorRef: TinyMCEEditor;
	let content = $state('');
	
	let doctorInfo = $state({
		name: 'Dr. [Nom du médecin]',
		specialty: 'Médecin prescripteur',
		rpps: '[RPPS]',
		address: '[Adresse du cabinet]',
		phone: '[Téléphone]',
		email: '[Email]'
	});

	let patientInfo = $state({
		name: '[Nom du patient]',
		birthDate: '[Date de naissance]'
	});

	function formatPlanificationTable(planification: string): string {
		if (!planification) return '';
		
		// Exemple de données par défaut si le parsing échoue
		const defaultWeekPlan = [
			{ jour: 'Lundi', activite: 'Marche active', duree: '30 min', intensite: 'Modérée', observations: 'Commencer progressivement' },
			{ jour: 'Mardi', activite: 'Repos ou étirements', duree: '15 min', intensite: 'Légère', observations: 'Bien s\'hydrater' },
			{ jour: 'Mercredi', activite: 'Activité adaptée', duree: '45 min', intensite: 'Modérée', observations: 'Selon recommandations' },
			{ jour: 'Jeudi', activite: 'Repos actif', duree: '20 min', intensite: 'Légère', observations: 'Mobilité articulaire' },
			{ jour: 'Vendredi', activite: 'Marche ou vélo', duree: '30 min', intensite: 'Modérée', observations: 'Adapter selon fatigue' },
			{ jour: 'Samedi', activite: 'Activité plaisir', duree: '45 min', intensite: 'Variable', observations: 'Selon envies' },
			{ jour: 'Dimanche', activite: 'Repos', duree: '-', intensite: '-', observations: 'Récupération complète' }
		];

		try {
			// Parser le format spécifique de l'IA : "Lundi matin | Marche | 30 minutes | ..."
			const lines = planification.split('\n').filter(line => line.trim());
			let parsedPlan = [];
			
			console.log('🔍 Parsing planification:', planification);
			
			for (const line of lines) {
				// Chercher le pattern "Jour [moment] | Activité | Durée | ..."
				const match = line.match(/^(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)\s*([^|]*)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*(.*)/i);
				
				if (match) {
					const [, jour, moment, activite, duree, details] = match;
					
					// Extraire l'intensité des détails si possible
					let intensite = 'Modérée';
					let observations = details || 'Selon recommandations';
					
					if (details) {
						const intensiteMatch = details.match(/(légère|modérée|intense|faible|forte|douce)/gi);
						if (intensiteMatch) {
							intensite = intensiteMatch[0].charAt(0).toUpperCase() + intensiteMatch[0].slice(1);
						}
					}
					
					// Nettoyer et formater
					const activiteClean = activite.trim();
					const dureeClean = duree.trim().replace(/minutes?/i, 'min');
					const jourComplet = moment.trim() ? `${jour.trim()} ${moment.trim()}` : jour.trim();
					
					parsedPlan.push({
						jour: jourComplet,
						activite: activiteClean,
						duree: dureeClean,
						intensite: intensite,
						observations: observations.trim() || 'Selon recommandations'
					});
				} else {
					// Fallback: chercher juste le jour et essayer d'extraire des infos
					const jourMatch = line.match(/(Lundi|Mardi|Mercredi|Jeudi|Vendredi|Samedi|Dimanche)/i);
					if (jourMatch) {
						const jour = jourMatch[0];
						const activiteMatch = line.match(/(marche|vélo|natation|gym|sport|activité|repos|étirement|jardinage)/gi);
						const dureeMatch = line.match(/(\d+)\s*(min|h|heure)/gi);
						
						parsedPlan.push({
							jour: jour,
							activite: activiteMatch ? activiteMatch[0] : 'Activité adaptée',
							duree: dureeMatch ? dureeMatch[0] : '30 min',
							intensite: 'Modérée',
							observations: 'Selon recommandations'
						});
					}
				}
			}
			
			console.log('🔍 Parsed plan:', parsedPlan);
			
			// Si le parsing a donné des résultats, les utiliser, sinon utiliser le plan par défaut
			const finalPlan = parsedPlan.length > 0 ? parsedPlan : defaultWeekPlan;
			
			return finalPlan.map(row => `
				<tr>
					<td style="border: 1px solid #dee2e6; padding: 6px; font-size: 10px; vertical-align: top;">${row.jour}</td>
					<td style="border: 1px solid #dee2e6; padding: 6px; font-size: 10px; vertical-align: top;">${row.activite}</td>
					<td style="border: 1px solid #dee2e6; padding: 6px; font-size: 10px; vertical-align: top;">${row.duree}</td>
					<td style="border: 1px solid #dee2e6; padding: 6px; font-size: 10px; vertical-align: top;">${row.intensite}</td>
					<td style="border: 1px solid #dee2e6; padding: 6px; font-size: 10px; vertical-align: top;">${row.observations}</td>
				</tr>
			`).join('');
			
		} catch (error) {
			console.error('❌ Error parsing planification:', error);
			// En cas d'erreur, utiliser le plan par défaut
			return defaultWeekPlan.map(row => `
				<tr>
					<td style="border: 1px solid #dee2e6; padding: 6px; font-size: 10px; vertical-align: top;">${row.jour}</td>
					<td style="border: 1px solid #dee2e6; padding: 6px; font-size: 10px; vertical-align: top;">${row.activite}</td>
					<td style="border: 1px solid #dee2e6; padding: 6px; font-size: 10px; vertical-align: top;">${row.duree}</td>
					<td style="border: 1px solid #dee2e6; padding: 6px; font-size: 10px; vertical-align: top;">${row.intensite}</td>
					<td style="border: 1px solid #dee2e6; padding: 6px; font-size: 10px; vertical-align: top;">${row.observations}</td>
				</tr>
			`).join('');
		}
	}

	function generateConseilsContent() {
		if (!aiResponse) {
			return `
				<div style="text-align: center; margin: 2rem 0;">
					<p style="color: #666; font-style: italic;">En attente des recommandations IA...</p>
					<p style="color: #666; font-size: 14px;">Veuillez d'abord soumettre le questionnaire pour générer les conseils personnalisés.</p>
				</div>
			`;
		}

		const date = new Date().toLocaleDateString('fr-FR');
		
		return `
			<!-- En-tête -->
			<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
				<div style="border: 2px solid #000; padding: 15px; width: 45%; font-size: 11px; line-height: 1.4;">
					<strong>${doctorInfo.name}</strong><br/>
					Spécialité : ${doctorInfo.specialty}<br/>
					RPPS : ${doctorInfo.rpps}<br/>
					Adresse : ${doctorInfo.address}<br/>
					Téléphone : ${doctorInfo.phone}<br/>
					Mail : ${doctorInfo.email}
				</div>
				<div style="border: 2px solid #000; padding: 15px; width: 45%; font-size: 11px; line-height: 1.4;">
					<strong>${patientInfo.name}</strong><br/><br/>
					Date de naissance ${patientInfo.birthDate}
				</div>
			</div>
			<div style="text-align: right; margin-bottom: 20px; font-size: 12px;">
				Le ${date}
			</div>
			
			<!-- Page 2 - Conseils complets -->
			<div style="page-break-before: always;">
				${aiResponse.conseils_pages ? `
					<div style="font-size: 11px; line-height: 1.4; white-space: pre-line;">
						${aiResponse.conseils_pages.replace(/\n/g, '<br/>')}
					</div>
				` : `
					<!-- Fallback: conseils modulaires si conseils_pages n'est pas disponible -->
					${aiResponse.conseils && aiResponse.conseils.length > 0 ? `
						<div style="margin-bottom: 1rem;">
							<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">✅ Conseils pratiques</p>
							<ul style="list-style-type: none; padding-left: 1rem; font-size: 11px; line-height: 1.4;">
								${aiResponse.conseils.map(conseil => `<li>- ${conseil.replace(/^[^\w]*/, '')}</li>`).join('')}
							</ul>
						</div>
					` : ''}

					${aiResponse.benefices && aiResponse.benefices.length > 0 ? `
						<div style="margin-bottom: 1rem;">
							<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">💚 Bénéfices attendus</p>
							<ul style="list-style-type: none; padding-left: 1rem; font-size: 11px; line-height: 1.4;">
								${aiResponse.benefices.map(benefice => `<li>- ${benefice}</li>`).join('')}
							</ul>
						</div>
					` : ''}

					${aiResponse.planification ? `
						<div style="margin-bottom: 1rem;">
							<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">📅 Exemple de planification de l'activité physique adaptée</p>
							<table style="width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 10px;">
								<thead>
									<tr style="background-color: #f8f9fa;">
										<th style="border: 1px solid #dee2e6; padding: 8px; text-align: left; font-weight: bold; font-size: 10px;">Jour</th>
										<th style="border: 1px solid #dee2e6; padding: 8px; text-align: left; font-weight: bold; font-size: 10px;">Type d'activité</th>
										<th style="border: 1px solid #dee2e6; padding: 8px; text-align: left; font-weight: bold; font-size: 10px;">Durée</th>
										<th style="border: 1px solid #dee2e6; padding: 8px; text-align: left; font-weight: bold; font-size: 10px;">Intensité</th>
										<th style="border: 1px solid #dee2e6; padding: 8px; text-align: left; font-weight: bold; font-size: 10px;">Observations</th>
									</tr>
								</thead>
								<tbody>
									${formatPlanificationTable(aiResponse.planification)}
								</tbody>
							</table>
						</div>
					` : ''}

					${aiResponse.orientation && aiResponse.orientation.length > 0 ? `
						<div style="margin-bottom: 1rem;">
							<p style="font-weight: 700; text-decoration: underline; margin-bottom: 0.5rem; font-size: 12px;">🧭 Proposition d'orientation</p>
							<ul style="list-style-type: none; padding-left: 1rem; font-size: 11px; line-height: 1.4;">
								${aiResponse.orientation.map(orient => `<li>- ${orient}</li>`).join('')}
							</ul>
						</div>
					` : ''}

					${aiResponse.sources && aiResponse.sources.length > 0 ? `
						<div style="margin-bottom: 1rem;">
							<p style="font-weight: 700; margin-bottom: 0.5rem; font-size: 12px;">Sources :</p>
							<div style="font-size: 11px; line-height: 1.4; padding-left: 1rem;">
								${aiResponse.sources.map(source => `- ${source}`).join('<br/>')}
							</div>
						</div>
					` : ''}

					<div style="margin-top: 1.5rem; font-style: italic; font-size: 11px; text-align: center;">
						*Nos conseils ne remplacent pas une consultation médicale*
					</div>
				`}
			</div>
		`;
	}

	onMount(async () => {
		// Récupérer les infos du médecin connecté
		const authUser = (await supabase.auth.getUser()).data.user;
		if (authUser) {
			const { data } = await supabase
				.from('users')
				.select('*')
				.eq('email', authUser.email)
				.single();
			if (data) {
				doctorInfo.name = `Dr. ${data.first_name} ${data.last_name}`;
				if (data.rpps) doctorInfo.rpps = data.rpps;
				if (data.address) doctorInfo.address = data.address;
				if (data.phone) doctorInfo.phone = data.phone;
				if (data.email) doctorInfo.email = data.email;
			}
		}
		
		// Récupérer les infos du patient
		if (submission?.patient_info) {
			const p = submission.patient_info;
			if (p.firstName || p.lastName) {
				patientInfo.name = `${p.gender === 'male' ? 'M' : 'Mme'} ${p.lastName || ''}, ${p.firstName || ''}`;
			}
			if (p.birthDate) {
				patientInfo.birthDate = new Date(p.birthDate).toLocaleDateString('fr-FR');
			}
		}
		
		content = generateConseilsContent();
	});

	// Mettre à jour le contenu quand aiResponse change
	$effect(() => {
		content = generateConseilsContent();
	});

	function handlePrint() {
		window.print();
	}
</script>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');

	.conseils-container {
		background: white;
		border-radius: 1rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
		padding: 2rem;
		margin-bottom: 2rem;
	}

	.conseils-header {
		text-align: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid #e5e7eb;
	}

	.conseils-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: #003087;
		margin-bottom: 0.5rem;
	}

	/* Print Styles */
	@media print {
		.conseils-container {
			box-shadow: none !important;
			border-radius: 0 !important;
		}

		:global(.tox-tinymce),
		:global(.tox-editor-header) {
			display: none !important;
		}

		:global(.mce-content-body) {
			padding: 0 !important;
		}
	}
</style>

<div class="conseils-container">
	<div class="conseils-header">
		<h2 class="conseils-title">Conseils d'Activité Physique Adaptée</h2>
		<p style="color: #6b7280;">Patient : {patientInfo.name} • Date : {new Date().toLocaleDateString('fr-FR')}</p>
	</div>

	<TinyMCEEditor
		bind:this={editorRef}
		bind:content={content}
		minHeight={800}
		placeholder="Conseils en cours de génération..."
	/>
</div>