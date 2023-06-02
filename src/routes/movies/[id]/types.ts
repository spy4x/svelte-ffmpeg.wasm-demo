export enum VideoStatus {
	IDLE = 'IDLE',
	RECORDING = 'RECORDING',
	PROCESSING = 'PROCESSING',
	FINISHED = 'FINISHED'
}

export interface Video {
	id: string;
	format: string;
	status: VideoStatus;
	url?: string;
	blob?: Blob;
}
