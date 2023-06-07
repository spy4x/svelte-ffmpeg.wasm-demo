import type { Movie } from '@prisma/client';
import { prisma, supabase } from '@server';
import { formDataToMovie } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';

type UploadResult =
	| { index: number; path: string; url: string; error: null }
	| { index: number; path: null; url: null; error: Error };

async function uploadMoviePart(
	userId: string,
	movieId: string,
	index: number,
	blob: Blob
): Promise<UploadResult> {
	const basePath = `users/${userId}/movies/${movieId}`;
	const path = index === -1 ? `${basePath}/movie` : `${basePath}/clips/${index}`;
	const { data: uploadData, error: uploadError } = await supabase.storage
		.from('media')
		.upload(path, blob, {
			contentType: 'video/webm',
			upsert: true
		});
	// console.log({ index, uploadData, uploadError });
	if (uploadError) {
		return { index, path: null, url: null, error: uploadError };
	}
	const { data: signedUrlData, error: signedUrlError } = await supabase.storage
		.from('media')
		.createSignedUrl(path, 3156000000); // 100 years
	// console.log({ index, signedUrlData, signedUrlError });
	if (signedUrlError) {
		return { index, path: null, url: null, error: signedUrlError };
	}
	const url = signedUrlData.signedUrl.replace('https://ckfyxawghaorwkjjgllm.supabase.co/storage/v1/object/sign/media/','https://video-recorder-five.vercel.app/api/media/')
	return { index, path, url, error: null };
}

export const PATCH: RequestHandler = async ({ locals, request, cookies }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const userId = locals.user.id;
	const formData = await request.formData();
	const movie = formDataToMovie(formData);

	// TODO: validation
	// const parseResult = MovieUpdateSchema.safeParse(payload);
	// if (!parseResult.success) {
	// 	return json(
	// 		{ ...parseResult.error.format(), message: 'Please check correctness of fields' },
	// 		{ status: 400 }
	// 	);
	// }
	// const movieUpdateCommand = parseResult.data;

	const promises: Promise<UploadResult>[] = [];

	if (movie.videoBlob) {
		promises.push(uploadMoviePart(userId, movie.id, -1, movie.videoBlob));
	}

	movie.clips.forEach(async (clip, index) => {
		if (!clip.blob) {
			return;
		}
		promises.push(uploadMoviePart(userId, movie.id, index, clip.blob));
	});

	const results = await Promise.all(promises);

	if (results.some((r) => r.error)) {
		results
			.filter((r) => r.error)
			.forEach((r) =>
				console.error({
					index: r.index,
					error: r.error
				})
			);
		// TODO: is there a better way to handle this situation?
		return json({ message: 'Server error' }, { status: 500 });
	}

	results.forEach((r) => {
		if (r.index === -1) {
			movie.videoURL = r.url;
		} else {
			movie.clips[r.index].url = r.url;
		}
	});

	try {
		const clipsWithoutBlob = movie.clips.map((clip) => {
			const { blob, ...rest } = clip;
			return rest;
		});
		const movieWithoutVideoBlob = {
			...movie,
			videoBlob: undefined
		};
		const update: Partial<Movie> = {
			...movieWithoutVideoBlob,
			clips: clipsWithoutBlob,
			userId: locals.user.userId
		};
		const updatedMovie = await prisma.movie.update({
			where: {
				id: movie.id
			},
			data: update
		});
		return json(updatedMovie);
	} catch (error: unknown) {
		// if (error instanceof Prisma.PrismaClientKnownRequestError) {
		// 	if (error.code === QueryError.UniqueConstraintViolation) {
		// 		return json(
		// 			{
		// 				message: 'The provided email is already in use.'
		// 			},
		// 			{ status: 401 }
		// 		);
		// 	}
		// }
		console.error(error);
		return json({ message: 'Server Error' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const { id } = params;
	if (!id) {
		return json({ message: 'No id provided' }, { status: 400 });
	}
	try {
		await prisma.movie.delete({
			where: {
				id
			}
		});
		return json({ message: 'deleted' });
	} catch (error: unknown) {
		// if (error instanceof Prisma.PrismaClientKnownRequestError) {
		// 	if (error.code === QueryError.UniqueConstraintViolation) {
		// 		return json(
		// 			{
		// 				message: 'The provided email is already in use.'
		// 			},
		// 			{ status: 401 }
		// 		);
		// 	}
		// }
		console.error(error);
		return json({ message: 'Server Error' }, { status: 500 });
	}
};
