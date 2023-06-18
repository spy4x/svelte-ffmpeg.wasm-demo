import type { Movie, Prisma } from '@prisma/client';
import { prisma } from '@server';
import { MovieSchema, type ResponseList } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const page = Number(url.searchParams.get('page')) || 1;
	const perPage = Number(url.searchParams.get('perPage')) || 10;
	const where: Prisma.MovieWhereInput = {
		userId: locals.user.userId
	};
	const [data, total] = await prisma.$transaction([
		prisma.movie.findMany({
			where,
			orderBy: {
				updatedAt: 'desc'
			},
			skip: (page - 1) * perPage,
			take: perPage
		}),
		prisma.movie.count({ where })
	]);
	const result: ResponseList<Movie> = { data, total, page, perPage };
	return json(result);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const payload = await request.json();
	const parseResult = MovieSchema.safeParse(payload);
	if (!parseResult.success) {
		return json(
			{ ...parseResult.error.format(), message: 'Please check correctness of fields' },
			{ status: 400 }
		);
	}
	const payloadData = parseResult.data;
	try {
		const movie = await prisma.movie.create({
			data: {
				...payloadData,
				userId: locals.user.userId
			}
		});
		return json(movie);
	} catch (error: unknown) {
		console.error(error);
		return json({ message: 'Server Error' }, { status: 500 });
	}
};
