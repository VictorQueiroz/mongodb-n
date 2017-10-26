import { Schema, FieldTypes, Validators } from '../../src';


const User = new Schema({
  collection: 'users',
  fields: {
    name: FieldTypes.String,
    biography: FieldTypes.String
  }
});

const Subject = new Schema({
  collection: 'subjects',
  fields: {
    title: FieldTypes.String
  },
  methods: {
    createSubject: async function(models, title) {
      return this.insertOne({
        title
      });
    }
  }
});

const Politician = new Schema({
  collection: 'politicians',
  fields: {
    subjects: {
      type: FieldTypes.ArrayOf | FieldTypes.Schema,
      schema: new Schema({
        fields: {
          subjectId: {
            type: FieldTypes.ObjectId | FieldTypes.SchemaReference,
            reference: Subject
          },
          flags: FieldTypes.Number
        }
      })
    }
  }
});

const Picture = new Schema({
  collection: 'pictures',
  fields: {
    width: FieldTypes.Number,
    height: FieldTypes.Number,
    cached: FieldTypes.Buffer
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

const Timeline = new Schema({
  collection: 'timeline',
  fields: {
    type: {
      type: FieldTypes.String,
      validation: [Validators.required]
    },
    contents: {
      type: FieldTypes.ConditionalSchema,
      getSchema: function({ type }){
        switch(type){
          case Timeline.Types.UserFavoriteProduct:
            return new Schema({
              userId: {
                type: FieldTypes.ObjectId | FieldTypes.SchemaReference,
                reference: User
              },
              productId: {
                type: FieldTypes.ObjectId | FieldTypes.SchemaReference,
                reference: Product
              },
              date: FieldTypes.Number
            });
        }
      }
    }
  }
});

Timeline.Types = {
  UserFavoriteProduct: 'Timeline_UserFavoriteProduct'
};

module.exports = {
  GeoPoint,
  User,
  Post,
  Picture,
  Product,
  Politician,
  Subject,
  Comment,
  Timeline
};
