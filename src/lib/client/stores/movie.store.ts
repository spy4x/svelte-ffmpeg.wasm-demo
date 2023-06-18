import { browser } from '$app/environment';
import { uploadFile } from '@client/services';
import type { Movie } from '@prisma/client';
import {
	AsyncOperationStatus,
	ClipVMSchema,
	EntityOperationType,
	MovieVMSchema,
	USER_ID_COOKIE_NAME,
	VideoStatus,
	getRandomString,
	type MovieDelete,
	type MovieVM,
	type ResponseList,
	MovieCommandSchema
} from '@shared';
import { toastStore } from '@skeletonlabs/skeleton';
import { derived, get, writable, type Writable } from 'svelte/store';
import { auth } from './auth.store';
import { request, type RequestHelperError } from './helpers';
import { scenarios } from './scenario.store';

export interface MovieOperation {
	type: EntityOperationType;
	payload: MovieVM | MovieDelete;
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
	create: async (movie: MovieVM): Promise<void> => {
		const state = get(dataStore);
		// add create operation to operations if operation with same id does not exists
		const existingOperation = state.operations[movie.id];
		if (
			existingOperation &&
			existingOperation.type === EntityOperationType.CREATE &&
			existingOperation.status === AsyncOperationStatus.IN_PROGRESS
		) {
			return;
		}

		mutateOperation(movie.id, {
			type: EntityOperationType.CREATE,
			payload: movie,
			status: AsyncOperationStatus.IN_PROGRESS,
			error: null
		});

		const [error, createdMovie] = await request<Movie>('/api/movies', 'POST', movie);
		// update operation status
		mutateOperation(movie.id, {
			status: createdMovie ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			error
		});
		if (createdMovie) {
			mutateList({
				ids: [createdMovie.id, ...state.list.ids],
				data: { ...state.list.data, [createdMovie.id]: createdMovie }
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
	createFromScenario: async (
		id: string,
		scenarioId: null | string,
		title?: string
	): Promise<void> => {
		const movie = MovieVMSchema.parse({
			id,
			scenarioId,
			title,
			userId: get(auth).user?.id
		} satisfies Partial<MovieVM>);
		if (scenarioId) {
			const scenariosState = get(scenarios);
			const scenario = scenariosState.getById(scenarioId);
			if (!scenario) {
				toastStore.trigger({
					message: `Scenario with id ${scenarioId} not found`,
					background: 'variant-filled-error'
				});
				return;
			}
			if (!title) {
				movie.title = scenario.title;
			}
			if (!movie.description) {
				movie.description = scenario.description;
			}
			movie.actors = scenario.actors;
			movie.clips = scenario.scenes.map((s) => ({
				id: getRandomString(),
				description: s.description,
				actor: s.actor ?? null,
				status: VideoStatus.IDLE,
				durationSec: 0,
				file: null,
				path: null,
				url: null,
				mimeType: null
			}));
		}
		if (!movie.clips.length) {
			movie.clips.push(ClipVMSchema.parse({}));
		}
		await movies.create(movie);
	},
	update: async (movie: MovieVM): Promise<void> => {
		const state = get(dataStore);
		// add update operation to operations if operation with same id does not exists
		const existingOperation = state.operations[movie.id];
		if (
			existingOperation &&
			existingOperation.type === EntityOperationType.UPDATE &&
			existingOperation.status === AsyncOperationStatus.IN_PROGRESS
		) {
			return;
		}

		mutateOperation(movie.id, {
			type: EntityOperationType.UPDATE,
			payload: movie,
			status: AsyncOperationStatus.IN_PROGRESS,
			error: null
		});

		// TODO: pick only changed fields (vidoe, clips)
		const wasVideoChanged = !!movie.videoFile;
		const clipsChangedIds = movie.clips.filter((c) => c.file).map((a) => a.id);

		if (wasVideoChanged || clipsChangedIds.length) {
			const [error, result] = await request<{
				video: { path: string; token: string };
				clips: { id: string; path: string; token: string }[];
			}>(`/api/movies/${movie.id}/uploads`, 'GET', {
				video: wasVideoChanged,
				clips: clipsChangedIds
			});
			if (error) {
				mutateOperation(movie.id, {
					status: AsyncOperationStatus.ERROR,
					error
				});
				return;
			}

			// Upload the changed files (video, clips)

			const uploadPromises = [];
			if (wasVideoChanged && result.video && movie.videoFile) {
				uploadPromises.push(uploadFile(result.video.path, result.video.token, movie.videoFile));
			}
			if (result.clips.length) {
				result.clips.forEach((a) => {
					const clip = movie.clips.find((clip) => clip.id === a.id);
					if (clip?.file) {
						uploadPromises.push(uploadFile(a.path, a.token, clip.file));
					}
				});
			}

			const uploadResults = await Promise.all(uploadPromises);

			// check if any errors - log them and stop
			const uploadErrors = uploadResults.filter((r) => r.error);
			if (uploadErrors.length) {
				console.error(uploadErrors);
				mutateOperation(movie.id, {
					status: AsyncOperationStatus.ERROR,
					error: {
						status: 500,
						body: uploadErrors[0].error ? uploadErrors[0].error : { message: 'Upload error' }
					}
				});
				return;
			}

			// update scenario with URLs of uploaded files
			if (wasVideoChanged) {
				movie.videoPath = result.video.path;
			}
			if (result.clips.length) {
				result.clips.forEach((a) => {
					const clip = movie.clips.find((clip) => clip.id === a.id);
					if (clip) {
						clip.path = a.path;
					}
				});
			}
		}

		const payload = MovieCommandSchema.parse(movie);

		const [error, updatedMovie] = await request<Movie>(`/api/movies/${movie.id}`, 'PATCH', payload);

		// update operation status
		mutateOperation(movie.id, {
			status: updatedMovie ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			error
		});

		if (updatedMovie) {
			mutateList({
				data: { ...state.list.data, [updatedMovie.id]: updatedMovie }
			});
			toastStore.trigger({
				message: 'Movie saved successfully',
				background: 'variant-filled-success'
			});
		} else {
			toastStore.trigger({
				message: 'Movie save failed',
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
						// delete movie from list
						delete state.list.data[id];
						mutateList({
							ids: state.list.ids.filter((i) => i !== id),
							data: state.list.data
						});
						toastStore.trigger({
							message: 'Movie deleted successfully',
							background: 'variant-filled-success'
						});
					}
				}
			},
			background: 'variant-filled-error'
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

	auth.onAuthStateChange((user) => {
		if (user) {
			const state = get(movies);
			if (state.list.status === AsyncOperationStatus.IDLE) {
				// to avoid double fetch
				movies.fetchList();
			}
		} else {
			mutate(initialValue);
		}
	});
}

init();
