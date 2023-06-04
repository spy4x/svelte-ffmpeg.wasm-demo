import { request, type RequestHelperError } from './helpers';
import {
	AsyncOperationStatus,
	USER_ID_COOKIE_NAME,
	type MovieCreate,
	type MovieUpdate,
	type MovieDelete,
	type ResponseList,
	EntityOperationType
} from '@shared';
import { browser } from '$app/environment';
import type { Movie } from '@prisma/client';
import { derived, get, writable, type Writable } from 'svelte/store';
import { auth } from './auth.store';
import { toastStore } from '@skeletonlabs/skeleton';

export interface MovieOperation {
	type: EntityOperationType;
	payload: MovieCreate | MovieUpdate | MovieDelete;
	status: AsyncOperationStatus;
	error: null | RequestHelperError;
}

interface DataState {
	list: {
		ids: string[];
		data: { [id: string]: Movie };
		total: number;
		perPage: number;
		status: AsyncOperationStatus;
		error: null | RequestHelperError;
	};
	operations: { [id: string]: MovieOperation };
}
interface ViewState {
	list: {
		data: Movie[];
		status: AsyncOperationStatus;
		error: null | RequestHelperError;
	};
	operations: { [id: string]: MovieOperation };
	getById: (id: string) => null | Movie;
	getOperationById: (id: string) => null | MovieOperation;
}

const initialValue: DataState = {
	list: {
		ids: [],
		data: {},
		total: 0,
		perPage: 0,
		status: AsyncOperationStatus.IDLE,
		error: null
	},
	operations: {}
};

const dataStore = writable<DataState>(initialValue);

function mutate(state: Partial<DataState>) {
	dataStore.update((s) => ({ ...s, ...state }));
}
function mutateList(state: Partial<DataState['list']>) {
	mutate({ list: { ...get(dataStore).list, ...state } });
}
function mutateOperation(id: string, state: Partial<MovieOperation>) {
	mutate({
		operations: {
			...get(dataStore).operations,
			[id]: {
				...get(dataStore).operations[id],
				...state
			}
		}
	});
}

const viewStore = derived<Writable<DataState>, ViewState>(dataStore, (state) => ({
	list: {
		data: state.list.ids.map((id) => state.list.data[id]),
		status: state.list.status,
		error: state.list.error
	},
	operations: state.operations,
	getById: (id: string) => state.list.data[id],
	getOperationById: (id: string) => state.operations[id]
}));

export const movies = {
	subscribe: viewStore.subscribe,
	fetchList: async (): Promise<void> => {
		// if list.status === in progress - do nothing
		if (get(dataStore).list.status === AsyncOperationStatus.IN_PROGRESS) {
			return;
		}
		mutateList({ status: AsyncOperationStatus.IN_PROGRESS, error: null });
		const [error, list] = await request<ResponseList<Movie>>('/api/movies');
		mutateList({
			status: list ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			ids: list ? list.data.map((s) => s.id) : [],
			data: list ? list.data.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}) : {},
			total: list ? list.total : 0,
			perPage: list ? list.perPage : 0,
			error
		});
	},
	create: async (data: MovieCreate): Promise<void> => {
		const state = get(dataStore);
		// add create operation to operations if operation with same id does not exists
		const existingOperation = state.operations[data.id];
		if (
			existingOperation &&
			existingOperation.type === EntityOperationType.CREATE &&
			existingOperation.status === AsyncOperationStatus.IN_PROGRESS
		) {
			return;
		}

		mutateOperation(data.id, {
			type: EntityOperationType.CREATE,
			payload: data,
			status: AsyncOperationStatus.IN_PROGRESS,
			error: null
		});

		const [error, movie] = await request<Movie>('/api/movies', 'POST', data);
		// update operation status
		mutateOperation(data.id, {
			status: movie ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			error
		});
		if (movie) {
			mutateList({
				ids: [movie.id, ...state.list.ids],
				data: { ...state.list.data, [movie.id]: movie }
			});
			toastStore.trigger({
				message: 'Movie created successfully',
				background: 'variant-filled-success'
			});
		} else {
			toastStore.trigger({
				message: 'Movie creation failed',
				background: 'variant-filled-warning'
			});
		}
	},
	update: async (data: MovieUpdate): Promise<void> => {
		const state = get(dataStore);
		// add update operation to operations if operation with same id does not exists
		const existingOperation = state.operations[data.id];
		if (
			existingOperation &&
			existingOperation.type === EntityOperationType.UPDATE &&
			existingOperation.status === AsyncOperationStatus.IN_PROGRESS
		) {
			return;
		}

		mutateOperation(data.id, {
			type: EntityOperationType.UPDATE,
			payload: data,
			status: AsyncOperationStatus.IN_PROGRESS,
			error: null
		});

		const [error, movie] = await request<Movie>(`/api/movies/${data.id}`, 'PATCH', data);
		// update operation status
		mutateOperation(data.id, {
			status: movie ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			error
		});
		if (movie) {
			mutateList({
				data: { ...state.list.data, [movie.id]: movie }
			});
			toastStore.trigger({
				message: 'Movie updated successfully',
				background: 'variant-filled-success'
			});
		} else {
			toastStore.trigger({
				message: 'Movie update failed',
				background: 'variant-filled-warning'
			});
		}
	},
	delete: async (id: string): Promise<void> => {
		const state = get(dataStore);
		// add delete operation to operations if operation with same id does not exists
		const existingOperation = state.operations[id];
		if (
			existingOperation &&
			existingOperation.type === EntityOperationType.DELETE &&
			existingOperation.status === AsyncOperationStatus.IN_PROGRESS
		) {
			return;
		}
		const movie = state.list.data[id];
		if (!movie) {
			toastStore.trigger({
				message: `Movie "${id}" not found`,
				background: 'variant-filled-warning'
			});
			return;
		}

		toastStore.trigger({
			message: `Delete movie "${movie.title}"?`,
			action: {
				label: 'Yes',
				response: async () => {
					mutateOperation(id, {
						type: EntityOperationType.DELETE,
						payload: id,
						status: AsyncOperationStatus.IN_PROGRESS,
						error: null
					});

					const [error] = await request(`/api/movies/${id}`, 'DELETE');
					// update operation status
					mutateOperation(id, {
						status: error ? AsyncOperationStatus.ERROR : AsyncOperationStatus.SUCCESS,
						error
					});
					if (error) {
						toastStore.trigger({
							message: 'Movie deletion failed',
							background: 'variant-filled-warning'
						});
					} else {
						const { [id]: _, ...rest } = state.list.data;
						mutateList({
							ids: state.list.ids.filter((i) => i !== id),
							data: rest
						});
						toastStore.trigger({
							message: 'Movie deleted successfully',
							background: 'variant-filled-success'
						});
					}
				}
			},
			background: "variant-filled-error"
		});
	}
};

function init() {
	// if cookie with user.id exists - fetch user
	if (!browser) {
		return;
	}
	if (document.cookie.includes(USER_ID_COOKIE_NAME)) {
		movies.fetchList();
	}
	let previousAuthStatus = get(auth).status;
	auth.subscribe((authState) => {
		if (
			previousAuthStatus !== authState.status &&
			authState.status === AsyncOperationStatus.SUCCESS
		) {
			previousAuthStatus = authState.status;
			movies.fetchList();
		}
		if (previousAuthStatus !== authState.status && authState.status === AsyncOperationStatus.IDLE) {
			previousAuthStatus = authState.status;
			mutate(initialValue);
		}
	});
}

init();
