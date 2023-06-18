import { getFileUrlByPath, prisma, type GetFileURLByPathResult } from '@server';
import { ScenarioCommandSchema, ScenarioSchema } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';

const PREVIEW_FILE_ID = 'preview';

export const PATCH: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const userId = locals.user.id;
	const payload = await request.json();
	const parseResult = ScenarioCommandSchema.safeParse(payload);
	if (!parseResult.success) {
		return json(
			{ ...parseResult.error.format(), message: 'Please check correctness of fields' },
			{ status: 400 }
		);
	}
	const scenario = parseResult.data;
	const scenarioInDB = await prisma.scenario.findFirst({
		where: { id: scenario.id, userId }
	});
	if (!scenarioInDB) {
		return json({ message: 'Scenario not found' }, { status: 404 });
	}
	try {
		const promises: Promise<GetFileURLByPathResult>[] = [];

		if (scenario.previewPath) {
			promises.push(getFileUrlByPath(scenario.previewPath, PREVIEW_FILE_ID));
		}

		scenario.attachments.forEach(async (attachment) => {
			if (!attachment.path) {
				return;
			}
			promises.push(getFileUrlByPath(attachment.path, attachment.id));
		});

		const results = await Promise.all(promises);

		if (results.some((r) => r.error)) {
			results
				.filter((r) => r.error)
				.forEach((r) =>
					console.error({
						fileId: r.fileId,
						path: r.path,
						error: r.error
					})
				);
			// TODO: is there a better way to handle this situation?
			return json({ message: 'Server error - Files upload' }, { status: 500 });
		}

		results.forEach((r) => {
			if (r.fileId === PREVIEW_FILE_ID) {
				scenario.previewURL = r.url;
			} else {
				const attachment = scenario.attachments.find((a) => a.id === r.fileId);
				if (attachment) {
					attachment.url = r.url;
				}
			}
		});

		const update = { ...ScenarioSchema.parse(scenario), userId: locals.user.userId };

		const updatedScenario = await prisma.scenario.update({
			where: {
				id: parseResult.data.id
			},
			data: update
		});
		return json(updatedScenario);
	} catch (error: unknown) {
		console.error(error);
		return json({ message: 'Server Error - Save to DB' }, { status: 500 });
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
		await prisma.scenario.deleteMany({
			where: {
				id,
				userId: locals.user.userId
			}
		});
		return json({ message: 'deleted' });
	} catch (error: unknown) {
		console.error(error);
		return json({ message: 'Server Error' }, { status: 500 });
	}
};
