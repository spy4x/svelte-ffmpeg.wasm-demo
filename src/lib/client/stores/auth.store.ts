import { localStorageStore } from '@skeletonlabs/skeleton';
import type { AuthUser } from '@prisma/client';
import { request, type RequestHelperError } from './helpers';
import { AsyncOperationStatus, USER_ID_COOKIE_NAME } from '@shared';
import { browser } from '$app/environment';
import { get } from 'svelte/store';

export enum AuthOperation {
	SIGN_IN = 'SIGN_IN',
	SIGN_UP = 'SIGN_UP',
	SIGN_OUT = 'SIGN_OUT',
	FETCH_ME = 'FETCH_ME',
	GOOGLE = 'GOOGLE',
	FACEBOOK = 'FACEBOOK',
	DELETE = 'DELETE'
}

interface State {
	user: null | AuthUser;
	status: AsyncOperationStatus;
	error: null | RequestHelperError;
	operation: null | AuthOperation;
}

const initialValue: State = {
	user: null,
	status: AsyncOperationStatus.IDLE,
	error: null,
	operation: null
};

const LOCAL_STORAGE_KEY = 'auth';

const store = localStorageStore<State>(LOCAL_STORAGE_KEY, initialValue);

function mutate(state: Partial<State>) {
	const prevState = get(store);
	const nextState = { ...prevState, ...state };
	store.set(nextState);

	if (typeof state.user !== 'undefined') {
		// if user changed
		const wasUserAuthenticated = prevState.user !== null;
		const isUserAuthenticated = state.user !== null;
		if (wasUserAuthenticated !== isUserAuthenticated) {
			onAuthStateChangeSubscribers.forEach((subscriber) => subscriber(nextState.user));
		}
	}
}

const onAuthStateChangeSubscribers: Array<(user: null | AuthUser) => void> = [];

export const auth = {
	subscribe: store.subscribe,
	signIn: async (email: string, password: string): Promise<void> => {
		mutate({
			status: AsyncOperationStatus.IN_PROGRESS,
			error: null,
			operation: AuthOperation.SIGN_IN
		});
		const payload = { email, password };
		const [error, user] = await request<AuthUser>('/api/users/sign-in', 'POST', payload);
		mutate({
			status: user ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			user,
			error
		});
	},
	signUp: async (email: string, password: string): Promise<void> => {
		mutate({
			status: AsyncOperationStatus.IN_PROGRESS,
			error: undefined,
			operation: AuthOperation.SIGN_UP
		});
		const [error, user] = await request<AuthUser>('/api/users', 'POST', { email, password });
		mutate({
			status: user ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			user,
			error
		});
	},
	signOut: async () => {
		mutate({
			status: AsyncOperationStatus.IN_PROGRESS,
			error: undefined,
			operation: AuthOperation.SIGN_OUT
		});
		const [error] = await request<void>('/api/users/sign-out', 'POST');
		mutate({
			status: error ? AsyncOperationStatus.ERROR : AsyncOperationStatus.IDLE,
			error,
			user: null
		});
	},
	fetchMe: async (): Promise<void> => {
		mutate({
			status: AsyncOperationStatus.IN_PROGRESS,
			error: null,
			operation: AuthOperation.FETCH_ME
		});
		const [error, user] = await request<AuthUser>('/api/users/me');
		if (error) {
			if (error.status === 401) {
				mutate({ status: AsyncOperationStatus.IDLE, error: null, user: null });
			} else {
				mutate({ status: AsyncOperationStatus.ERROR, error });
			}
		} else {
			mutate({ user, status: AsyncOperationStatus.SUCCESS });
		}
	},
	oauth: (provider: AuthOperation.GOOGLE | AuthOperation.FACEBOOK): void => {
		mutate({ status: AsyncOperationStatus.IN_PROGRESS, error: null, operation: provider });
	},
	delete: async (): Promise<boolean> => {
		mutate({
			status: AsyncOperationStatus.IN_PROGRESS,
			error: null,
			operation: AuthOperation.DELETE
		});
		const [error] = await request<void>('/api/users/me', 'DELETE');
		if (error) {
			mutate({ status: AsyncOperationStatus.ERROR, error });
			return false;
		} else {
			mutate(initialValue);
			return true;
		}
	},
	onAuthStateChange: (cb: (user: null | AuthUser) => void): ()=>void => {
		onAuthStateChangeSubscribers.push(cb);
		return () => {
			// unsubscribe
			const index = onAuthStateChangeSubscribers.indexOf(cb);
			if (index !== -1) {
				onAuthStateChangeSubscribers.splice(index, 1);
			}
		}
	},
	signInWithGoogleURL: '/api/users/google',
	signInWithFacebookURL: '/api/users/facebook'
};

function init() {
	mutate({ status: AsyncOperationStatus.IDLE, error: undefined }); // force initial value

	// if cookie with user.id exists - fetch user
	if (!browser) {
		return;
	}
	if (document.cookie.includes(USER_ID_COOKIE_NAME)) {
		auth.fetchMe();
	}
}

init();
