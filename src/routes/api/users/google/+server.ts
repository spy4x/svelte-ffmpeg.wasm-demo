import { googleAuth } from '@server';
import { redirect, type RequestHandler } from '@sveltejs/kit';
import { GOOGLE_AUTH_COOKIE_NAME } from './types';

export const GET: RequestHandler = async ({ cookies, locals }) => {
	// if already authenticated, redirect to home
	if (locals.user) {
		throw redirect(302, '/');
	}

	// get url to redirect the user to, with the state
	const [url, state] = await googleAuth.getAuthorizationUrl();

	// the state can be stored in cookies for request validation on callback
	cookies.set(GOOGLE_AUTH_COOKIE_NAME, state, {
		path: '/',
		maxAge: 60 * 60
	});

	// redirect to authorization url
	return new Response(null, {
		status: 302,
		headers: {
			location: url.toString()
		}
	});
};
