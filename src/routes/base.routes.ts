import { Router } from 'express';

export abstract class BaseRoutes {
  public readonly router: Router;

  constructor() {
    this.router = Router();
  }

  abstract register(): Router;
}
