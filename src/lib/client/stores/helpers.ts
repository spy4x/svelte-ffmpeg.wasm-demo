import type { Writable } from 'svelte/store';

export function createStoreMutator<T>(store: Writable<T>) {
	return (mutation: Partial<T>) => {
		store.update((state) => ({ ...state, ...mutation }));
	};
}

export interface RequestHelperError {
	status: number;
	body: unknown;
}

export async function request<T>(
	url: string,
	method: 'GET' | 'POST' | 'PATCH' = 'GET',
	payload?: unknown
): Promise<[null, T] | [RequestHelperError, null]> {
	const extraParams: { body?: string; headers?: { [key: string]: string } } = {};
	if (payload) {
		extraParams.body = JSON.stringify(payload);
		extraParams.headers = {
			'Content-Type': 'application/json'
		};
	}

	// if method == "GET" - put payload into query string
	if (method === 'GET' && payload) {
		const params = new URLSearchParams(payload as Record<string, string>);
		url += `?${params.toString()}`;
		extraParams.body = undefined;
	}

	const response = await fetch(url, {
		method,
		...extraParams
	});
	const json = await response.json();
	if (response.ok) {
		return [null, json];
	} else {
		console.error(json);
		return [{ status: response.status, body: json }, null];
	}
}
