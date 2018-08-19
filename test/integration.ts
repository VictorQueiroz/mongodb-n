import * as assert from 'assert';
import crypto from 'crypto';
import faker from 'faker';
import { Db, MongoClient } from 'mongodb';
import { after, before, beforeEach, test } from 'sarg';
import { createModels, FieldTypes, Schema } from '../src';
import * as schemas from './fixtures/schemas';

let db: Db;
let models: any;
let connection: MongoClient;

before(async () => {
  connection = await MongoClient.connect('mongodb://database');
  db = connection.db('test');

  models = await createModels<{
    User: any;
    Subject: any;
    Politician: any;
    Picture: any;
    Comment: any;
    Post: any;
    AuthorInfo: any;
    GeoPoint: any;
    Product: any;
    Timeline: any;
    Travel: any;
    Schedule: any;
  }, {
    subjects: any[];
  }>(db, schemas);
});

beforeEach(async () => {
  await db.dropDatabase();
});

after(async () => {
  await db.dropDatabase();
  connection.close();
});

test('should handle empty insertMany', async () => {
  assert.deepEqual(await models.Subject.insertMany([]), []);
});

test('should support full schema property value', async () => {
  const [travel1] = await models.Travel.insertOne({
    name: 'Travel 1'
  });
  const [schedule1] = await models.Schedule.insertOne({
    travel: travel1
  });

  assert.deepEqual(await models.Schedule.find({
    _id: schedule1._id
  }).toArray(), {
    schedules: [schedule1],
    travels: [travel1]
  });
});

test('should support missing properties in documents', async () => {
  const { ops: [product] } = await models.Product.getCollection().insertOne({
    name: 'MacBook Pro'
  });

  const { products: [product1] } = await models.Product.findOne({
    _id: product._id
  });

  assert.deepEqual(product1, {
    _id: product._id,
    geopoints: [],
    name: 'MacBook Pro'
  });
});

test('should support buffer', async () => {
  const buffer = crypto.randomBytes(32);
  const [picture] = await models.Picture.insertOne({
    cached: buffer,
    height: 0,
    width: 0
  });

  assert.deepEqual(await models.Picture.findOne({_id: picture._id}), {
    pictures: [picture]
  });
});

test('should support array of predefined schema', async () => {
  const [subject1, subject2] = await models.Subject.insertMany([{
    title: 'Nice Subject 1'
  }, {
    title: 'Nice Subject 2'
  }]);
  const [politician] = await models.Politician.insertOne({
    subjects: [{
      flags: 1,
      subjectId: subject1._id
    }, {
      flags: 1,
      subjectId: subject2._id
    }]
  });
  const result = await models.Politician.findOne({
    _id: politician._id
  });
  assert.deepEqual(result, {
    politicians: [politician],
    subjects: [subject1, subject2]
  });
});

test('should support deep schema definition', async () => {
  const [user] = await models.User.insertOne({
    biography: 'I\'m phenomenal',
    name: 'John Wick'
  });
  const [product] = await models.Product.insertOne({
    authorInfo: {
      authorId: user._id,
      biography: 'Old biography'
    },
    name: 'MacBook Pro'
  });
  assert.deepEqual(await models.Product.find().toArray(), {
    geopoints: [],
    products: [{
      _id: product._id,
      authorInfo: {
        authorId: user._id,
        biography: 'Old biography'
      },
      geopoints: [],
      name: 'MacBook Pro'
    }],
    users: [user]
  });
});

test('should not return repeated _id in responses', () => {});

test('should support conditional schema according to raw incoming document data', async () => {
  const [user] = await models.User.insertOne({
    biography: 'I\'m phenomenal',
    name: 'John Wick'
  });
  const [product] = await models.Product.insertOne({
    authorInfo: {
      authorId: user._id,
      biography: 'Old biography'
    },
    geopoints: [],
    name: 'MacBook Pro'
  });
  const [timeline] = await models.Timeline.insertOne({
    contents: {
      productId: product._id,
      userId: user._id
    },
    type: schemas.TimelineTypes.UserFavoriteProduct
  });

  assert.deepEqual(await models.Timeline.findOne(), {
    geopoints: [],
    products: [product],
    timeline: [timeline],
    users: [user]
  });
});

test('it should throw for invalid tags in schema', async () => {
  const models = await createModels<{
    Test: { fieldOne: any[]; };
  }, {
    invalid_schema: Array<{ fieldOne: any[]; }>;
  }>(db, {
    Test: new Schema({
      collection: 'invalid_schema',
      fields: {
        fieldOne: FieldTypes.ArrayOf
      }
    })
  });
  await models.Test.insertOne({
    fieldOne: []
  });
  await assert.rejects(async () => {
    await models.Test.findOne();
  });
});

test('it should throw for invalid flag used with object id', async () => {
  const models = await createModels<{
    Test: { fieldOne: any[]; }
  }, {
    invalid_schema: Array<{ fieldOne: any[]; }>
  }>(db, {
    Test: new Schema({
      collection: 'invalid_schema',
      fields: {
        fieldOne: FieldTypes.ArrayOf | FieldTypes.ObjectId | FieldTypes.String
      }
    })
  });
  await models.Test.insertOne({
    fieldOne: []
  });
  await assert.rejects(async () => {
    await models.Test.findOne();
  });
});

test('it should execute transform if record is found after findOne() command', async () => {
  await models.Product.findOne();
});

test('it should define result property with an empty array when received invalid array from output', async () => {
  const models = await createModels<{
    Test: { fieldOne: any; };
  }, {
    invalid_schema: Array<{ fieldOne: any; }>;
  }>(db, {
    Test: new Schema({
      collection: 'invalid_schema',
      fields: {
        fieldOne: FieldTypes.ArrayOf | FieldTypes.Schema
      }
    })
  });
  const [{ _id }] = await models.Test.insertOne({
    fieldOne: undefined
  });
  assert.deepEqual(await models.Test.findOne(), {
    invalid_schema: [{
      _id,
      fieldOne: []
    }]
  });
});

test('it should always return all fields even if there is no record', async () => {
  assert.deepEqual(await models.Product.find().toArray(), {
    geopoints: [],
    products: []
  });
});

test('should support array of references', async () => {
  const g = new Array(64);

  for(let i = 0; i < g.length; i++) {
    g[i] = {
      latitude: parseFloat(faker.address.latitude()),
      longitude: parseFloat(faker.address.longitude())
    };
  }

  const geopoints = await models.GeoPoint.insertMany(g);
  const [product] = await models.Product.insertOne({
    geopoints: geopoints.map((geo: schemas.IGeoPoint) => geo._id),
    name: 'product 1',
  });

  assert.deepEqual(await models.Product.findOne({
    _id: product._id
  }), {
    geopoints,
    products: [product]
  });
});

test('should return records for just one document', async () => {
  const [user] = await models.User.insertOne({
    biography: `
      The blade is in your aorta, pull it and you will die.
      Consider this a professional courtesy
    `.trim(),
    name: 'John Wick'
  });
  assert.deepEqual(await models.User.findOne(), {
    users: [user]
  });
});

test('should process different kinds of referencies between schemas', async () => {
  const [user] = await models.User.insertOne({
    name: 'John Wick'
  });
  const [post] = await models.Post.insertOne({
    authorId: user._id,
    title: 'First post'
  });
  const [comment] = await models.Comment.insertOne({
    body: 'this is my first comment',
    postId: post._id
  });

  assert.deepEqual(await models.Post.find().toArray(), {
    comments: [{
      _id: comment._id,
      body: 'this is my first comment',
      postId: post._id
    }],
    posts: [{
      _id: post._id,
      authorId: user._id,
      title: 'First post'
    }],
    users: [{
      _id: user._id,
      name: 'John Wick'
    }]
  });
});
