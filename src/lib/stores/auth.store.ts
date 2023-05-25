import { localStorageStore } from '@skeletonlabs/skeleton';

interface State {
	isAuthenticated: boolean;
}

const initialValue: State = {
	isAuthenticated: false
};

const LOCAL_STORAGE_KEY = 'auth';

const store = localStorageStore<State>(LOCAL_STORAGE_KEY, initialValue);

function mutateStore(state: Partial<State>) {
	store.update((s) => ({ ...s, ...state }));
}

export const auth = {
	subscribe: store.subscribe,
	signIn: () => {
		mutateStore({ isAuthenticated: true });
	},
	signOut: () => {
		mutateStore({ isAuthenticated: false });
	}
};
