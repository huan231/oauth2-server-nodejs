import t from 'tap';

import { decodeFormURLComponent } from '../../../src/utils';

t.test('decode x-www-form-urlencoded component', (t) => {
  t.plan(2);

  t.test('reserved characters', (t) => {
    t.plan(1);

    const encodedFormURLComponent = '%3B%2C%2F%3F%3A%40%26%3D%2B%24';

    const decodedFormURLComponent = decodeFormURLComponent(encodedFormURLComponent);

    t.equal(decodedFormURLComponent, ';,/?:@&=+$');
  });

  t.test('space character', (t) => {
    t.plan(1);

    const encodedFormURLComponent = 'ABC+abc+123';

    const decodedFormURLComponent = decodeFormURLComponent(encodedFormURLComponent);

    t.equal(decodedFormURLComponent, 'ABC abc 123');
  });
});
