import { auth, setSession } from '@server';
import { Prisma } from '@prisma/client';
import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { QueryError } from 'prisma-error-enum';

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
		return json(
			{ ...parseResult.error.format(), message: 'Please check correctness of fields' },
			{ status: 400 }
		);
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
