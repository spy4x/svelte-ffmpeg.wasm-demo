import { Role, type Prisma, type Scenario, ScenarioAccess } from '@prisma/client';
import { prisma } from '@server';
import { ScenarioSchema, type ResponseList, handleValidationError } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const page = Number(url.searchParams.get('page')) || 1;
	const perPage = Number(url.searchParams.get('perPage')) || 10;
	const where: Prisma.ScenarioWhereInput = {
		userId: locals.user.userId
	};
	const [data, total] = await prisma.$transaction([
		prisma.scenario.findMany({
			where,
			orderBy: {
				updatedAt: 'desc'
			},
			skip: (page - 1) * perPage,
			take: perPage
		}),
		prisma.scenario.count({ where })
	]);
	const result: ResponseList<Scenario> = { data, total, page, perPage };
	return json(result);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const payload = await request.json();
	const parseResult = ScenarioSchema.safeParse(payload);
	if (!parseResult.success) {
		return json(handleValidationError(parseResult.error), { status: 400 });
	}
	try {
		const scenario = await prisma.scenario.create({
			data: {
				...parseResult.data,
				userId: locals.user.userId,
				access: locals.user.role === Role.ADMIN ? parseResult.data.access : ScenarioAccess.PRIVATE
			}
		});
		return json(scenario);
	} catch (error: unknown) {
		console.error(error);
		return json({ message: 'Server Error' }, { status: 500 });
	}
};
