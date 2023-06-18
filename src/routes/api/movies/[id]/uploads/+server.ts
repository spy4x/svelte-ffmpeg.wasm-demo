import { getSignedUrlForFileUpload, prisma } from '@server';
import { getRandomString } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * API Endpoint handler for  "GET /api/movies/:id/uploads { video: true, clips: ['id3', 'id5'] }"
 * Checks if user is the owner of the movie and returns signed URLs for uploading files
 * returns JSON { video?: {path: string, token: string}, clips: [{id: string, path: string, token: string] }
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const userId = locals.user.userId;
	const movieId = url.pathname.split('/')[3];
	const movie = await prisma.movie.findFirst({
		where: { id: movieId, userId }
	});
	if (!movie) {
		return json({ message: 'Movie not found' }, { status: 404 });
	}
	const isVideo = url.searchParams.get('video') === 'true';
	const clipIds =
		url.searchParams
			.get('clips')
			?.split(',')
			.filter((id) => !!id) || [];
	const [video, ...clips] = await Promise.all([
		isVideo
			? getSignedUrlForFileUpload(`users/${userId}/movies/${movieId}/video_${getRandomString()}`)
			: undefined,
		...clipIds.map((id) =>
			getSignedUrlForFileUpload(`users/${userId}/movies/${movieId}/clip_${id}_${getRandomString()}`)
		)
	]);
	if (video?.error) {
		console.error(video.error);
		return json({ message: 'Error getting signed URL for video' }, { status: 500 });
	}
	if (clips.some((clip) => clip.error)) {
		console.error(
			clips.reduce((acc, cur) => {
				if (cur.error) acc.push(cur.error);
				return acc;
			}, [] as Error[])
		);
		return json({ message: 'Error getting signed URL for clips' }, { status: 500 });
	}
	const result = {
		video: video ? video.data : undefined,
		clips: clipIds.map((id, index) => ({
			id,
			...clips[index].data
		}))
	};
	return json(result);
};
