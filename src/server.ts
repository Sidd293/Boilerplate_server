import http from 'http';
import { App } from './app.js';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';

export class Server {
  private httpServer?: http.Server;
  private isShuttingDown = false;

  constructor(private readonly app: App) {}

  async start(): Promise<void> {
    await this.app.init();

    this.httpServer = http.createServer(this.app.getExpressApp());

    await new Promise<void>((resolve) => {
      this.httpServer?.listen(config.port, resolve);
    });

    logger.info({ port: config.port }, 'Server started');
    this.registerProcessHandlers();
  }

  private registerProcessHandlers(): void {
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Unhandled promise rejection');
      process.exit(1);
    });
    process.on('uncaughtException', (error) => {
      logger.error({ error }, 'Uncaught exception');
      process.exit(1);
    });
  }

  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;

    logger.info({ signal }, 'Shutting down');

    if (this.httpServer) {
      await new Promise<void>((resolve) => this.httpServer?.close(() => resolve()));
    }

    await this.app.shutdown();
    process.exit(0);
  }
}

const server = new Server(new App());
server.start().catch((error) => {
  logger.error({ error }, 'Failed to start server');
  process.exit(1);
});
