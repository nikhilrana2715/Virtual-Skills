import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { DuplicateError } from '../database/resourceRepo.js';
import { ProviderError } from '../providers/types.js';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (err instanceof DuplicateError) {
    return res.status(409).json({ error: `Duplicate of existing resource "${err.existing.name}"`, existing: err.existing });
  }
  if (err instanceof ProviderError) return res.status(err.status).json({ error: err.message, code: err.code });
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err && typeof err === 'object' && 'type' in err && (err as { type: string }).type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
