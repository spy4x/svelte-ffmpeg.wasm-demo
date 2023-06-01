import { prisma } from '@server';
import { ScenarioUpdateSchema } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';

export const PATCH: RequestHandler = async ({ locals, request, cookies }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const payload = await request.json();
	const parseResult = ScenarioUpdateSchema.safeParse(payload);
	if (!parseResult.success) {
		return json(
			{ ...parseResult.error.format(), message: 'Please check correctness of fields' },
			{ status: 400 }
		);
	}
	try {
		const scenario = await prisma.scenario.update({
			where: {
				id: parseResult.data.id
			},
			data: {
				...parseResult.data,
				userId: locals.user.userId
			}
		});
		return json(scenario);
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

export const DELETE: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const { id } = params;
	if (!id) {
		return json({ message: 'No id provided' }, { status: 400 });
	}
	try {
		await prisma.scenario.delete({
			where: {
				id
			}
		});
		return json({ message: 'deleted' }, { status: 204 });
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
