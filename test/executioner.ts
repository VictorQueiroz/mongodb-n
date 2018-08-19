import * as assert from 'assert';
import { Db, MongoClient } from 'mongodb';
import { after, before, beforeEach, test } from 'sarg';
import { createModels } from '../src';
import Executioner from '../src/executioner';
import Schema, { FieldTypes } from '../src/schema';

let db: Db;
let exec: Executioner<any>;
let connection: MongoClient;

before(async () => {
  connection = await MongoClient.connect('mongodb://database');
  db = connection.db('test');
});

beforeEach(async () => {
  await db.dropDatabase();
  exec = new Executioner(db);
});

after(async () => {
  await connection.close();
});

test('it should accept reference of a non-virtual schema', async () => {
  const B = new Schema({
    collection: 'b',
    fields: {
      name: FieldTypes.String
    }
  });
  const A = new Schema({
    collection: 'a',
    fields: {
      b: B
    }
  });

  const models = await createModels<{
    B: { name: string; };
    A: {
      b: { name: string; };
    };
  }, {
    a: Array<{
      b: { name: string; };
    }>;
    b: Array<{ name: string }>;
  }>(db, {
    A,
    B
  });

  const [b] = await models.B.insertOne({
    name: 'test value'
  });
  const [a] = await models.A.insertOne({
    b
  });

  const result: any = {};
  const collections: any = {};

  await exec.transform(A, result, collections, a);

  assert.deepEqual(collections, {
    a: [a],
    b: [b]
  });
});
