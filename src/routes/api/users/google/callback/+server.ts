import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth, googleAuth, setSession } from '@server';
import { GOOGLE_AUTH_COOKIE_NAME } from '../types';

export const GET: RequestHandler = async ({ cookies, url, locals }) => {
	// get code and state params from url
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	// get stored state from cookies
	const storedState = cookies.get(GOOGLE_AUTH_COOKIE_NAME);

	// validate state
	if (!state || !storedState || state !== storedState || !code) {
		console.error('invalid state');
		throw redirect(302, '/auth');
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
				email: providerUser.email,
				firstName: providerUser.given_name,
				lastName: providerUser.family_name,
				photoURL: providerUser.picture
			});
		};
		const user = await getUser();
		console.log({ user });
		const session = await auth.createSession(user.userId);
		setSession(locals.auth, cookies, user, session);
	} catch (e) {
		// invalid code
		console.error(e);
	}
	throw redirect(302, '/auth');
};
