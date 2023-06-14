import { ScenarioAccess, type Prisma, type Scenario } from '@prisma/client';
import { prisma } from '@server';
import type { ResponseList } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const page = Number(url.searchParams.get('page')) || 1;
	const perPage = Number(url.searchParams.get('perPage')) || 10;
	const where: Prisma.ScenarioWhereInput = {
		access: ScenarioAccess.SHARED
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
