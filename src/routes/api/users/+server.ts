import { auth } from '$lib/server/lucia';
import { json, type RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';

const POST_PAYLOAD = z.object({
	email: z.string().email().max(50),
	password: z.string().min(8)
});

export async function POST(event: RequestEvent): Promise<Response> {
	if (event.locals.user) {
		console.log('User already signed in');
		return json(event.locals.user);
	}
	const payload = await event.request.json();
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
		event.locals.auth.setSession(session);
		return json(user);
	} catch (error: unknown) {
		// email taken
		console.error(error);
		return json(error, { status: 500 });
	}
}
