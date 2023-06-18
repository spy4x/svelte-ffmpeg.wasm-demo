import { getSignedUrlForFileUpload, prisma } from '@server';
import { getRandomString } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';

/**
 * API Endpoint handler for  "GET /api/scenarios/:id/uploads { preview: true, attachments: ['id3', 'id5'] }"
 * Checks if user is the owner of the scenario and returns signed URLs for uploading files
 * returns JSON { preview?: {path: string, token: string}, attachments: [{id: string, path: string, token: string] }
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ message: 'Not signed in' }, { status: 401 });
	}
	const userId = locals.user.userId;
	const scenarioId = url.pathname.split('/')[3];
	const scenario = await prisma.scenario.findFirst({
		where: { id: scenarioId, userId }
	});
	if (!scenario) {
		return json({ message: 'Scenario not found' }, { status: 404 });
	}
	const isPreview = url.searchParams.get('preview') === 'true';
	const attachmentIds =
		url.searchParams
			.get('attachments')
			?.split(',')
			.filter((id) => !!id) || [];
	const [preview, ...attachments] = await Promise.all([
		isPreview
			? getSignedUrlForFileUpload(
					`users/${userId}/scenarios/${scenarioId}/preview_${getRandomString()}`
			  )
			: undefined,
		...attachmentIds.map((id) =>
			getSignedUrlForFileUpload(
				`users/${userId}/scenarios/${scenarioId}/attachment_${id}_${getRandomString()}`
			)
		)
	]);
	if (preview?.error) {
		console.error(preview.error);
		return json({ message: 'Error getting signed URL for preview' }, { status: 500 });
	}
	if (attachments.some((attachment) => attachment.error)) {
		console.error(
			attachments.reduce((acc, cur) => {
				if (cur.error) acc.push(cur.error);
				return acc;
			}, [] as Error[])
		);
		return json({ message: 'Error getting signed URL for attachments' }, { status: 500 });
	}
	const result = {
		preview: preview ? preview.data : undefined,
		attachments: attachmentIds.map((id, index) => ({
			id,
			...attachments[index].data
		}))
	};
	return json(result);
};
