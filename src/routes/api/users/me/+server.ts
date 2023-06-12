import { invalidateSession, prisma } from '@server';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals, cookies }) => {
	if (locals.user) {
		return json(locals.user);
	} else {
		invalidateSession(locals.auth, cookies);
		return json({ message: 'Not authenticated.' }, { status: 401 });
	}
};

// DELETE method for deleting this user from database
export const DELETE: RequestHandler = async ({ locals, cookies }) => {
	if (locals.user) {
		// delete user from database
		await prisma.authUser.delete({
			where: {
				id: locals.user.id
			}
		});

		// invalidate session
		invalidateSession(locals.auth, cookies);
		return json({ message: 'User deleted.' });
	} else {
		invalidateSession(locals.auth, cookies);
		return json({ message: 'Not authenticated.' }, { status: 401 });
	}
};
