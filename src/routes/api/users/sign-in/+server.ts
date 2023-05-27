import { auth, setSession } from '$lib/server/lucia';
import { json, type RequestHandler } from '@sveltejs/kit';
import { LuciaError } from 'lucia-auth';
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
		const key = await auth.useKey('email', email, password);
		const user = await auth.getUser(key.userId);
		const session = await auth.createSession(user.userId);
		console.log({ user, key, session });
		setSession(locals.auth, cookies, user, session);
		return json(user);
	} catch (error: unknown) {
		if (error instanceof LuciaError) {
			if (error.message === 'AUTH_INVALID_KEY_ID') {
				return json(
					{
						message: 'The provided email and password combination does not match any existing user.'
					},
					{ status: 401 }
				);
			} else {
				console.error(error);
				return json({ message: error.message }, { status: 401 });
			}
		}

		console.error(error);
		return json(error, { status: 500 });
	}
};
