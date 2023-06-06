import { createClient } from '@supabase/supabase-js';
import { SUPABASE_PROJECT_URL, SUPABASE_SECRET } from '$env/static/private';

export const supabase = createClient(SUPABASE_PROJECT_URL, SUPABASE_SECRET);
