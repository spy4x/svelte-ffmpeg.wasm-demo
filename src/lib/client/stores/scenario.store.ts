import { request, requestMultipartFormData, type RequestHelperError } from './helpers';
import {
	AsyncOperationStatus,
	USER_ID_COOKIE_NAME,
	type ScenarioCreate,
	type ScenarioUpdate,
	type ScenarioDelete,
	type ResponseList,
	EntityOperationType,
	scenarioToFormData
} from '@shared';
import { browser } from '$app/environment';
import type { Scenario } from '@prisma/client';
import { derived, get, writable, type Writable } from 'svelte/store';
import { auth } from './auth.store';
import { toastStore } from '@skeletonlabs/skeleton';

export interface ScenarioOperation {
	type: EntityOperationType;
	payload: ScenarioCreate | ScenarioUpdate | ScenarioDelete;
	status: AsyncOperationStatus;
	error: null | RequestHelperError;
}

interface ListDataState {
	ids: string[];
	data: { [id: string]: ScenarioUpdate };
	total: number;
	perPage: number;
	status: AsyncOperationStatus;
	error: null | RequestHelperError;
}

interface DataState {
	my: ListDataState;
	shared: ListDataState;
	operations: { [id: string]: ScenarioOperation };
}

export interface ListViewState {
	data: ScenarioUpdate[];
	status: AsyncOperationStatus;
	error: null | RequestHelperError;
}

interface ViewState {
	my: ListViewState;
	shared: ListViewState;
	operations: { [id: string]: ScenarioOperation };
	getById: (id: null | string) => null | Scenario;
	getOperationById: (id: string) => null | ScenarioOperation;
}

const listInitialValue: ListDataState = {
	ids: [],
	data: {},
	total: 0,
	perPage: 0,
	status: AsyncOperationStatus.IDLE,
	error: null
};

function getInitialValue(): DataState {
	return structuredClone({
		my: listInitialValue,
		shared: listInitialValue,
		operations: {}
	});
}

const dataStore = writable<DataState>(getInitialValue());

function mutate(state: Partial<DataState>) {
	dataStore.update((s) => ({ ...s, ...state }));
}
function mutateMy(state: Partial<DataState['my']>) {
	mutate({ my: { ...get(dataStore).my, ...state } });
}
function mutateShared(state: Partial<DataState['shared']>) {
	mutate({ shared: { ...get(dataStore).shared, ...state } });
}
function mutateOperation(id: string, state: Partial<ScenarioOperation>) {
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
	my: {
		data: state.my.ids.map((id) => state.my.data[id]),
		status: state.my.status,
		error: state.my.error
	},
	shared: {
		data: state.shared.ids.map((id) => state.shared.data[id]),
		status: state.shared.status,
		error: state.shared.error
	},
	operations: state.operations,
	getById: (id: null | string) => state.my.data[id] || state.shared.data[id] || null,
	getOperationById: (id: string) => state.operations[id]
}));

function scenarioToVM(scenario: Scenario): ScenarioUpdate {
	return {
		...scenario,
		previewFile: null,
		previewURL: scenario.previewURL || null
	};
}

export const scenarios = {
	subscribe: viewStore.subscribe,
	fetchMy: async (): Promise<void> => {
		// if my.status === in progress - do nothing
		if (get(dataStore).my.status === AsyncOperationStatus.IN_PROGRESS) {
			return;
		}
		mutateMy({ status: AsyncOperationStatus.IN_PROGRESS, error: null });
		const [error, my] = await request<ResponseList<Scenario>>('/api/scenarios');
		mutateMy({
			status: my ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			ids: my ? my.data.map((s) => s.id) : [],
			data: my
				? my.data.reduce(
						(acc, s) => ({
							...acc,
							[s.id]: scenarioToVM(s)
						}),
						{}
				  )
				: {},
			total: my ? my.total : 0,
			perPage: my ? my.perPage : 0,
			error
		});
	},
	fetchShared: async (): Promise<void> => {
		// if shared.status === in progress - do nothing
		if (get(dataStore).shared.status === AsyncOperationStatus.IN_PROGRESS) {
			return;
		}
		mutateShared({ status: AsyncOperationStatus.IN_PROGRESS, error: null });
		const [error, shared] = await request<ResponseList<Scenario>>('/api/scenarios/shared');
		mutateShared({
			status: shared ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			ids: shared ? shared.data.map((s) => s.id) : [],
			data: shared
				? shared.data.reduce(
						(acc, s) => ({
							...acc,
							[s.id]: scenarioToVM(s)
						}),
						{}
				  )
				: {},
			total: shared ? shared.total : 0,
			perPage: shared ? shared.perPage : 0,
			error
		});
	},
	create: async (data: ScenarioCreate): Promise<void> => {
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

		const [error, scenario] = await request<Scenario>('/api/scenarios', 'POST', data);
		// update operation status
		mutateOperation(data.id, {
			status: scenario ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			error
		});
		if (scenario) {
			mutateMy({
				ids: [scenario.id, ...state.my.ids],
				data: {
					...state.my.data,
					[scenario.id]: scenarioToVM(scenario)
				}
			});
			toastStore.trigger({
				message: 'Scenario created successfully',
				background: 'variant-filled-success'
			});
		} else {
			toastStore.trigger({
				message: 'Scenario creation failed',
				background: 'variant-filled-warning'
			});
		}
	},
	update: async (data: ScenarioUpdate): Promise<void> => {
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

		const formData = scenarioToFormData(data);

		const [error, scenario] = await requestMultipartFormData<Scenario>(
			`/api/scenarios/${data.id}`,
			'PATCH',
			formData
		);
		// update operation status
		mutateOperation(data.id, {
			status: scenario ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			error
		});
		if (scenario) {
			mutateMy({
				data: { ...state.my.data, [scenario.id]: scenarioToVM(scenario) }
			});
			toastStore.trigger({
				message: 'Scenario saved successfully',
				background: 'variant-filled-success'
			});
		} else {
			toastStore.trigger({
				message: 'Scenario save failed',
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
		const scenario = state.my.data[id];
		if (!scenario) {
			toastStore.trigger({
				message: `Scenario "${id}" not found`,
				background: 'variant-filled-warning'
			});
			return;
		}

		toastStore.trigger({
			message: `Delete scenario "${scenario.title}"?`,
			action: {
				label: 'Yes, delete',
				response: async () => {
					mutateOperation(id, {
						type: EntityOperationType.DELETE,
						payload: id,
						status: AsyncOperationStatus.IN_PROGRESS,
						error: null
					});

					const [error] = await request(`/api/scenarios/${id}`, 'DELETE');
					// update operation status
					mutateOperation(id, {
						status: error ? AsyncOperationStatus.ERROR : AsyncOperationStatus.SUCCESS,
						error
					});
					if (error) {
						toastStore.trigger({
							message: 'Scenario deletion failed',
							background: 'variant-filled-warning'
						});
					} else {
						const { [id]: _, ...rest } = state.my.data;
						mutateMy({
							ids: state.my.ids.filter((i) => i !== id),
							data: rest
						});
						toastStore.trigger({
							message: 'Scenario deleted successfully',
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
		scenarios.fetchMy();
		scenarios.fetchShared();
	}

	auth.onAuthStateChange((user) => {
		if (user) {
			const state = get(scenarios);
			if (state.my.status === AsyncOperationStatus.IDLE) {
				// to avoid double fetch
				scenarios.fetchMy();
			}
			if (state.shared.status === AsyncOperationStatus.IDLE) {
				// to avoid double fetch
				scenarios.fetchShared();
			}
		} else {
			mutate(getInitialValue());
		}
	});
}

init();
