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
	attachments: z.array(
		z.object({
			title: z.string(),
			url: z.string(),
			mimeType: z.enum([
				'image/png',
				'image/jpeg',
				'application/pdf',
				'video/mp4',
				'image/webp',
				'video/webm'
			]),
			md5: z.string()
		})
	),
	actors: z.array(z.string()),
	scenes: z.array(
		z.object({
			description: z.string(),
			actor: z.number().optional()
		})
	)
});
export type ScenarioCreate = z.infer<typeof ScenarioCreateSchema>;

export const ScenarioUpdateSchema = ScenarioCreateSchema.extend({});
export type ScenarioUpdate = z.infer<typeof ScenarioUpdateSchema>;

export type ScenarioDelete = string;

export const MovieCreateSchema = z.object({
	id: z.string(),
	title: z.string(),
	scenarioId: z.string().min(15).max(15).optional(),
	actors: z.array(z.string()),
	clips: z.array(
		z.object({
			actor: z.number().optional(),
			description: z.string(),
			url: z.string().max(400).optional(),
			mimeType: z.enum(['video/mp4', 'video/webm']).optional(),
			md5: z.string().min(32).max(32).optional(),
			format: z.enum(['mp4', 'webm']).optional(),
			status: z.nativeEnum(VideoStatus),
			blob: z.instanceof(Blob).optional()
		})
	),
	videoURL: z.string().max(400).optional(),
	videoMD5: z.string().min(32).max(32).optional(),
	durationSec: z.number()
});
export type MovieCreate = z.infer<typeof MovieCreateSchema>;

export const MovieUpdateSchema = MovieCreateSchema.extend({});
export type MovieUpdate = z.infer<typeof MovieUpdateSchema>;

export type MovieDelete = string;

export interface ResponseList<T> {
	data: T[];
	total: number;
	page: number;
	perPage: number;
}
