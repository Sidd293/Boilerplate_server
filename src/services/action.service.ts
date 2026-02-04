import { Action } from '../models/action.model.js';
import type { ActionRepository } from '../types/database.js';

export class ActionService {
  constructor(private readonly actions: ActionRepository) {}

  async createAction(input: { userId: string; type: string; payload?: unknown | null }): Promise<Action> {
    const created = await this.actions.create({
      userId: input.userId,
      type: input.type,
      payload: input.payload ?? null
    });

    return new Action(
      created.id,
      created.userId,
      created.type,
      created.payload ?? null,
      created.createdAt
    );
  }
}
