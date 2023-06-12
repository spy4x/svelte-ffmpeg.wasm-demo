import type { MovieClipCommand, MovieCommand, ScenarioUpdate } from './types';

export function movieToFormData(movie: MovieCommand): FormData {
	const formData = new FormData();
	formData.append('id', movie.id);
	formData.append('title', movie.title);
	formData.append('description', movie.description);
	if (movie.scenarioId) {
		formData.append('scenarioId', movie.scenarioId);
	}
	formData.append('actors.length', movie.actors.length.toString());
	movie.actors.forEach((actor, index) => {
		formData.append(`actors[${index}]`, actor);
	});
	formData.append('clips.length', movie.clips.length.toString());
	movie.clips.forEach((clip, index) => {
		if (typeof clip.actor === 'number') {
			formData.append(`clips[${index}].actor`, clip.actor.toString());
		}
		if (typeof clip.durationSec === 'number') {
			formData.append(`clips[${index}].durationSec`, clip.durationSec.toString());
		}
		formData.append(`clips[${index}].description`, clip.description);
		if (clip.url) {
			formData.append(`clips[${index}].url`, clip.url);
		}
		if (clip.mimeType) {
			formData.append(`clips[${index}].mimeType`, clip.mimeType);
		}
		if (clip.blob) {
			formData.append(`clips[${index}].blob`, clip.blob);
		}
	});
	if (movie.videoURL) {
		formData.append('videoURL', movie.videoURL);
	}
	if (movie.videoBlob) {
		formData.append('videoBlob', movie.videoBlob);
	}
	formData.append('durationSec', movie.durationSec.toString());
	return formData;
}

export function formDataToMovie(formData: FormData): MovieCommand {
	const movie: MovieCommand = {
		id: formData.get('id') as string,
		title: formData.get('title') as string,
		description: formData.get('description') as string,
		scenarioId: formData.get('scenarioId') as string,
		actors: [],
		clips: [],
		videoURL: formData.get('videoURL') as string,
		videoBlob: formData.get('videoBlob') as Blob,
		durationSec: parseInt(formData.get('durationSec') as string, 10)
	};
	const actorCount = parseInt(formData.get('actors.length') as string, 10);
	for (let i = 0; i < actorCount; i++) {
		movie.actors.push(formData.get(`actors[${i}]`) as string);
	}
	const clipCount = parseInt(formData.get('clips.length') as string, 10);
	for (let i = 0; i < clipCount; i++) {
		const actorStr = formData.get(`clips[${i}].actor`) as string;
		const durationSecStr = formData.get(`clips[${i}].durationSec`) as string;
		const clip: MovieClipCommand = {
			actor: actorStr ? parseInt(actorStr, 10) : null,
			durationSec: durationSecStr ? parseInt(durationSecStr, 10) : 0,
			description: formData.get(`clips[${i}].description`) as string,
			url: formData.get(`clips[${i}].url`) as string,
			mimeType: formData.get(`clips[${i}].mimeType`) as string,
			blob: formData.get(`clips[${i}].blob`) as Blob
		};
		movie.clips.push(clip);
	}
	return movie;
}

export function scenarioToFormData(scenario: ScenarioUpdate): FormData {
	const formData = new FormData();
	formData.append('id', scenario.id);
	formData.append('title', scenario.title);
	formData.append('description', scenario.description);
	if (scenario.previewURL) {
		formData.append('previewURL', scenario.previewURL);
	}
	if (scenario.previewFile) {
		formData.append('previewFile', scenario.previewFile);
	}
	// attachments array
	formData.append('attachments.length', scenario.attachments.length.toString());
	scenario.attachments.forEach((attachment, index) => {
		formData.append(`attachments[${index}].id`, attachment.id);
		formData.append(`attachments[${index}].title`, attachment.title);
		if (attachment.url) {
			formData.append(`attachments[${index}].url`, attachment.url);
		}
		if (attachment.file) {
			formData.append(`attachments[${index}].file`, attachment.file);
		}
	});
	formData.append('actors.length', scenario.actors.length.toString());
	scenario.actors.forEach((actor, index) => {
		formData.append(`actors[${index}]`, actor);
	});
	formData.append('scenes.length', scenario.scenes.length.toString());
	scenario.scenes.forEach((scene, index) => {
		formData.append(`scenes[${index}].description`, scene.description);
		if (typeof scene.actor === 'number') {
			formData.append(`scenes[${index}].actor`, scene.actor.toString());
		}
	});
	return formData;
}

export function formDataToScenario(formData: FormData): ScenarioUpdate {
	const scenario: ScenarioUpdate = {
		id: formData.get('id') as string,
		title: formData.get('title') as string,
		description: formData.get('description') as string,
		previewURL: formData.get('previewURL') as string,
		previewFile: formData.get('previewFile') as File,
		attachments: [],
		actors: [],
		scenes: []
	};
	const attachmentCount = parseInt(formData.get('attachments.length') as string, 10);
	for (let i = 0; i < attachmentCount; i++) {
		const id = formData.get(`attachments[${i}].id`) as string;
		const url = formData.get(`attachments[${i}].url`) as string;
		const title = formData.get(`attachments[${i}].title`) as string;
		const file = formData.get(`attachments[${i}].file`) as File;
		scenario.attachments.push({ id, title, url, file });
	}
	const actorCount = parseInt(formData.get('actors.length') as string, 10);
	for (let i = 0; i < actorCount; i++) {
		scenario.actors.push(formData.get(`actors[${i}]`) as string);
	}
	const sceneCount = parseInt(formData.get('scenes.length') as string, 10);
	for (let i = 0; i < sceneCount; i++) {
		const description = formData.get(`scenes[${i}].description`) as string;
		const actorStr = formData.get(`scenes[${i}].actor`) as string;
		const scene: ScenarioUpdate['scenes'][number] = {
			description,
			actor: actorStr ? parseInt(actorStr, 10) : null
		};
		scenario.scenes.push(scene);
	}
	return scenario;
}
