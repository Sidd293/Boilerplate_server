import type { Prisma, PrismaClient } from '@prisma/client';
import { PrismaClientFactory } from '../../prisma/prisma.client.js';
import type {
  ActionRecord,
  ActionRepository,
  DatabaseProvider,
  OtpChannel,
  OtpPurpose,
  OtpRecord,
  OtpRepository,
  UserRecord,
  UserRepository
} from '../../types/database.js';

class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { email }
    });
  }

  async findByPhone(phone: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { phone }
    });
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id }
    });
  }

  async create(input: {
    email?: string | null;
    phone?: string | null;
    passwordHash?: string | null;
  }): Promise<UserRecord> {
    return this.prisma.user.create({
      data: {
        email: input.email ?? null,
        phone: input.phone ?? null,
        passwordHash: input.passwordHash ?? null
      }
    });
  }

  async updatePassword(id: string, passwordHash: string | null): Promise<UserRecord> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
  }
}

class PrismaActionRepository implements ActionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: {
    userId: string;
    type: string;
    payload?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
  }): Promise<ActionRecord> {
    const data: Prisma.ActionUncheckedCreateInput = {
      userId: input.userId,
      type: input.type,
      ...(input.payload !== undefined ? { payload: input.payload } : {})
    };

    return this.prisma.action.create({
      data
    });
  }
}

class PrismaOtpRepository implements OtpRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: {
    identifier: string;
    channel: OtpChannel;
    purpose: OtpPurpose;
    codeHash: string;
    expiresAt: Date;
    userId?: string | null;
  }): Promise<OtpRecord> {
    return this.prisma.otpCode.create({
      data: {
        identifier: input.identifier,
        channel: input.channel,
        purpose: input.purpose,
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
        userId: input.userId ?? null
      }
    });
  }

  async findLatestActive(input: {
    identifier: string;
    purpose: OtpPurpose;
    now: Date;
  }): Promise<OtpRecord | null> {
    return this.prisma.otpCode.findFirst({
      where: {
        identifier: input.identifier,
        purpose: input.purpose,
        consumedAt: null,
        expiresAt: { gt: input.now }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async markConsumed(id: string, consumedAt: Date): Promise<void> {
    await this.prisma.otpCode.update({
      where: { id },
      data: { consumedAt }
    });
  }
}

export class PostgresDatabase implements DatabaseProvider {
  private readonly prisma: PrismaClient;
  public readonly users: UserRepository;
  public readonly actions: ActionRepository;
  public readonly otps: OtpRepository;

  constructor() {
    this.prisma = PrismaClientFactory.getClient();
    this.users = new PrismaUserRepository(this.prisma);
    this.actions = new PrismaActionRepository(this.prisma);
    this.otps = new PrismaOtpRepository(this.prisma);
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
    await this.prisma.$queryRaw`SELECT 1`;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
