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
				const { data: authData, error: authError } = await supabase.auth.signUp({
					email,
					password
				});

				if (authError) throw authError;

				if (authData.user) {
					const { data: userData, error: userError } = await supabase
						.from('users')
						.insert({
							email,
							first_name: firstName,
							last_name: lastName,
							role: 'doctor'
						})
						.select()
						.single();

					if (userError) throw userError;
					
					set({ user: userData, loading: false, error: null });
					return userData;
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Signup failed';
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

				if (authError) throw authError;

				if (authData.user) {
					const { data: userData, error: userError } = await supabase
						.from('users')
						.select('*')
						.eq('email', email)
						.single();

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
				
				if (authUser) {
					const { data: userData, error: userError } = await supabase
						.from('users')
						.select('*')
						.eq('email', authUser.email)
						.single();

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