The main reason I created this module is to retrieve normalized data from MongoDB and still keep the native awesome API provided by `mongodb` module. If you're looking for something fancier you should try Mongoose.

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
  createModels(await MongoClient.connect('mongodb://localhost/well_designed_db', {
    promiseLibrary: require('bluebird')
  }), {
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

### Validation

Generally validators will be used during `insertOne`, `insertMany`, `updateOne` and `updateMany` operations.

```js
import { Validators, FieldTypes, Schema } from 'mongodb-n';

const customTitleValidator = Validators.createValidator('customTitleValidator', function(field, value) {
  return /^[A-z0-9]+$/.test(value);
});

new Schema({
  title: {
    type: FieldTypes.String,
    validation: [Validators.required, Validators.max(255), customTitleValidator]
  },
  emailAddress: {
    type: FieldTypes.String,
    validation: [
      Validators.required,
      Validators.unique(
        'users' /* collection */,
        'email' /* collection document property */
      )
    ]
  }
});
```

If an invalid field is found, a proper error will be throwed in the promise. And it could be handled like:
```
UserController.prototype.createUser = async function createUser() {
  try {
    return await models.User.insertOne({
      title: '****'
    });
  } catch(reason) {
    if(reason.message === 'ER_MONGODB_VALIDATION') {
      // Handle it through `reason.errors` expression
    } else {
      // Do something else
    }
  }
};
```
