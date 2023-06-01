import { z } from 'zod';

export enum AsyncOperationStatus {
	IDLE = 'IDLE',
	IN_PROGRESS = 'IN_PROGRESS',
	ERROR = 'ERROR',
	SUCCESS = 'SUCCESS'
}

export const ScenarioCreateSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	attachments: z.array(
		z.object({
			title: z.string(),
			url: z.string(),
			// png, jpeg, pdf, mp4, webp, webm
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

export interface ResponseList<T> {
	data: T[];
	total: number;
	page: number;
	perPage: number;
}
