import { auth, setSession } from '@server';
import { AuthEmailPasswordSchema, handleValidationError } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';
import { LuciaError } from 'lucia-auth';

export const POST: RequestHandler = async ({ locals, request, cookies }) => {
	if (locals.user && locals.session) {
		console.log('User already signed in');
		setSession(locals.auth, cookies, locals.user, locals.session);
		return json(locals.user);
	}
	const payload = await request.json();
	const parseResult = AuthEmailPasswordSchema.safeParse(payload);
	if (!parseResult.success) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore - something weird with type imcompatibility
		return json(handleValidationError(parseResult.error), { status: 400 });
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
