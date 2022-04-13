import t from 'tap';

import { makeAssertAccessTokenScope } from '../../../src/use-cases/access-token-scope';

t.test('assert access token scope', (t) => {
  t.plan(2);

  t.test('requested scope within the supported scopes', (t) => {
    t.plan(1);

    const scopes = ['api:read', 'api:write', 'api:delete'];
    const scope = 'api:read api:write';

    const { assertAccessTokenScope } = makeAssertAccessTokenScope({ scopes });

    t.doesNotThrow(() => assertAccessTokenScope(scope));
  });

  t.test('requested scope outside the supported scopes', (t) => {
    t.plan(1);

    const scopes = ['api:read'];
    const scope = 'api:read api:write';

    const { assertAccessTokenScope } = makeAssertAccessTokenScope({ scopes });

    t.throws(() => assertAccessTokenScope(scope), { error: 'invalid_scope' });
  });
});
