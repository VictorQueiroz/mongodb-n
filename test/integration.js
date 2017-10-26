import { isEqual } from 'lodash';
import faker from 'faker';
import crypto from 'crypto';
import assert from 'assert';
import schemas from './fixtures/schemas';
import { MongoClient } from 'mongodb';
import { Schema, FieldTypes, createModels } from '../src';

describe('Integration', function() {
  let db,
      models;

  beforeEach(async function() {
    db = await MongoClient.connect('mongodb://localhost/test_db');
    models = await createModels(db, schemas);
  });

  afterEach(async function() {
    await db.dropDatabase();
    await db.close();
  });

  it('should handle empty insertMany', async function() {
    assert.deepEqual(await models.Subject.insertMany([]), []);
  });

  it('should support "methods" schema property', async function() {
    const [subject1] = await models.Subject.createSubject('subject 1');

    assert.deepEqual(subject1, {
      _id: subject1._id,
      title: 'subject 1'
    });
  });

  it('should support buffer', async function() {
    const buffer = crypto.randomBytes(32);
    const [picture] = await models.Picture.insertOne({
      width: 0,
      height: 0,
      cached: buffer
    });

    assert.deepEqual(await models.Picture.findOne(), {
      pictures: [picture]
    });
  });

  it('should support array of predefined schema', async function() {
    const [subject1, subject2] = await models.Subject.insertMany([{
      title: 'Nice Subject 1'
    }, {
      title: 'Nice Subject 2'
    }]);
    const [politician] = await models.Politician.insertOne({
      subjects: [{
        subjectId: subject1._id,
        flags: 1
      }, {
        subjectId: subject2._id,
        flags: 1
      }]
    });
    const result = await models.Politician.findOne();

    assert.deepEqual(result, {
      subjects: [subject1, subject2],
      politicians: [politician]
    });
  });

  it('should support deep schema definition', async function() {
    const [user] = await models.User.insertOne({
      name: 'John Wick',
      biography: 'I\'m phenomenal'
    });
    const [product] = await models.Product.insertOne({
      name: 'MacBook Pro',
      authorInfo: {
        biography: 'Old biography',
        authorId: user._id
      }
    });
    assert.deepEqual(await models.Product.find().toArray(), {
      products: [{
        _id: product._id,
        name: 'MacBook Pro',
        authorInfo: {
          biography: 'Old biography',
          authorId: user._id
        },
        geopoints: []
      }],
      geopoints: [],
      users: [user]
    });
  });

  it('should not return repeated _id in responses', function(){

  });

  it('should support conditional schema according to raw incoming document data', async function(){
    const [user] = await models.User.insertOne({
      name: 'John Wick',
      biography: 'I\'m phenomenal'
    });
    const [product] = await models.Product.insertOne({
      name: 'MacBook Pro',
      geopoints: [],
      authorInfo: {
        biography: 'Old biography',
        authorId: user._id
      }
    });
    const [timeline] = await models.Timeline.insertOne({
      type: schemas.Timeline.Types.UserFavoriteProduct,
      contents: {
        userId: user._id,
        productId: product._id
      }
    });

    assert.deepEqual(await models.Timeline.findOne(), {
      users: [user],
      geopoints: [],
      timeline: [timeline],
      products: [product]
    });
  });

  it('should support array of references', async function() {
    const g = new Array(64);

    for(let i = 0; i < g.length; i++) {
      g[i] = {
        latitude: parseFloat(faker.address.latitude()),
        longitude: parseFloat(faker.address.longitude())
      };
    }

    const geopoints = await models.GeoPoint.insertMany(g);
    const [product] = await models.Product.insertOne({
      name: 'product 1',
      geopoints: geopoints.map(geo => geo._id)
    });

    assert.deepEqual(await models.Product.findOne({_id: product._id}), {
      products: [product],
      geopoints: geopoints
    });
  });

  describe('findOne()', function(){
    it('should return records for just one document', async function() {
      const [user] = await models.User.insertOne({
        name: 'John Wick',
        biography: `
          The blade is in your aorta, pull it and you will die.
          Consider this a professional courtesy
        `.trim()
      });
      assert.deepEqual(await models.User.findOne(), {
        users: [user]
      });
    });
  });

  describe('find()', function() {
    it('should process different kinds of referencies between schemas', async function() {
      const [user] = await models.User.insertOne({
        name: 'John Wick'
      });
      const [post] = await models.Post.insertOne({
        title: 'First post',
        authorId: user._id
      });
      const [comment] = await models.Comment.insertOne({
        body: 'this is my first comment',
        postId: post._id
      });

      assert.deepEqual(await models.Post.find().toArray(), {
        users: [{
          _id: user._id,
          name: 'John Wick'
        }],
        comments: [{
          _id: comment._id,
          body: 'this is my first comment',
          postId: post._id
        }],
        posts: [{
          _id: post._id,
          title: 'First post',
          authorId: user._id
        }]
      });
    });
  });
});
