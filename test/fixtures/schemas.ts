import { ObjectId } from 'mongodb';
import { FieldTypes, Schema } from '../../src';

export const User = new Schema({
  collection: 'users',
  fields: {
    biography: FieldTypes.String,
    name: FieldTypes.String
  }
});

export const Subject = new Schema({
  collection: 'subjects',
  fields: {
    title: FieldTypes.String
  }
});

export const Politician = new Schema({
  collection: 'politicians',
  fields: {
    subjects: {
      schema: new Schema({
        fields: {
          flags: FieldTypes.Number,
          subjectId: {
            reference: Subject,
            type: FieldTypes.ObjectId | FieldTypes.SchemaReference
          }
        }
      }),
      type: FieldTypes.ArrayOf | FieldTypes.Schema
    }
  }
});

export const Picture = new Schema({
  collection: 'pictures',
  fields: {
    cached: FieldTypes.Buffer,
    height: FieldTypes.Number,
    width: FieldTypes.Number
  }
});

export const Comment = new Schema({
  collection: 'comments',
  fields: {
    body: FieldTypes.String,
    postId: FieldTypes.ObjectId
  }
});

export const Post = new Schema({
  collection: 'posts',
  fields: {
    authorId: {
      reference: User,
      type: FieldTypes.ObjectId | FieldTypes.SchemaReference
    },
    comments: {
      property: 'postId',
      reference: Comment,
      type: FieldTypes.ArrayOf | FieldTypes.ForeignerReference | FieldTypes.ObjectId
    },
    title: FieldTypes.String
  }
});

export const AuthorInfo = new Schema({
  fields: {
    authorId: {
      reference: User,
      type: FieldTypes.ObjectId | FieldTypes.SchemaReference,
    },
    biography: {
      description: 'Author biography when product was created',
      type: FieldTypes.String
    }
  }
});

export interface IGeoPoint {
  _id: ObjectId;
  longitude: number;
  latitude: number;
}

export const GeoPoint = new Schema({
  collection: 'geopoints',
  fields: {
    latitude: FieldTypes.Number,
    longitude: FieldTypes.Number
  }
});

export const Product = new Schema({
  collection: 'products',
  fields: {
    authorInfo: AuthorInfo,
    geopoints: {
      reference: GeoPoint,
      type: FieldTypes.ObjectId | FieldTypes.ArrayOf | FieldTypes.SchemaReference,
    },
    name: FieldTypes.String
  }
});

export enum TimelineTypes {
  UserFavoriteProduct = 'Timeline_UserFavoriteProduct'
}

export const Timeline = new Schema({
  collection: 'timeline',
  fields: {
    contents: {
      getSchema: ({ type }: { type: TimelineTypes; }) => {
        switch(type) {
          case TimelineTypes.UserFavoriteProduct:
            return new Schema({
              date: FieldTypes.Number,
              productId: {
                reference: Product,
                type: FieldTypes.ObjectId | FieldTypes.SchemaReference
              },
              userId: {
                reference: User,
                type: FieldTypes.ObjectId | FieldTypes.SchemaReference,
              },
            });
        }
        throw new Error('Invalid timeline type');
      },
      type: FieldTypes.ConditionalSchema
    },
    type: {
      type: FieldTypes.String
    }
  }
});

export const Travel = new Schema({
  collection: 'travels',
  fields: {
    name: FieldTypes.String
  }
});

export const Schedule = new Schema({
  collection: 'schedules',
  fields: {
    travel: Travel
  }
});
