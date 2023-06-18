import { HUNDRED_YEARS_AS_SECONDS } from '@shared';
import { supabase } from './supabase';
import { PUBLIC_SUPABASE_PROJECT_URL } from '$env/static/public';
import { APP_URL } from '$env/static/private';

export type GetSignedUrlForFileUploadResult =
	| { error: Error; data: null }
	| {
			error: null;
			data: {
				path: string;
				token: string;
			};
	  };

export async function getSignedUrlForFileUpload(
	path: string
): Promise<GetSignedUrlForFileUploadResult> {
	const { data, error } = await supabase.storage.from('media').createSignedUploadUrl(path);
	if (error) {
		return { data: null, error: error };
	}

	return {
		error: null,
		data: {
			path: data.path,
			token: data.token
		}
	};
}

export type GetSignedUrlForFileDownloadResult =
	| { error: Error; data: null }
	| {
			error: null;
			data: {
				url: string;
			};
	  };

export async function getSignedUrlForFileDownload(
	path: string
): Promise<GetSignedUrlForFileDownloadResult> {
	const { error, data } = await supabase.storage
		.from('media')
		.createSignedUrl(path, HUNDRED_YEARS_AS_SECONDS);
	if (error) {
		return { data: null, error: error };
	}
	return {
		error: null,
		data: {
			url: data.signedUrl
		}
	};
}

export function convertFileURLToProxyURL(url: string): string {
	return url.replace(
		PUBLIC_SUPABASE_PROJECT_URL + '/storage/v1/object/sign/media/',
		APP_URL + '/api/media/'
	);
}

export type GetFileURLByPathResult =
	| { fileId: string; path: string; url: null; error: Error }
	| { fileId: string; path: string; url: string; error: null };

export async function getFileUrlByPath(
	path: string,
	fileId: string
): Promise<GetFileURLByPathResult> {
	const { error, data } = await getSignedUrlForFileDownload(path);
	if (error) {
		console.error({ fileId, path, error });
		return { fileId, path, url: null, error };
	}
	const url = convertFileURLToProxyURL(data.url);
	return { fileId, path, url, error: null };
}
