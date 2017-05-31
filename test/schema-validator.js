import _ from 'lodash';
import crypto from 'crypto';
import assert from 'assert';
import { Schema, FieldTypes, SchemaValidator, Validators } from '../src';

describe('SchemaValidator', function() {
  let schema,
      validator;

  beforeEach(function() {
    validator = new SchemaValidator({});
  });

  it('should define max() default validator', async function() {
    schema = new Schema({
      title: {
        type: FieldTypes.String,
        validation: [
          Validators.max(255)
        ]
      }
    });
    assert.deepEqual(await validator.validate(schema, {
      title: crypto.randomBytes(256).toString('hex')
    }), [{
      path: ['title'],
      validator: 'max'
    }]);
  });

  it('should validate required fields', async function() {
    schema = new Schema({
      title: {
        type: FieldTypes.String,
        validation: [
          Validators.required,
          Validators.min(4)
        ]
      }
    });
    assert.deepEqual(await validator.validate(schema, {
      title: 'sdssdd'
    }), []);
  });

  it('should validate deep schemas', async function() {
    const Address = new Schema({
      streetNumber: {
        type: FieldTypes.Number,
        validation: [
          Validators.required
        ]
      }
    });
    schema = new Schema({
      address: Address
    });

    assert.deepEqual(await validator.validate(schema, {}), [{
      path: ['address', 'streetNumber'],
      validator: 'required'
    }]);
  });

  _.forEach({
    'should validate string type': {
      attributes: {
        title: 0
      },
      schema: new Schema({
        title: FieldTypes.String
      }),
      expect: [{
        path: ['title'],
        validator: 'checkFieldType'
      }]
    },
    'should validate numbers type': {
      attributes: {
        latitude: -8.1548,
        longitude: ''
      },
      schema: new Schema({
        latitude: FieldTypes.Number,
        longitude: FieldTypes.Number
      }),
      expect: [{
        path: ['longitude'],
        validator: 'checkFieldType'
      }]
    },
    'should validate arrays': {
      attributes: {
        coords: 0
      },
      schema: new Schema({
        coords: FieldTypes.Array
      }),
      expect: [{
        path: ['coords'],
        validator: 'checkFieldType'
      }]
    },
    'should validate object id': {
      attributes: {
        authorId: ''
      },
      schema: new Schema({
        authorId: FieldTypes.ObjectId
      }),
      expect: [{
        path: ['authorId'],
        validator: 'checkFieldType'
      }]
    }
  }, function(data, label) {
    it(label, async function() {
      assert.deepEqual(await validator.validate(data.schema, data.attributes), data.expect);
    });
  });
});
