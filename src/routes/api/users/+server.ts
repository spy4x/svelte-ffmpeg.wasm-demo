import { auth } from '$lib/server/lucia';
import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';

const POST_PAYLOAD = z.object({
	email: z.string().email().max(50),
	password: z.string().min(8)
});

export const POST: RequestHandler = async ({ locals, request, cookies }) => {
	if (locals.user) {
		console.log('User already signed in');
		return json(locals.user);
	}
	const payload = await request.json();
	const parseResult = POST_PAYLOAD.safeParse(payload);
	if (!parseResult.success) {
		return json(parseResult.error.format(), { status: 400 });
	}
	const { email, password } = parseResult.data;

	try {
		const user = await auth.createUser({
			primaryKey: {
				providerId: 'email',
				providerUserId: email,
				password
			},
			attributes: {
				email
			}
		});

		const session = await auth.createSession(user.userId);
		console.log({ user, session });
		locals.auth.setSession(session);
		// set js-accessible cookie with user.id
		cookies.set('user_id', user.userId, {
			path: '/',
			maxAge: 60 * 60
		});
		return json(user);
	} catch (error: unknown) {
		// email taken
		console.error(error);
		return json(error, { status: 500 });
	}
};
