import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SECRET } from '$env/static/private';
import { PUBLIC_SUPABASE_PROJECT_URL } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_PROJECT_URL, SUPABASE_SECRET, {
	auth: {
		persistSession: false
	}
});
