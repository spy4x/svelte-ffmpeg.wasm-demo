import type { Movie } from '@prisma/client';
import { getFileUrlByPath, prisma, type GetFileURLByPathResult } from '@server';
import { MovieCommandSchema } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';

const MOVIE_FILE_ID = 'movie';

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const userId = locals.user.id;
	const payload = await request.json();

	const parseResult = MovieCommandSchema.safeParse(payload);
	if (!parseResult.success) {
		return json(
			{ ...parseResult.error.format(), message: 'Please check correctness of fields' },
			{ status: 400 }
		);
	}
	const movie = parseResult.data;

	const movieInDB = await prisma.movie.findFirst({
		where: { id: movie.id, userId }
	});
	if (!movieInDB) {
		return json({ message: 'Movie not found' }, { status: 404 });
	}

	const promises: Promise<GetFileURLByPathResult>[] = [];

	if (movie.videoPath) {
		promises.push(getFileUrlByPath(movie.videoPath, MOVIE_FILE_ID));
	}

	movie.clips.forEach(async (clip) => {
		if (!clip.path) {
			return;
		}
		promises.push(getFileUrlByPath(clip.path, clip.id));
	});

	const results = await Promise.all(promises);

	if (results.some((r) => r.error)) {
		results
			.filter((r) => r.error)
			.forEach((r) =>
				console.error({
					fileId: r.fileId,
					path: r.path,
					error: r.error
				})
			);
		// TODO: is there a better way to handle this situation?
		return json({ message: 'Server error - Files upload' }, { status: 500 });
	}

	results.forEach((r) => {
		if (r.fileId === MOVIE_FILE_ID) {
			movie.videoURL = r.url;
		} else {
			movie.clips.find((c) => c.id === r.fileId)!.url = r.url;
		}
	});

	try {
		const clipsWithoutPath = movie.clips.map((clip) => {
			const { path, ...rest } = clip;
			return rest;
		});
		const movieWithoutVideoPath = {
			...movie,
			videoPath: undefined,
			videoFile: undefined
		};
		const update: Partial<Movie> = {
			...movieWithoutVideoPath,
			clips: clipsWithoutPath,
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
		await prisma.movie.deleteMany({
			where: {
				id,
				userId: locals.user.id
			}
		});
		return json({ message: 'deleted' });
	} catch (error: unknown) {
		console.error(error);
		return json({ message: 'Server Error' }, { status: 500 });
	}
};
