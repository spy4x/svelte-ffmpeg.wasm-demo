import { ONE_YEAR_AS_SECONDS } from '@shared';
import { supabase } from './supabase';

export type UploadFileResult = {
	error: null | Error;
};

export async function uploadFile(
	path: string,
	token: string,
	file: File | Blob
): Promise<UploadFileResult> {
	const { error } = await supabase.storage.from('media').uploadToSignedUrl(path, token, file, {
		upsert: true,
		cacheControl: `${ONE_YEAR_AS_SECONDS}`
	});
	return { error };
}
