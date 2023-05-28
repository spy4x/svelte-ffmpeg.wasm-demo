import { invalidateSession } from '@server';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	if (locals.user) {
		return json(locals.user);
	} else {
		invalidateSession(locals.auth, cookies);
		return json({ message: 'Not authenticated.' }, { status: 401 });
	}
};
