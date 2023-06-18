import { z } from 'zod';
import { getRandomString } from './helpers';
import { generateRandomString } from 'lucia-auth';

// #region Common
export interface ResponseList<T> {
	data: T[];
	total: number;
	page: number;
	perPage: number;
}

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
// #endregion

// #region Scenario
export enum ScenarioAccess {
	SHARED = 'SHARED',
	PRIVATE = 'PRIVATE'
}

export const AttachmentSchema = z.object({
	id: z.string().default(() => getRandomString()),
	title: z
		.string()
		.default('')
		.transform((val) => {
			// limit string to 50 symbols max
			const str = val.trim();
			if (str.length > 50) {
				return str.slice(0, 50);
			}
			return str;
		}),
	url: z.string().nullable().default(null),
	mimeType: z.string().max(30).nullable().default(null)
});

export const AttachmentCommandSchema = AttachmentSchema.extend({
	path: z.string().max(200).nullable().default(null)
});

export const AttachmentVMSchema = AttachmentCommandSchema.extend({
	file: z.instanceof(File).nullable().default(null)
});
export type AttachmentVM = z.infer<typeof AttachmentVMSchema>;

export const SceneSchema = z.object({
	description: z
		.string()
		.default('')
		.transform((val) => {
			// limit string to 1000 symbols max
			const str = val.trim();
			if (str.length > 1000) {
				return str.slice(0, 1000);
			}
			return str;
		}),
	actor: z.number().nullable().default(null)
});

export const ScenarioSchema = z.object({
	id: z.string().default(() => generateRandomString(15)),
	userId: z.string().length(15).default(''),
	access: z.nativeEnum(ScenarioAccess).default(ScenarioAccess.PRIVATE),
	title: z.string().max(50).default(''),
	description: z.string().max(1000).default(''),
	previewURL: z.string().max(400).nullable().default(null),
	attachments: z.array(AttachmentSchema).default([]),
	actors: z.array(z.string().max(30)).default([]),
	scenes: z.array(SceneSchema).default([]),
	createdAt: z.coerce.date().default(() => new Date()),
	updatedAt: z.coerce.date().default(() => new Date())
});

export const ScenarioCommandSchema = ScenarioSchema.extend({
	previewPath: z.string().max(200).nullable().default(null),
	attachments: z.array(AttachmentCommandSchema).default([])
});

export const ScenarioVMSchema = ScenarioCommandSchema.extend({
	previewFile: z.instanceof(File).nullable().default(null),
	attachments: z.array(AttachmentVMSchema).default([])
});
export type ScenarioVM = z.infer<typeof ScenarioVMSchema>;

export type ScenarioDelete = string;
// #endregion

// #region Movie
export enum VideoStatus {
	IDLE = 'IDLE',
	RECORDING = 'RECORDING',
	PROCESSING = 'PROCESSING',
	FINISHED = 'FINISHED'
}

export const ClipSchema = z.object({
	id: z.string().default(() => getRandomString()),
	actor: z.number().nullable().default(null),
	description: z.string().default(''),
	durationSec: z
		.number()
		.transform((val) => Math.trunc(val))
		.default(0),
	url: z.string().url().max(400).nullable().default(null),
	mimeType: z.string().max(30).nullable().default(null)
});

export const ClipCommandSchema = ClipSchema.extend({
	path: z.string().max(200).nullable().default(null)
});

export const ClipVMSchema = ClipCommandSchema.extend({
	status: z.nativeEnum(VideoStatus).default(VideoStatus.IDLE),
	file: z.instanceof(Blob).nullable().default(null)
});
export type ClipVM = z.infer<typeof ClipVMSchema>;

export const MovieSchema = z.object({
	id: z.string().default(() => generateRandomString(15)),
	userId: z.string().length(15).default(''),
	title: z.string().default(''),
	description: z.string().default(''),
	scenarioId: z.string().length(15).nullable().default(null),
	actors: z.array(z.string().max(50)).default([]),
	clips: z.array(ClipSchema).default([]),
	videoURL: z.string().url().max(400).nullable().default(null),
	durationSec: z
		.number()
		.transform((val) => Math.trunc(val))
		.default(0),
	createdAt: z.coerce.date().default(() => new Date()),
	updatedAt: z.coerce.date().default(() => new Date())
});

export const MovieCommandSchema = MovieSchema.extend({
	clips: z.array(ClipCommandSchema).default([]),
	videoPath: z.string().max(200).nullable().default(null)
});
export type MovieCommand = z.infer<typeof MovieCommandSchema>;

export const MovieVMSchema = MovieCommandSchema.extend({
	clips: z.array(ClipVMSchema).default([]),
	videoFile: z.instanceof(Blob).nullable().default(null)
});
export type MovieVM = z.infer<typeof MovieVMSchema>;

export type MovieDelete = string;
// #endregion
