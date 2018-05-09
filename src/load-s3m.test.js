import test from 'tape';
import loadS3m from './load-s3m';
import {readFile} from './testutils';

test('header is loaded', t => {
  t.plan(3);

  const ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 255];

  const input = readFile('./testdata/ARMANI.S3M');
  const result = loadS3m(input);
  t.false(result.error);
  t.equal(result.title, 'Armani Showers');
  t.deepEqual(result.orderList, ORDER);
});

test('instruments are loaded', t => {
  t.plan(5);

  const input = readFile('./testdata/PM_NOVA.S3M');
  const result = loadS3m(input);
  t.false(result.error);
  t.equal(result.title, 'Nova');
  t.equal(result.instruments[0].filename, 'cpurplem.667');
  t.equal(result.instruments[4].title, 'for epic megagames');
  t.equal(result.instruments[5].length,
    result.instruments[5].sampleData.length);
});
