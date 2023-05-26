import { auth } from '$lib/server/lucia';
import { json, type RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent): Promise<Response> {
	const session = event.locals.session;
	if (!session) {
		return json({}, { status: 401 });
	}
	await auth.invalidateSession(session.sessionId); // invalidate session
	event.locals.auth.setSession(null); // remove cookie
	return json({}, { status: 200 });
}
