import { APP_URL, SUPABASE_PROJECT_URL } from '$env/static/private';
import type { Scenario } from '@prisma/client';
import { prisma, supabase } from '@server';
import { formDataToScenario, ScenarioUpdateSchema } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';

type UploadResult =
	| { fileId: string; path: string; url: string; error: null }
	| { fileId: string; path: null; url: null; error: Error };

async function uploadScenarioPart(
	userId: string,
	scenarioId: string,
	fileId: string,
	file: File
): Promise<UploadResult> {
	const path = `users/${userId}/scenarios/${scenarioId}/${fileId}`;
	const { data: uploadData, error: uploadError } = await supabase.storage
		.from('media')
		.upload(path, file, {
			contentType: file.type,
			upsert: true
		});
	// console.log({ index, uploadData, uploadError });
	if (uploadError) {
		return { fileId, path: null, url: null, error: uploadError };
	}
	const { data: signedUrlData, error: signedUrlError } = await supabase.storage
		.from('media')
		.createSignedUrl(path, 3156000000); // 100 years
	// console.log({ index, signedUrlData, signedUrlError });
	if (signedUrlError) {
		return { fileId, path: null, url: null, error: signedUrlError };
	}
	const url = signedUrlData.signedUrl.replace(
		SUPABASE_PROJECT_URL + '/storage/v1/object/sign/media/',
		APP_URL + '/api/media/'
	);
	return { fileId, path, url, error: null };
}

const PREVIEW_FILE_ID = 'preview';

export const PATCH: RequestHandler = async ({ locals, request, cookies }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const userId = locals.user.id;
	const payload = await request.formData();
	const formDataScenario = formDataToScenario(payload);
	const parseResult = ScenarioUpdateSchema.safeParse(formDataScenario);
	if (!parseResult.success) {
		return json(
			{ ...parseResult.error.format(), message: 'Please check correctness of fields' },
			{ status: 400 }
		);
	}
	const scenario = parseResult.data;
	try {
		const promises: Promise<UploadResult>[] = [];

		if (scenario.previewFile) {
			promises.push(uploadScenarioPart(userId, scenario.id, PREVIEW_FILE_ID, scenario.previewFile));
		}

		scenario.attachments.forEach(async (attachment, index) => {
			if (!attachment.file) {
				return;
			}
			promises.push(uploadScenarioPart(userId, scenario.id, attachment.id, attachment.file));
		});

		const results = await Promise.all(promises);

		if (results.some((r) => r.error)) {
			results
				.filter((r) => r.error)
				.forEach((r) =>
					console.error({
						fileId: r.fileId,
						error: r.error
					})
				);
			// TODO: is there a better way to handle this situation?
			return json({ message: 'Server error' }, { status: 500 });
		}

		results.forEach((r) => {
			if (r.fileId === PREVIEW_FILE_ID) {
				scenario.previewURL = r.url;
			} else {
				scenario.attachments.find((a) => a.id === r.fileId)!.url = r.url;
			}
		});

		const attachmentsWithoutFiles = scenario.attachments.map((attachment) => {
			const { file, ...rest } = attachment;
			return rest;
		});
		const scenarioWithoutPreviewFile = {
			...scenario,
			previewFile: undefined
		};
		const update: Partial<Scenario> = {
			...scenarioWithoutPreviewFile,
			attachments: attachmentsWithoutFiles,
			userId: locals.user.userId
		};

		const updatedScenario = await prisma.scenario.update({
			where: {
				id: parseResult.data.id
			},
			data: update
		});
		return json(updatedScenario);
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
		return json({ message: 'deleted' });
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
