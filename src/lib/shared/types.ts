import { z } from 'zod';

export enum AsyncOperationStatus {
	IDLE = 'IDLE',
	IN_PROGRESS = 'IN_PROGRESS',
	ERROR = 'ERROR',
	SUCCESS = 'SUCCESS'
}

export enum EntityOperationType {
	CREATE = 'CREATE',
	UPDATE = 'UPDATE',
	DELETE = 'DELETE'
}

export enum VideoStatus {
	IDLE = 'IDLE',
	RECORDING = 'RECORDING',
	PROCESSING = 'PROCESSING',
	FINISHED = 'FINISHED'
}

export const ScenarioCreateSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	previewURL: z.string().max(400).nullable().optional(),
	previewFile: z.instanceof(File).nullable().optional(),
	attachments: z.array(
		z.object({
			id: z.string().min(15).max(15),
			title: z.string().max(50),
			url: z.string().nullable().optional(),
			file: z.instanceof(File).nullable().optional()
		})
	),
	actors: z.array(z.string()),
	scenes: z.array(
		z.object({
			description: z.string(),
			actor: z.number().optional().nullable()
		})
	)
});
export type ScenarioCreate = z.infer<typeof ScenarioCreateSchema>;

export const ScenarioUpdateSchema = ScenarioCreateSchema.extend({});
export type ScenarioUpdate = z.infer<typeof ScenarioUpdateSchema>;

export type ScenarioDelete = string;

export interface MovieClipModel {
	actor: null | number;
	description: string;
	durationSec: number;
	url: null | string;
	mimeType: null | string;
}

export interface MovieModel {
	id: string;
	title: string;
	description: string;
	scenarioId: null | string;
	actors: string[];
	clips: MovieClipModel[];
	videoURL: null | string;
	durationSec: number;
}

export interface MovieClipCommand extends MovieClipModel {
	blob: null | Blob;
}

export interface MovieCommand extends MovieModel {
	clips: MovieClipCommand[];
	videoBlob: null | Blob;
}

export interface MovieClipVM extends MovieClipCommand {
	status: VideoStatus;
}

export interface MovieVM extends MovieCommand {
	clips: MovieClipVM[];
}

// export const MovieCreateSchema = z.object({
// 	id: z.string(),
// 	title: z.string(),
// 	scenarioId: z.string().min(15).max(15).optional(),
// 	actors: z.array(z.string()),
// 	clips: z.array(
// 		z.object({
// 			actor: z.number().optional(),
// 			description: z.string(),
// 			url: z.string().max(400).optional(),
// 			base64: z.string().optional(),
// 			mimeType: z.enum(['video/mp4', 'video/webm']).optional(),
// 			md5: z.string().min(32).max(32).optional(),
// 			format: z.enum(['mp4', 'webm']).optional(),
// 			status: z.nativeEnum(VideoStatus),
// 			blob: z.instanceof(Blob).optional()
// 		})
// 	),
// 	videoURL: z.string().max(400).nullable(),
// 	videoMD5: z.string().min(32).max(32).nullable(),
// 	durationSec: z.number()
// });
// export type MovieCreate = z.infer<typeof MovieCreateSchema>;

// export const MovieUpdateSchema = MovieCreateSchema.extend({
// 	clips: MovieCreateSchema.shape.clips.
// });
// export type MovieUpdate = z.infer<typeof MovieUpdateSchema>;

export type MovieDelete = string;

export interface ResponseList<T> {
	data: T[];
	total: number;
	page: number;
	perPage: number;
}
