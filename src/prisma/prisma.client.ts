import { PrismaClient } from '@prisma/client';

export class PrismaClientFactory {
  private static client: PrismaClient | null = null;

  static getClient(): PrismaClient {
    if (!PrismaClientFactory.client) {
      PrismaClientFactory.client = new PrismaClient({
        log: ['error', 'warn']
      });
    }
    return PrismaClientFactory.client;
  }
}
