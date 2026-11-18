// Checks every external URL in src/data/apps.json and src/data/resources.json.
// Sets `verified: true|false` on apps, courses and cheat sheets and prints a report.
// Usage: npm run verify-links -w frontend
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/data/', import.meta.url));
const UA = 'Mozilla/5.0 (compatible; VirtualSkillsLinkCheck/1.0)';

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
      // 2xx/3xx = reachable. 401/403/429 usually = bot protection on a live site; count as reachable but flag.
      if (res.ok) return { ok: true, status: res.status, final: res.url };
      if (method === 'GET') return { ok: [401, 403, 429].includes(res.status), status: res.status, final: res.url, soft: true };
    } catch (e) {
      if (method === 'GET') return { ok: false, status: String(e.cause?.code ?? e.name) };
    }
  }
}

async function run(file, collect) {
  const path = root + file;
  const data = JSON.parse(await readFile(path, 'utf8'));
  const entries = collect(data);
  const results = await Promise.all(entries.map(async (e) => ({ e, r: await check(e.url) })));
  for (const { e, r } of results) {
    e.verified = r.ok;
    const flag = r.ok ? (r.soft ? 'WARN' : ' OK ') : 'FAIL';
    const moved = r.final && r.final.replace(/\/$/, '') !== e.url.replace(/\/$/, '') ? `  -> ${r.final}` : '';
    console.log(`[${flag}] ${r.status}  ${e.url}${moved}`);
  }
  await writeFile(path, JSON.stringify(data, null, 2) + '\n');
  return results.filter((x) => !x.r.ok).length;
}

const failed =
  (await run('apps.json', (d) => d.apps)) +
  (await run('resources.json', (d) => d.topics.flatMap((t) => [...t.courses, ...t.cheatSheets])));
console.log(failed ? `\n${failed} URL(s) failed — marked verified:false` : '\nAll URLs reachable.');
