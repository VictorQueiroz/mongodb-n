import { Schema, FieldTypes } from '../../src';

const User = new Schema({
  collection: 'users',
  fields: {
    name: FieldTypes.String,
    biography: FieldTypes.String
  }
});

const Comment = new Schema({
  collection: 'comments',
  fields: {
    body: FieldTypes.String,
    postId: FieldTypes.ObjectId
  }
});

const Post = new Schema({
  collection: 'posts',
  fields: {
    title: FieldTypes.String,
    authorId: {
      type: FieldTypes.ObjectId | FieldTypes.SchemaReference,
      reference: User
    },
    comments: {
      type: FieldTypes.ArrayOf | FieldTypes.ForeignerReference | FieldTypes.ObjectId,
      property: 'postId',
      reference: Comment
    }
  }
});

const AuthorInfo = new Schema({
  fields: {
    biography: {
      type: FieldTypes.String,
      description: 'Author biography when product was created'
    },
    authorId: {
      type: FieldTypes.ObjectId | FieldTypes.SchemaReference,
      reference: User
    }
  }
});

const GeoPoint = new Schema({
  collection: 'geopoints',
  fields: {
    latitude: FieldTypes.Number,
    longitude: FieldTypes.Number
  }
});

const Product = new Schema({
  collection: 'products',
  fields: {
    name: FieldTypes.String,
    geopoints: {
      type: FieldTypes.ObjectId | FieldTypes.ArrayOf | FieldTypes.SchemaReference,
      reference: GeoPoint
    },
    authorInfo: AuthorInfo
  }
});

module.exports = {
  GeoPoint,
  User,
  Post,
  Product,
  Comment
};
