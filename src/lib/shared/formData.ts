import type { MovieClipCommand, MovieCommand } from './types';

export function movieToFormData(movie: MovieCommand): FormData {
	const formData = new FormData();
	formData.append('id', movie.id);
	formData.append('title', movie.title);
	if (movie.scenarioId) {
		formData.append('scenarioId', movie.scenarioId);
	}
	formData.append('actors.length', movie.actors.length.toString());
	movie.actors.forEach((actor, index) => {
		formData.append(`actors[${index}]`, actor);
	});
	formData.append('clips.length', movie.clips.length.toString());
	movie.clips.forEach((clip, index) => {
		if (clip.actor) {
			formData.append(`clips[${index}].actor`, clip.actor.toString());
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
		let actor: number | null = null;
		if (actorStr) {
			actor = parseInt(actorStr, 10);
		}
		const clip: MovieClipCommand = {
			actor,
			description: formData.get(`clips[${i}].description`) as string,
			url: formData.get(`clips[${i}].url`) as string,
			mimeType: formData.get(`clips[${i}].mimeType`) as string,
			blob: formData.get(`clips[${i}].blob`) as Blob
		};
		movie.clips.push(clip);
	}
	return movie;
}
