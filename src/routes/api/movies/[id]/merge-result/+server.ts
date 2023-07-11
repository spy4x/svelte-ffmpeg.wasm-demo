import { VideoMergeStatus, type Movie } from '@prisma/client';
import { prisma } from '@server';
import { json, type RequestHandler } from '@sveltejs/kit';

type MergeResult = {
  id: string;
  path: string;
} & (
  | {
      url: string;
      error: null;
    }
  | {
      url: null;
      error: string;
    }
);

/**
 * API Endpoint handler for  "PATCH /api/movies/:id/merge-result { id: string, path: string, url: string }"
 * Checks if user is the owner of the movie and returns signed URLs for uploading files
 * returns JSON { clips: {id: string, path: string, url: string }[] }
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
  const movieId = params.id || '';
  const result: MergeResult = await request.json();
  console.log({ movieId, body: result });
  const movie = await prisma.movie.findFirst({
    where: { id: movieId },
  });
  if (!movie) {
    return json({ message: 'Movie not found' }, { status: 404 });
  }

  // Save movie file path and URL

  const update: Partial<Movie> = {
    videoMergeTookSeconds: movie.videoMergeStartedAt
      ? Math.round((new Date().getTime() - movie.videoMergeStartedAt.getTime()) / 1000)
      : 0,
  };

  if (result.error) {
    update.videoMergeStatus = VideoMergeStatus.FAILED;
  } else {
    update.videoPath = result.path;
    update.videoURL = result.url;
    update.videoMergeStatus = VideoMergeStatus.DONE;
  }

  await prisma.movie.update({
    where: { id: movieId },
    data: update,
  });
  return json({ message: 'OK' });
};
