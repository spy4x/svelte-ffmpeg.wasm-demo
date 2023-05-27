import { redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { auth, googleAuth, setSession } from '$lib/server/lucia';
import { dev } from '$app/environment';

export const GET: RequestHandler = async ({ cookies, url, locals }) => {
	// get code and state params from url
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	// get stored state from cookies
	const storedState = cookies.get('google_oauth_state');

	// validate state
	if (!state || !storedState || state !== storedState || !code) {
		console.error('invalid state');
		throw new Response(null, { status: 401 });
	}

	try {
		const { existingUser, providerUser, createUser } = await googleAuth.validateCallback(code);
		console.log({ existingUser, providerUser });

		const getUser = async () => {
			if (existingUser) {
				console.log('existing user...');
				return existingUser;
			}
			console.log('creating user...');
			return await createUser({
				email: providerUser.email
			});
		};
		const user = await getUser();
		console.log({ user });
		const session = await auth.createSession(user.userId);
		setSession(locals.auth, cookies, user, session);
	} catch (e) {
		console.error(e);
		// invalid code
		return new Response(null, {
			status: 500
		});
	}
	throw redirect(302, '/auth');
};
