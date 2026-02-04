export class Action {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly payload: unknown | null,
    public readonly createdAt: Date
  ) {}
}
