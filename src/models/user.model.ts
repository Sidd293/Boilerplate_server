export class User {
  constructor(
    public readonly id: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly createdAt: Date
  ) {}
}
