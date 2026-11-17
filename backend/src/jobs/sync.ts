import { getDb, now, uuid } from '../database/db.js';
import { updateResource } from '../database/resourceRepo.js';
import { githubProvider } from '../providers/github/github.js';
import { ProviderError, type NormalizedResource } from '../providers/types.js';

let running = false;

export function metadataPatch(n: NormalizedResource) {
  return {
    stars: n.stars,
    forks: n.forks,
    openIssues: n.openIssues,
    language: n.language,
    licenseSpdx: n.licenseSpdx,
    licenseUrl: n.licenseUrl,
    topics: n.topics,
    archivedBySource: n.archived,
    lastCommitAt: n.lastCommitAt,
    cloneUrl: n.cloneUrl,
    downloadUrl: n.downloadUrl,
    providerResourceId: n.providerResourceId,
    lastSyncedAt: now(),
    syncError: null,
  };
}

/**
 * Refresh GitHub metadata. Stale = never synced or older than `staleHours`.
 * Stops early on rate limit (no hammering). Records a sync_jobs row.
 */
export async function runGithubSync(opts: { staleHours?: number; max?: number; resourceIds?: string[] } = {}) {
  if (running) return { skipped: true as const, reason: 'Sync already running' };
  running = true;
  const db = getDb();
  const jobId = uuid();
  db.prepare(`INSERT INTO sync_jobs (id, provider, kind, status, started_at) VALUES (?, 'github', 'metadata_refresh', 'running', ?)`).run(
    jobId,
    now(),
  );
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];
  try {
    const cutoff = new Date(Date.now() - (opts.staleHours ?? 24) * 3600_000).toISOString();
    const rows = (
      opts.resourceIds?.length
        ? db
            .prepare(`SELECT id, name, source_url, provider_resource_id FROM resources WHERE provider='github' AND id IN (${opts.resourceIds.map(() => '?').join(',')})`)
            .all(...opts.resourceIds)
        : db
            .prepare(
              `SELECT id, name, source_url, provider_resource_id FROM resources
               WHERE provider='github' AND publication_status != 'archived' AND (last_synced_at IS NULL OR last_synced_at < ?)
               ORDER BY last_synced_at IS NOT NULL, last_synced_at LIMIT ?`,
            )
            .all(cutoff, opts.max ?? 50)
    ) as { id: string; name: string; source_url: string; provider_resource_id: string | null }[];

    for (const r of rows) {
      try {
        const n = r.provider_resource_id
          ? await githubProvider.fetchById(r.provider_resource_id)
          : await githubProvider.fetchResource(r.source_url);
        updateResource(r.id, metadataPatch(n));
        processed++;
      } catch (e) {
        failed++;
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`${r.name}: ${msg}`);
        updateResource(r.id, { syncError: msg.slice(0, 300) });
        if (e instanceof ProviderError && e.code === 'rate_limited') break;
      }
    }
    const status = failed === 0 ? 'succeeded' : processed === 0 ? 'failed' : 'partial';
    db.prepare(`UPDATE sync_jobs SET status=?, finished_at=?, items_processed=?, items_failed=?, error_summary=? WHERE id=?`).run(
      status,
      now(),
      processed,
      failed,
      errors.length ? errors.slice(0, 10).join('\n') : null,
      jobId,
    );
    return { skipped: false as const, jobId, status, processed, failed };
  } catch (e) {
    db.prepare(`UPDATE sync_jobs SET status='failed', finished_at=?, error_summary=? WHERE id=?`).run(now(), String(e), jobId);
    throw e;
  } finally {
    running = false;
  }
}

/** Simple in-process scheduler (MVP). Swap for BullMQ/cron worker later. */
export function startScheduler(intervalHours = 6) {
  const tick = () => runGithubSync({ staleHours: 24, max: 40 }).catch((e) => console.error('[sync]', e));
  setTimeout(tick, 15_000).unref();
  setInterval(tick, intervalHours * 3600_000).unref();
}
