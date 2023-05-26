import lucia from 'lucia-auth';
import { sveltekit } from 'lucia-auth/middleware';
import prismaAdapter from '@lucia-auth/adapter-prisma';
import { prisma } from './prisma';
import { dev } from '$app/environment';
import type { AuthUser } from '@prisma/client';

export interface LuciaUser extends AuthUser {
	userId: string;
}

export const auth = lucia({
	adapter: prismaAdapter(prisma),
	env: dev ? 'DEV' : 'PROD',
	middleware: sveltekit(),
	transformDatabaseUser: (user): LuciaUser => {
		return {
			id: user.id,
			userId: user.id,
			email: user.email,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		};
	}
});

export type Auth = typeof auth;
