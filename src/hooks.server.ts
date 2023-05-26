import { auth } from '$lib/server/lucia';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	console.log('\n\n');
	console.log(event.request.method, event.request.url);
	event.locals.auth = auth.handleRequest(event);
	const { session, user } = await event.locals.auth.validateUser();
	console.log({ userId: user?.userId, sessionId: session?.sessionId });
	event.locals.user = user;
	event.locals.session = session;
	const result = await resolve(event);
	console.log(event.request.method, event.request.url, result.status, Date.now() - start + 'ms');
	console.log('\n\n');
	return result;
};
