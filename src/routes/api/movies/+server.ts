import type { Prisma, Movie } from '@prisma/client';
import { prisma } from '@server';
import type { MovieVM, ResponseList } from '@shared';
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
	const data = await request.json();
	// const payload = await request.json();
	// TODO: Validation
	// const parseResult = MovieCreateSchema.safeParse(payload);
	// if (!parseResult.success) {
	// 	return json(
	// 		{ ...parseResult.error.format(), message: 'Please check correctness of fields' },
	// 		{ status: 400 }
	// 	);
	// }
	try {
		const movie = await prisma.movie.create({
			data: {
				...data,
				userId: locals.user.userId
			}
		});
		return json(movie);
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
