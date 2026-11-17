import { getDb, uuid } from './db.js';

export function audit(actorId: string | undefined, action: string, entityType: string, entityId: string | null, metadata?: unknown) {
  getDb()
    .prepare('INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata) VALUES (?,?,?,?,?,?)')
    .run(uuid(), actorId ?? null, action, entityType, entityId, metadata === undefined ? null : JSON.stringify(metadata));
}
