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
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
	payload?: unknown,
	trackProgress?: (progress: number) => void
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
	if (trackProgress) {
		await readProgressAndReturnJSON(response, trackProgress);
	}
	const json = await response.json();
	if (response.ok) {
		return [null, json];
	} else {
		console.error(json);
		return [{ status: response.status, body: json }, null];
	}
}

export async function requestNew<T>(params: {
	url: string;
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	payload?: unknown;
	trackProgress?: (progress: number) => void;
}): Promise<[null, T] | [RequestHelperError, null]> {
	let { url, method, payload, trackProgress } = params;
	if (!method) {
		method = 'GET';
	}
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

	let response = await fetch(url, {
		method,
		...extraParams
	});

	if (trackProgress) {
		response = await readProgressAndReturnResponse(response, trackProgress);
	}
	const json = await response.json();
	if (response.ok) {
		return [null, json];
	} else {
		console.error(json);
		return [{ status: response.status, body: json }, null];
	}
}

async function readProgressAndReturnResponse(
	response: Response,
	trackProgress: (progress: number) => void
): Promise<Response> {
	if (!response.body) {
		console.error('Response body is empty');
		return response;
	}
	const contentLengthStr = response.headers.get('Content-Length');
	if (!contentLengthStr) {
		console.error('Response headers does not contain Content-Length');
		return response;
	}
	const contentLength = parseInt(contentLengthStr, 10);
	const body = response.body;
	let loaded = 0;

	return new Response(
		new ReadableStream({
			// Creates new readable stream on the new response object

			start(controller) {
				// Controller has methods on that allow the new stream to be constructed

				const reader = body.getReader();
				// Creates a new reader to read the body of the fetched resources

				read();
				// Fires function below that starts reading

				function read() {
					reader.read().then((progressEvent) => {
						// Starts reading, when there is progress this function will fire

						if (progressEvent.done) {
							controller.close();
							return;
							// Will finish constructing new stream if reading fetched of resource is complete
						}

						loaded += progressEvent.value.byteLength;
						// Increase value of 'loaded' by latest reading of fetched resource

						console.log(Math.round((loaded / contentLength) * 100) + '%');
						trackProgress(Math.round((loaded / contentLength) * 100));
						// Displays progress via console log as %

						controller.enqueue(progressEvent.value);
						// Add newly read data to the new readable stream

						read();
						// Runs function again to continue reading and creating new stream
					});
				}
			}
		})
	);
}

export async function requestMultipartFormData<T>(
	url: string,
	method: 'POST' | 'PATCH' | 'DELETE' = 'POST',
	body: FormData
): Promise<[null, T] | [RequestHelperError, null]> {
	try {
		const response = await fetch(url, {
			method,
			body
		});

		const data = await response.json();
		if (response.ok) {
			return [null, data];
		}
		return [{ status: response.status, body: data }, null];
	} catch (error) {
		console.error(error);
		return [{ status: 500, body: error }, null];
	}
}
