import { Prisma } from '@prisma/client';
import { auth, setSession } from '@server';
import { AuthEmailPasswordSchema, handleValidationError } from '@shared';
import { json, type RequestHandler } from '@sveltejs/kit';
import { QueryError } from 'prisma-error-enum';

export const POST: RequestHandler = async ({ locals, request, cookies }) => {
	if (locals.user) {
		console.log('User already signed in');
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
		setSession(locals.auth, cookies, user, session);
		return json(user);
	} catch (error: unknown) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === QueryError.UniqueConstraintViolation) {
				return json(
					{
						message: 'The provided email is already in use.'
					},
					{ status: 401 }
				);
			}
		}
		console.error(error);
		return json({ message: 'Server Error' }, { status: 500 });
	}
};
