import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { User } from '$lib/supabase';

function createAuthStore() {
	const { subscribe, set, update } = writable<{
		user: User | null;
		loading: boolean;
		error: string | null;
	}>({
		user: null,
		loading: false,
		error: null
	});

	return {
		subscribe,
		async signUp(email: string, password: string, firstName?: string, lastName?: string) {
			update((state) => ({ ...state, loading: true, error: null }));
			
			try {
				// D'abord créer le compte Supabase Auth avec désactivation de la confirmation d'email
				const { data: authData, error: authError } = await supabase.auth.signUp({
					email,
					password,
					options: {
						emailRedirectTo: undefined // Pas de redirection d'email
					}
				});

				console.log('🔍 SignUp authData:', authData);
				console.log('🔍 SignUp authError:', authError);

				if (authError) {
					// Si l'erreur dit que l'utilisateur existe déjà dans auth, proposer la connexion
					if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
						throw new Error('Un compte avec cet email existe déjà. Veuillez vous connecter.');
					}
					throw authError;
				}

				if (authData.user) {
					console.log('🔍 authData.user:', authData.user);
					console.log('🔍 authData.user.id:', authData.user.id);
					// Tenter de créer l'utilisateur dans notre table
					const insertData = {
						auth_user_id: authData.user.id,
						email,
						first_name: firstName,
						last_name: lastName,
						role: 'doctor'
					};
					console.log('🔍 Data to insert in users table:', insertData);

					const { data: userData, error: userError } = await supabase
						.from('users')
						.insert(insertData)
						.select()
						.single();

					console.log('🔍 Insert result userData:', userData);
					console.log('🔍 Insert result userError:', userError);

					if (userError) {
						// Si l'utilisateur existe déjà dans notre table, le récupérer et mettre à jour l'auth_user_id
						if (userError.code === '23505') {
							console.log('🔍 User already exists in DB, fetching and updating with auth_user_id...');
							
							// D'abord récupérer l'utilisateur existant
							const { data: existingUser, error: fetchError } = await supabase
								.from('users')
								.select('*')
								.eq('email', email)
								.single();
							
							console.log('🔍 Existing user found:', existingUser);
							console.log('🔍 Fetch error:', fetchError);
							
							if (fetchError) throw fetchError;
							if (!existingUser) throw new Error('Erreur lors de la récupération du compte existant');
							
							// Mettre à jour avec l'auth_user_id si pas déjà défini
							if (!existingUser.auth_user_id) {
								console.log('🔍 Updating existing user with auth_user_id...');
								const { data: updatedUser, error: updateError } = await supabase
									.from('users')
									.update({ 
										auth_user_id: authData.user.id,
										first_name: firstName || existingUser.first_name,
										last_name: lastName || existingUser.last_name
									})
									.eq('id', existingUser.id)
									.select()
									.single();
								
								console.log('🔍 Updated user:', updatedUser);
								console.log('🔍 Update error:', updateError);
								
								if (updateError) throw updateError;
								if (!updatedUser) throw new Error('Erreur lors de la mise à jour du compte');
								
								set({ user: updatedUser, loading: false, error: null });
								return updatedUser;
							}
							
							set({ user: existingUser, loading: false, error: null });
							return existingUser;
						} else {
							throw userError;
						}
					}
					
					console.log('🔍 Successfully created user in DB:', userData);
					set({ user: userData, loading: false, error: null });
					return userData;
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'inscription';
				update((state) => ({ ...state, loading: false, error: errorMessage }));
				throw error;
			}
		},

		async signIn(email: string, password: string) {
			update((state) => ({ ...state, loading: true, error: null }));
			
			try {
				const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
					email,
					password
				});

				console.log('🔍 SignIn authData:', authData);
				console.log('🔍 SignIn authError:', authError);

				if (authError) throw authError;

				if (authData.user) {
					console.log('🔍 SignIn authData.user.id:', authData.user.id);
					
					const { data: userData, error: userError } = await supabase
						.from('users')
						.select('*')
						.eq('auth_user_id', authData.user.id)
						.single();

					console.log('🔍 SignIn userData found:', userData);
					console.log('🔍 SignIn userError:', userError);

					if (userError) throw userError;
					
					set({ user: userData, loading: false, error: null });
					return userData;
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Login failed';
				update((state) => ({ ...state, loading: false, error: errorMessage }));
				throw error;
			}
		},

		async signOut() {
			update((state) => ({ ...state, loading: true }));
			
			try {
				const { error } = await supabase.auth.signOut();
				if (error) throw error;
				
				set({ user: null, loading: false, error: null });
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Logout failed';
				update((state) => ({ ...state, loading: false, error: errorMessage }));
				throw error;
			}
		},

		async checkUser() {
			update((state) => ({ ...state, loading: true }));
			
			try {
				const { data: { user: authUser } } = await supabase.auth.getUser();
				
				console.log('🔍 CheckUser authUser:', authUser);
				
				if (authUser) {
					console.log('🔍 CheckUser authUser.id:', authUser.id);
					
					const { data: userData, error: userError } = await supabase
						.from('users')
						.select('*')
						.eq('auth_user_id', authUser.id)
						.single();

					console.log('🔍 CheckUser userData found:', userData);
					console.log('🔍 CheckUser userError:', userError);

					if (userError) throw userError;
					
					set({ user: userData, loading: false, error: null });
					return userData;
				} else {
					set({ user: null, loading: false, error: null });
					return null;
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Failed to check user';
				set({ user: null, loading: false, error: errorMessage });
				return null;
			}
		}
	};
}

export const auth = createAuthStore();