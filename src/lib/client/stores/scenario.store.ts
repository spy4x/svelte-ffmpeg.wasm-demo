import { request, type RequestHelperError } from './helpers';
import {
	AsyncOperationStatus,
	USER_ID_COOKIE_NAME,
	type ScenarioCreate,
	type ScenarioUpdate,
	type ScenarioDelete,
	type ResponseList
} from '@shared';
import { browser } from '$app/environment';
import type { Scenario } from '@prisma/client';
import { derived, get, writable, type Writable } from 'svelte/store';
import { auth } from './auth.store';

export enum ScenarioOperationType {
	CREATE = 'CREATE',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE'
}

export interface ScenarioOperation {
	type: ScenarioOperationType;
	payload: ScenarioCreate | ScenarioUpdate | ScenarioDelete;
	status: AsyncOperationStatus;
	error: null | RequestHelperError;
}

interface DataState {
	list: {
		ids: string[];
		data: { [id: string]: Scenario };
		total: number;
		perPage: number;
		status: AsyncOperationStatus;
		error: null | RequestHelperError;
	};
	operations: { [id: string]: ScenarioOperation };
}
interface ViewState {
	list: {
		data: Scenario[];
		status: AsyncOperationStatus;
		error: null | RequestHelperError;
	};
	operations: { [id: string]: ScenarioOperation };
	getById: (id: string) => null | Scenario;
	getOperationById: (id: string) => null | ScenarioOperation;
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
	list: {
		data: state.list.ids.map((id) => state.list.data[id]),
		status: state.list.status,
		error: state.list.error
	},
	operations: state.operations,
	getById: (id: string) => state.list.data[id],
	getOperationById: (id: string) => state.operations[id]
}));

export const scenarios = {
	subscribe: viewStore.subscribe,
	fetchList: async (): Promise<void> => {
		// if list.status === in progress - do nothing
		if (get(dataStore).list.status === AsyncOperationStatus.IN_PROGRESS) {
			return;
		}
		mutateList({ status: AsyncOperationStatus.IN_PROGRESS, error: null });
		const [error, list] = await request<ResponseList<Scenario>>('/api/scenarios');
		mutateList({
			status: list ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			ids: list ? list.data.map((s) => s.id) : [],
			data: list ? list.data.reduce((acc, s) => ({ ...acc, [s.id]: s }), {}) : {},
			total: list ? list.total : 0,
			perPage: list ? list.perPage : 0,
			error
		});
	},
	create: async (data: ScenarioCreate): Promise<void> => {
		const state = get(dataStore);
		// add create operation to operations if operation with same id does not exists
		const existingOperation = state.operations[data.id];
		if (
			existingOperation &&
			existingOperation.type === ScenarioOperationType.CREATE &&
			existingOperation.status === AsyncOperationStatus.IN_PROGRESS
		) {
			return;
		}

		mutateOperation(data.id, {
			type: ScenarioOperationType.CREATE,
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
			mutateList({
				ids: [scenario.id, ...state.list.ids],
				data: { ...state.list.data, [scenario.id]: scenario }
			});
		}
	},
	update: async (data: ScenarioUpdate): Promise<void> => {
		const state = get(dataStore);
		// add update operation to operations if operation with same id does not exists
		const existingOperation = state.operations[data.id];
		if (
			existingOperation &&
			existingOperation.type === ScenarioOperationType.UPDATE &&
			existingOperation.status === AsyncOperationStatus.IN_PROGRESS
		) {
			return;
		}

		mutateOperation(data.id, {
			type: ScenarioOperationType.UPDATE,
			payload: data,
			status: AsyncOperationStatus.IN_PROGRESS,
			error: null
		});

		const [error, scenario] = await request<Scenario>(`/api/scenarios/${data.id}`, 'PATCH', data);
		// update operation status
		mutateOperation(data.id, {
			status: scenario ? AsyncOperationStatus.SUCCESS : AsyncOperationStatus.ERROR,
			error
		});
		if (scenario) {
			mutateList({
				data: { ...state.list.data, [scenario.id]: scenario }
			});
		}
	},
	delete: async (id: string): Promise<void> => {
		const state = get(dataStore);
		// add delete operation to operations if operation with same id does not exists
		const existingOperation = state.operations[id];
		if (
			existingOperation &&
			existingOperation.type === ScenarioOperationType.DELETE &&
			existingOperation.status === AsyncOperationStatus.IN_PROGRESS
		) {
			return;
		}

		mutateOperation(id, {
			type: ScenarioOperationType.DELETE,
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
		if (!error) {
			const { [id]: _, ...rest } = state.list.data;
			mutateList({
				ids: state.list.ids.filter((i) => i !== id),
				data: rest
			});
		}
	}
};

function init() {
	// if cookie with user.id exists - fetch user
	if (!browser) {
		return;
	}
	if (document.cookie.includes(USER_ID_COOKIE_NAME)) {
		scenarios.fetchList();
	}
	let previousAuthStatus = get(auth).status;
	auth.subscribe((authState) => {
		if (
			previousAuthStatus !== authState.status &&
			authState.status === AsyncOperationStatus.SUCCESS
		) {
			previousAuthStatus = authState.status;
			scenarios.fetchList();
		}
		if (previousAuthStatus !== authState.status && authState.status === AsyncOperationStatus.IDLE) {
			previousAuthStatus = authState.status;
			mutate(initialValue);
		}
	});
}

init();
