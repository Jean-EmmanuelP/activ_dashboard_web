import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

export type User = {
	id: number;
	auth_user_id?: string;
	email: string;
	role: string;
	first_name?: string;
	last_name?: string;
	signature?: string;
	signatures?: string;
	created_at?: string;
	updated_at?: string;
};

export type Submission = {
	id: string;
	secure_key: string;
	patient_info?: any;
	status: string;
	submitted_by_user_id?: number;
	submission_count: number;
	locked_by_user_id?: number;
	created_at?: string;
	updated_at?: string;
};

export type Answer = {
	id: number;
	submission_id: string;
	question_id: number;
	value: string;
	additional_notes?: string;
	created_at?: string;
	updated_at?: string;
};

export type Question = {
	id: number;
	section_id?: number;
	parent_id?: number;
	text: string;
	type: string;
	options?: any;
	condition?: any;
	order_index: number;
	is_required: boolean;
	notes?: string;
	range?: any;
	created_at?: string;
	updated_at?: string;
	children?: Question[];
};

export type Section = {
	id: number;
	name: string;
	description?: string;
	order_index: number;
	created_at?: string;
	updated_at?: string;
};