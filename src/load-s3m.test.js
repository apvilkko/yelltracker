import test from 'tape';
import loadS3m from './load-s3m';
import {readFile} from './testutils';
import {pprint} from './pprint';

test('header is loaded', t => {
  t.plan(3);

  const ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 255];

  const input = readFile('./testdata/ARMANI.S3M');
  const result = loadS3m(input);
  t.false(result.error);
  t.equal(result.title, 'Armani Showers');
  t.deepEqual(result.orderList, ORDER);
});

test('instruments and patterns are loaded', t => {
  t.plan(12);

  const input = readFile('./testdata/PM_NOVA.S3M');
  const result = loadS3m(input);
  t.false(result.error);
  t.equal(result.title, 'Nova');
  t.equal(result.instruments[0].filename, 'cpurplem.667');
  t.equal(result.instruments[4].title, 'for epic megagames');
  t.equal(
    result.instruments[5].length,
    result.instruments[5].sampleData.length
  );

  let pattern = result.patterns[8];

  t.equal(pattern.length, 64);
  t.equal(pprint(pattern[0][0]), 'A#4 06 32 .00');
  t.equal(pattern[0][0].channel, 0);

  t.equal(pprint(pattern[9][0]), '... .. .. D10');
  t.equal(pattern[9][0].channel, 1);

  pattern = result.patterns[9];
  t.equal(pprint(pattern[22][2]), 'F-4 02 .. GF0');
  t.equal(pattern[22][2].channel, 3);
});
