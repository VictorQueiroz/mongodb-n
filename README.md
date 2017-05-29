The main reason I created this module is to retrieve normalized data from MongoDB and still keep the native awesome API provided by `mongodb` module. If you're looking for something fancier to return your data in a denormalized way, you should try Mongoose.

```js
import { FieldTypes, Schema, createModels } from 'mongodb-n';

// user.js
const User = new Schema({
  collection: 'users',
  fields: {
    name: FieldTypes.String
  }
});

// comment.js
const Comment = new Schema({
  collection: 'comments',
  fields: {
    body: FieldTypes.String,
    postId: FieldTypes.ObjectId
  }
});

// post.js
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

// models/index.js
module.exports = async function createModels() {
  createModels(await MongoClient.connect('mongodb://localhost/well_designed_db'), {
    User,
    Post,
    Comment
  });
};
```

### Usage
```js
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
```
