import { building } from '$app/environment';
import { Prisma, PrismaClient } from '@prisma/client';

// import { PrismaError } from 'prisma-error-enum';

export class PrismaService extends PrismaClient {
	constructor() {
		super({
			log: [
				{ level: 'query', emit: 'event' },
				{ level: 'info', emit: 'stdout' },
				{ level: 'warn', emit: 'stdout' },
				{ level: 'error', emit: 'stdout' }
			]
		});
		this.initLogging();
		// this.trackConnectionIssues();
		if (!building) {
			this.$connect();
		}
	}

	// async onModuleInit(): Promise<void> {
	// 	await this.$connect();
	// }

	// async onModuleDestroy(): Promise<void> {
	// 	await this.$disconnect();
	// }

	// // https://docs.nestjs.com/recipes/prisma#issues-with-enableshutdownhooks
	// enableShutdownHooks(app: INestApplication): void {
	// 	// eslint-disable-next-line @typescript-eslint/no-misused-promises
	// 	this.$on('beforeExit', async (): Promise<void> => {
	// 		await app.close();
	// 	});
	// }

	private initLogging(): void {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		this.$on('query', (e: Prisma.QueryEvent) => {
			console.log(`Query. Duration: ${e.duration}ms`, {
				query: e.query,
				params: e.params
			});
		});
	}

	// private trackConnectionIssues(): void {
	// 	// Handle database connection issues - kill instance if connection is lost
	// 	this.$use(
	// 		async (
	// 			params: Prisma.MiddlewareParams,
	// 			next: (params: Prisma.MiddlewareParams) => Promise<unknown>
	// 		): Promise<unknown> => {
	// 			try {
	// 				return await next(params);
	// 			} catch (error: unknown) {
	// 				if (error instanceof Error) {
	// 					let reasonForTermination = '';

	// 					if (error instanceof Prisma.PrismaClientInitializationError) {
	// 						reasonForTermination = 'PrismaClientInitializationError';
	// 					}
	// 					if (error instanceof Prisma.PrismaClientRustPanicError) {
	// 						reasonForTermination = 'PrismaClientRustPanicError';
	// 					}
	// 					if (error instanceof Prisma.PrismaClientKnownRequestError) {
	// 						if (error.code === PrismaError.CouldNotConnectToDatabase) {
	// 							reasonForTermination = 'Database connection error';
	// 						}
	// 						if (error.code === PrismaError.ConnectionTimedOut) {
	// 							reasonForTermination = 'Database connection timed out';
	// 						}
	// 					}
	// 					if (reasonForTermination) {
	// 						this.logService.error({
	// 							message: `FATAL: ${reasonForTermination}. Terminating instance...`,
	// 							error
	// 						});
	// 						process.exit(ONE); // exit with failure
	// 					}
	// 				}
	// 				throw error;
	// 			}
	// 		}
	// 	);
	// }
}

export const prisma = new PrismaService();
