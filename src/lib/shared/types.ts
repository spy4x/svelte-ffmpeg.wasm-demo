import { generateRandomString } from 'lucia-auth';
import { z, type ZodTypeAny } from 'zod';
import { getRandomString } from './helpers';

// #region Common

// #region Errors
export const VALIDATION_ERROR_CODE = 'VALIDATION_ERROR';
export const SERVER_ERROR = 'SERVER_ERROR';
export const UNKNOWN_ERROR = 'UNKNOWN_ERROR';
export const UPLOAD_ERROR = 'UPLOAD_ERROR';
export interface UIError {
  code: string;
  message: string;
}
export interface RequestError extends UIError {
  code: typeof SERVER_ERROR | typeof UNKNOWN_ERROR | typeof UPLOAD_ERROR;
  body?: any;
}

export interface ValidationError<T extends ZodTypeAny> extends UIError {
  code: typeof VALIDATION_ERROR_CODE;
  errors: z.inferFlattenedErrors<T>['fieldErrors'];
}
// #endregion

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
  SUCCESS = 'SUCCESS',
}

export enum EntityOperationType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export interface AsyncOperation<P, E> {
  type: EntityOperationType;
  payload: P;
  status: AsyncOperationStatus;
  error: null | E;
}
// #endregion

// #region Auth
export const AuthEmailPasswordSchema = z.object({
  email: z.string().email().max(50),
  password: z.string().min(8).max(50),
});
// #endregion

// #region Scenario
export enum ScenarioAccess {
  SHARED = 'SHARED',
  PRIVATE = 'PRIVATE',
}

export const AttachmentSchema = z.object({
  id: z.string().default(() => getRandomString()),
  title: z
    .string()
    .default('')
    .transform(val => {
      // limit string to 50 symbols max
      const str = val.trim();
      if (str.length > 50) {
        return str.slice(0, 50);
      }
      return str;
    }),
  url: z.string().nullable().default(null),
  mimeType: z.string().max(30).nullable().default(null),
});

export const AttachmentCommandSchema = AttachmentSchema.extend({
  path: z.string().max(200).nullable().default(null),
});

export const AttachmentVMSchema = AttachmentCommandSchema.extend({
  file: z.instanceof(File).nullable().default(null),
});
export type AttachmentVM = z.infer<typeof AttachmentVMSchema>;

export const SceneSchema = z.object({
  description: z.string().max(1000).default(''),
  actor: z.number().nullable().default(null),
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
  updatedAt: z.coerce.date().default(() => new Date()),
});

export const ScenarioCommandSchema = ScenarioSchema.extend({
  previewPath: z.string().max(200).nullable().default(null),
  attachments: z.array(AttachmentCommandSchema).default([]),
});

export const ScenarioVMSchema = ScenarioCommandSchema.extend({
  previewFile: z.instanceof(File).nullable().default(null),
  attachments: z.array(AttachmentVMSchema).default([]),
});
export type ScenarioVM = z.infer<typeof ScenarioVMSchema>;

export type ScenarioDelete = string;
// #endregion

// #region Movie
export enum VideoStatus {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  FINISHED = 'FINISHED',
}

export const ClipSchema = z.object({
  id: z.string().default(() => getRandomString()),
  actor: z.number().nullable().default(null),
  description: z.string().default(''),
  durationSec: z
    .number()
    .transform(val => Math.trunc(val))
    .default(0),
  url: z.string().url().max(400).nullable().default(null),
  path: z.string().max(200).nullable().default(null),
  mimeType: z.string().max(30).nullable().default(null),
});

export const ClipCommandSchema = ClipSchema.extend({});

export const ClipVMSchema = ClipCommandSchema.extend({
  status: z.nativeEnum(VideoStatus).default(VideoStatus.IDLE),
  file: z.instanceof(Blob).nullable().default(null),
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
  videoPath: z.string().max(200).nullable().default(null),
  durationSec: z
    .number()
    .transform(val => Math.trunc(val))
    .default(0),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export const MovieCommandSchema = MovieSchema.extend({
  clips: z.array(ClipCommandSchema).default([]),
});
export type MovieCommand = z.infer<typeof MovieCommandSchema>;

export const MovieVMSchema = MovieCommandSchema.extend({
  clips: z.array(ClipVMSchema).default([]),
});
export type MovieVM = z.infer<typeof MovieVMSchema>;

export type MovieDelete = string;
// #endregion
