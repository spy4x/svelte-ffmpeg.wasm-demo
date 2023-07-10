import { prisma } from '@server';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * API Endpoint handler for  "PATCH /api/movies/:id/merge-result { id: string, path: string, url: string }"
 * Checks if user is the owner of the movie and returns signed URLs for uploading files
 * returns JSON { clips: {id: string, path: string, url: string }[] }
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
  const movieId = params.id || '';
  const body: { id: string; path: string; url: string } = await request.json();
  console.log({ movieId, body: body });
  const movie = await prisma.movie.findFirst({
    where: { id: movieId },
  });
  if (!movie) {
    return json({ message: 'Movie not found' }, { status: 404 });
  }
  // Save movie file path and URL
  await prisma.movie.update({
    where: { id: movieId },
    data: {
      videoPath: body.path,
      videoURL: body.url,
    },
  });
  return json({ message: 'OK' });
};

const x = [
  {
    id: '1vz0hkcm',
    url: 'https://spy4x-sst-monorepo-api-clipsbucketb8cee61f-1onifhn4uy8dy.s3.amazonaws.com/users/tbOK77U24r6qUcp/movies/zoecwNzNg3R19O1/clip_1vz0hkcm_s7lfr7kc',
    path: 'users/tbOK77U24r6qUcp/movies/zoecwNzNg3R19O1/clip_1vz0hkcm_s7lfr7kc',
    actor: null,
    mimeType: 'video/webm',
    description: '',
    durationSec: 1,
  },
  {
    id: 'aw1ptxo9',
    url: 'https://spy4x-sst-monorepo-api-clipsbucketb8cee61f-1onifhn4uy8dy.s3.amazonaws.com/users/tbOK77U24r6qUcp/movies/zoecwNzNg3R19O1/clip_aw1ptxo9_sivhspdr',
    path: 'users/tbOK77U24r6qUcp/movies/zoecwNzNg3R19O1/clip_aw1ptxo9_sivhspdr',
    actor: null,
    mimeType: 'video/webm',
    description: '',
    durationSec: 1,
  },
];
