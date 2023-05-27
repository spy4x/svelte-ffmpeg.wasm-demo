import { localStorageStore } from '@skeletonlabs/skeleton';
import type { AuthUser } from '@prisma/client';
import { get } from 'svelte/store';
import { request } from './helpers';
import { USER_ID_COOKIE_NAME } from '$lib/shared/constants';
import { browser } from '$app/environment';

export enum AuthStatus {
	IDLE = 'IDLE',
	IN_PROGRESS = 'IN_PROGRESS',
	ERROR = 'ERROR',
	SUCCESS = 'SUCCESS'
}

interface State {
	user?: AuthUser;
	status: AuthStatus;
	error?: object;
}

const initialValue: State = {
	user: undefined,
	status: AuthStatus.IDLE
};

const LOCAL_STORAGE_KEY = 'auth';

const store = localStorageStore<State>(LOCAL_STORAGE_KEY, initialValue);

function mutateStore(state: Partial<State>) {
	store.update((s) => ({ ...s, ...state }));
}

export const auth = {
	subscribe: store.subscribe,
	fetchMe: async (): Promise<State> => {
		mutateStore({ status: AuthStatus.IN_PROGRESS, error: undefined });
		const [error, user] = await request<AuthUser>('/api/users/me');
		if (error) {
			mutateStore({ status: AuthStatus.ERROR, error });
		} else {
			mutateStore({ user, status: AuthStatus.SUCCESS });
		}
		return get(store);
	},
	signIn: async (email: string, password: string): Promise<State> => {
		mutateStore({ status: AuthStatus.IN_PROGRESS, error: undefined });
		const [error, user] = await request<AuthUser>('/api/users/sign-in', 'POST', {
			email,
			password
		});
		if (error) {
			mutateStore({ status: AuthStatus.ERROR, error });
		} else {
			mutateStore({ user, status: AuthStatus.SUCCESS });
		}
		return get(store);
	},
	signUp: async (email: string, password: string): Promise<State> => {
		mutateStore({ status: AuthStatus.IN_PROGRESS, error: undefined });
		const [error, user] = await request<AuthUser>('/api/users', 'POST', { email, password });
		if (error) {
			mutateStore({ status: AuthStatus.ERROR, error });
		} else {
			mutateStore({ user, status: AuthStatus.SUCCESS });
		}
		return get(store);
	},
	signInWithGoogleURL: '/api/users/google',
	signInWithFacebookURL: '/api/users/facebook',
	signOut: async () => {
		mutateStore({ status: AuthStatus.IN_PROGRESS, error: undefined });
		const [error] = await request<void>('/api/users/sign-out', 'POST');
		if (error) {
			mutateStore({ status: AuthStatus.ERROR, error });
		} else {
			mutateStore({ user: undefined, error: undefined, status: AuthStatus.IDLE });
		}
	}
};

function init() {
	mutateStore({ status: AuthStatus.IDLE, error: undefined }); // force initial value

	// if cookie with user.id exists - fetch user
	if (!browser) {
		return;
	}
	if (document.cookie.includes(USER_ID_COOKIE_NAME)) {
		auth.fetchMe();
	}
}

init();
