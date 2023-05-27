import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	if (locals.user) {
		return json(locals.user);
	} else {
		return json({ message: 'Not authenticated.' }, { status: 401 });
	}
};
