import { invalidateSession } from '@server';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals, cookies }) => {
	await invalidateSession(locals.auth, cookies, locals.session?.sessionId);
	return json({}, { status: 200 });
};
