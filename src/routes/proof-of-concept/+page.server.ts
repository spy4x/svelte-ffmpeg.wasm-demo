import type { Load } from '@sveltejs/kit';

export const load: Load = async (event) => {
	event.setHeaders({
		'Cross-Origin-Embedder-Policy': 'require-corp',
		'Cross-Origin-Opener-Policy': 'same-origin'
	});
	return {
		props: {
			page: 1
		}
	};
};
