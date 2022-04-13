import t from 'tap';

import { seconds } from '../../../src/utils';

t.test('seconds', (t) => {
  t.plan(5);

  t.test('invalid time period format', (t) => {
    t.plan(1);

    t.throws(() => seconds('-1s'));
  });

  t.test('seconds to seconds', (t) => {
    t.plan(1);

    t.equal(seconds('1s'), 1);
  });

  t.test('minutes to seconds', (t) => {
    t.plan(1);

    t.equal(seconds('1m'), 60);
  });

  t.test('hours to seconds', (t) => {
    t.plan(1);

    t.equal(seconds('1h'), 3600);
  });

  t.test('days to seconds', (t) => {
    t.plan(1);

    t.equal(seconds('1d'), 86400);
  });
});
