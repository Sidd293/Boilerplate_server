export interface UserRecord {
  id: string;
  email: string | null;
  phone: string | null;
  passwordHash: string | null;
  createdAt: Date;
}

export interface ActionRecord {
  id: string;
  userId: string;
  type: string;
  payload: unknown | null;
  createdAt: Date;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  findByPhone(phone: string): Promise<UserRecord | null>;
  findById(id: string): Promise<UserRecord | null>;
  create(input: {
    email?: string | null;
    phone?: string | null;
    passwordHash?: string | null;
  }): Promise<UserRecord>;
  updatePassword(id: string, passwordHash: string | null): Promise<UserRecord>;
}

export interface ActionRepository {
  create(input: { userId: string; type: string; payload?: unknown | null }): Promise<ActionRecord>;
}

export type OtpPurpose = 'SIGNUP' | 'LOGIN' | 'RESET';
export type OtpChannel = 'email' | 'phone';

export interface OtpRecord {
  id: string;
  identifier: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  codeHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  userId: string | null;
}

export interface OtpRepository {
  create(input: {
    identifier: string;
    channel: OtpChannel;
    purpose: OtpPurpose;
    codeHash: string;
    expiresAt: Date;
    userId?: string | null;
  }): Promise<OtpRecord>;
  findLatestActive(input: {
    identifier: string;
    purpose: OtpPurpose;
    now: Date;
  }): Promise<OtpRecord | null>;
  markConsumed(id: string, consumedAt: Date): Promise<void>;
}

export interface DatabaseProvider {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  users: UserRepository;
  actions: ActionRepository;
  otps: OtpRepository;
}
