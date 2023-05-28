import { localStorageStore } from '@skeletonlabs/skeleton';
import type { AuthUser } from '@prisma/client';
import { request, type RequestHelperError } from './helpers';
import { USER_ID_COOKIE_NAME } from '@shared';
import { browser } from '$app/environment';

export enum AuthStatus {
	IDLE = 'IDLE',
	IN_PROGRESS = 'IN_PROGRESS',
	ERROR = 'ERROR',
	SUCCESS = 'SUCCESS'
}
export enum AuthOperation {
	SIGN_IN = 'SIGN_IN',
	SIGN_UP = 'SIGN_UP',
	SIGN_OUT = 'SIGN_OUT',
	FETCH_ME = 'FETCH_ME',
	GOOGLE = 'GOOGLE',
	FACEBOOK = 'FACEBOOK'
}

interface State {
	user: null | AuthUser;
	status: AuthStatus;
	error: null | RequestHelperError;
	operation: null | AuthOperation;
}

const initialValue: State = {
	user: null,
	status: AuthStatus.IDLE,
	error: null,
	operation: null
};

const LOCAL_STORAGE_KEY = 'auth';

const store = localStorageStore<State>(LOCAL_STORAGE_KEY, initialValue);

function mutate(state: Partial<State>) {
	store.update((s) => ({ ...s, ...state }));
}

export const auth = {
	subscribe: store.subscribe,
	signIn: async (email: string, password: string): Promise<void> => {
		mutate({ status: AuthStatus.IN_PROGRESS, error: null, operation: AuthOperation.SIGN_IN });
		const payload = { email, password };
		const [error, user] = await request<AuthUser>('/api/users/sign-in', 'POST', payload);
		mutate({ status: user ? AuthStatus.SUCCESS : AuthStatus.ERROR, user, error });
	},
	signUp: async (email: string, password: string): Promise<void> => {
		mutate({ status: AuthStatus.IN_PROGRESS, error: undefined, operation: AuthOperation.SIGN_UP });
		const [error, user] = await request<AuthUser>('/api/users', 'POST', { email, password });
		mutate({ status: user ? AuthStatus.SUCCESS : AuthStatus.ERROR, user, error });
	},
	signOut: async () => {
		mutate({ status: AuthStatus.IN_PROGRESS, error: undefined, operation: AuthOperation.SIGN_OUT });
		const [error] = await request<void>('/api/users/sign-out', 'POST');
		mutate({ status: error ? AuthStatus.ERROR : AuthStatus.IDLE, error, user: null });
	},
	fetchMe: async (): Promise<void> => {
		mutate({ status: AuthStatus.IN_PROGRESS, error: null, operation: AuthOperation.FETCH_ME });
		const [error, user] = await request<AuthUser>('/api/users/me');
		if (error) {
			if (error.status === 401) {
				mutate({ status: AuthStatus.IDLE, error: null, user: null });
			} else {
				mutate({ status: AuthStatus.ERROR, error });
			}
		} else {
			mutate({ user, status: AuthStatus.SUCCESS });
		}
	},
	oauth: (provider: AuthOperation.GOOGLE | AuthOperation.FACEBOOK): void => {
		mutate({ status: AuthStatus.IN_PROGRESS, error: null, operation: provider });
	},
	signInWithGoogleURL: '/api/users/google',
	signInWithFacebookURL: '/api/users/facebook'
};

function init() {
	mutate({ status: AuthStatus.IDLE, error: undefined }); // force initial value

	// if cookie with user.id exists - fetch user
	if (!browser) {
		return;
	}
	if (document.cookie.includes(USER_ID_COOKIE_NAME)) {
		auth.fetchMe();
	}
}

init();
