// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare global {
	namespace App {
		interface Locals {
			auth: import('lucia-auth').AuthRequest;
			user: import('$lib/lucia').LuciaUser | null;
			session: import('lucia-auth').Session | null;
		}
		// interface PageData {}
		// interface Error {}
		// interface Platform {}
	}
}

/// <reference types="lucia-auth" />
declare global {
	namespace Lucia {
		type Auth = import('$lib/lucia').Auth;
		type UserAttributes = {
			email: string;
			createdAt?: Date;
			updatedAt?: Date;
		};
	}
}

// THIS IS IMPORTANT!!!
export {};
