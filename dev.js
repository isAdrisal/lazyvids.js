import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';

const app = new Hono();

app.use('/*', serveStatic({ root: './dev' }));

serve(app, (info) => {
  console.log('\x1b[32m%s\x1b[0m', `Serving on http://localhost:${info.port}`);
});
