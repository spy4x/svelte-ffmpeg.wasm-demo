import { prisma } from '@server';
import { json, type RequestHandler } from '@sveltejs/kit';

import { MERGE_API_URL } from '$env/static/private';
import { getRandomString, MovieSchema } from '@shared';

/**
 * API Endpoint handler for  "GET /api/movies/:id/uploads { clips: ['id3', 'id5'] }"
 * Checks if user is the owner of the movie and returns signed URLs for uploading files
 * returns JSON { clips: {id: string, path: string, url: string }[] }
 */
export const PATCH: RequestHandler = async ({ locals, url, params }) => {
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
  const clipsPaths = MovieSchema.parse(movie).clips.map(clip => clip.path);

  const requestPayload = {
    id: movieId,
    clipsPaths,
    resultPath: `users/${userId}/movies/${movieId}/result_${getRandomString()}.mp4`,
  };
  const method = 'POST';
  const requestURL = `${MERGE_API_URL}/merge`;
  console.log(`${method} ${requestURL}\n${JSON.stringify(requestPayload, null, 4)}`);
  const response = await fetch(requestURL, {
    method,
    body: JSON.stringify(requestPayload),
  });
  if (!response.ok) {
    console.error(response.status, await response.text());
    return json({ message: 'Error triggering backend-side movie merging' }, { status: 500 });
  }
  const result: { message: string }[] = await response.json();
  console.log({ result });
  return json(result);
};
