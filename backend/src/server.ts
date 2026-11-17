import { createApp } from './app.js';
import { env } from './config/env.js';
import { getDb } from './database/db.js';
import { startScheduler } from './jobs/sync.js';

getDb();
const app = createApp();
app.listen(env.port, () => {
  console.log(`Virtual Skills API → http://localhost:${env.port}`);
  if (process.env.DISABLE_SYNC !== '1') startScheduler();
});
