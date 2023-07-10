import { prisma } from '@server';
import { json, type RequestHandler } from '@sveltejs/kit';

import { MERGE_API_URL } from '$env/static/private';
import { getRandomString, MovieSchema } from '@shared';

/**
 * API Endpoint handler for  "GET /api/movies/:id/uploads { clips: ['id3', 'id5'], extension: 'mp4' | 'webm' }"
 * Checks if user is the owner of the movie and returns signed URLs for uploading files
 * returns JSON { clips: {id: string, path: string, url: string }[] }
 */
export const GET: RequestHandler = async ({ locals, url, params }) => {
  if (!locals.user) {
    return json({ message: 'Not signed in' }, { status: 401 });
  }
  const userId = locals.user.userId;
  const movieId = params.id || '';
  const movie = await prisma.movie.findFirst({
    where: { id: movieId, userId },
  });
  if (!movie) {
    return json({ message: 'Movie not found' }, { status: 404 });
  }
  const clipIds =
    url.searchParams
      .get('clips')
      ?.split(',')
      .filter(id => !!id) || [];

  const extension = url.searchParams.get('extension') || 'webm';

  // get clips from movie as map
  const clips = MovieSchema.parse(movie).clips;

  const getClipById = (id: string) => clips.find(clip => clip.id === id);
  const getFileExtensionByClipId = (id: string) =>
    getClipById(id)?.mimeType?.split('/')[1] || extension;

  const files = clipIds.map(id => ({
    id,
    path: `users/${userId}/movies/${movieId}/clip_${id}_${getRandomString()}.${getFileExtensionByClipId(
      id,
    )}`,
  }));

  // TODO: replace with getSignedUrlForFileUpload
  const method = 'POST';
  const requestURL = `${MERGE_API_URL}/uploads`;
  console.log(`${method} ${requestURL}\n${JSON.stringify(files, null, 4)}`);
  const response = await fetch(requestURL, {
    method,
    body: JSON.stringify(files),
  });
  if (!response.ok) {
    console.error(`Status: `, response.status);
    return json({ message: 'Error getting signed URLs' }, { status: 500 });
  }
  const result: { id: string; path: string; url: string }[] = await response.json();
  console.log({ result });
  return json({ clips: result });
};
