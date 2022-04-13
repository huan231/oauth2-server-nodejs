import t from 'tap';
import request from 'supertest';

import { makeApp } from './test-utils';

t.test('no cache', (t) => {
  t.plan(1);

  const app = makeApp();

  t.test('access token response no cache', async (t) => {
    t.plan(2);

    const res = await request(app).post('/token');

    t.equal(res.headers['cache-control'], 'no-store');
    t.equal(res.headers['pragma'], 'no-cache');
  });
});
