import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	server: {
		proxy: {
			'^/api/media/.*': {
				target: process.env.SUPABASE_PROJECT_URL + '/storage/v1/object/sign/media',
				changeOrigin: true,
				secure: true,
				rewrite: (path) => path.replace(/^\/api\/media/, '')
			}
		}
	}
});
