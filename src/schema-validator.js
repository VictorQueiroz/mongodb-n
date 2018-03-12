import _ from 'lodash';
import Schema from './schema';
import { Buffer } from 'buffer';
import { ObjectId } from 'bson';

const { FieldTypes } = Schema;

const Validators = {
  checkFieldType: createValidator('checkFieldType', function(field, value) {
    // ignore foreigner references
    if(field.type & FieldTypes.ForeignerReference || field.type & FieldTypes.ConditionalSchema) {
      return true;
    }
    if(field.type & FieldTypes.Date) {
      return value instanceof Date;
    } else if(field.type & FieldTypes.Buffer) {
      return Buffer.isBuffer(value);
    } else if(field.type & FieldTypes.Object) {
      return _.isObject(value);
    } else if(field.type & FieldTypes.String) {
      return _.isString(value);
    } else if(field.type & FieldTypes.Number) {
      return _.isNumber(value);
    } else if(field.type & FieldTypes.Array) {
      return _.isArray(value);
    } else if(field.type & FieldTypes.Boolean) {
      return _.isBoolean(value);
    } else if(field.type & FieldTypes.ObjectId) {
      if(field.type & FieldTypes.ArrayOf) {
        return value.every(id => ObjectId.isValid(id));
      }
      return ObjectId.isValid(value);
    } else if(field.type & FieldTypes.ArrayOf) {
      if(field.type & FieldTypes.Schema) {
        return _.isArray(value);
      }
    }
    return false;
  }),
  max: function(maxLength) {
    return createValidator('max', function(field, value) {
      if(field.type & FieldTypes.String || field.type & FieldTypes.Array) {
        return value.length <= maxLength;
      }
      if(field.type & FieldTypes.Buffer) {
        return value.byteLength <= maxLength;
      }
      if(field.type & FieldTypes.Number) {
        return value <= maxLength;
      }
      return false;
    });
  },
  min: function(minLength) {
    return createValidator('min', function(field, value) {
      if(field.type & FieldTypes.String || field.type & FieldTypes.Array) {
        return value.length >= minLength;
      }
      if(field.type & FieldTypes.Buffer) {
        return value.byteLength >= maxLength;
      }
      if(field.type & FieldTypes.Number) {
        return value >= minLength;
      }
      return false;
    });
  },
  unique: function(collection, collectionProperty) {
    return createValidator('unique', async function(field, value, property, attrs, db) {
      const result = await db.collection(collection).findOne({
        [collectionProperty]: value
      });
      return result ? false : true;
    });
  },
  required: createValidator('required', function (field, value, property, attrs) {
    return attrs.hasOwnProperty(property);
  })
};

class SchemaValidator {
  constructor({ db }) {
    this.db = db;
  }

  getInitialCtx() {
    return {
      path: [],
      errors: []
    };
  }

  async validate(schema, record = {}, ctx = this.getInitialCtx()) {
    const props = Object.keys(schema.fields);
    const propsLength = props.length;

    for(let i = 0; i < propsLength; i++) {
      const property = props[i];
      let field = schema.fields[property];

      ctx.path.push(property);

      if(field instanceof Schema) {
        await this.validate(field, record[property], ctx);

        ctx.path.shift();
        continue;
      }

      if(_.isNumber(field)){
        field = {
          type: field
        };
      }
      if(!field.hasOwnProperty('validation')) {
        field.validation = [];
      }

      let { validation } = field;

      if(_.isFunction(validation)) {
        validation = [validation];
      } else if(!_.isArray(validation)) {
        throw new Error(
          `Invalid validation for field "${property}". ` +
          `Validation could be either a function or an array`
        );
      }

      const requiredIndex = validation.indexOf(validation.find(validator => validator.validatorName === 'required'));
      const isRequiredField = requiredIndex === -1;

      if(isRequiredField && !record.hasOwnProperty(property))
        continue;

      if(isRequiredField)
        validation.unshift(Validators.checkFieldType);
      else
        validation.splice(requiredIndex + 1, 0, Validators.checkFieldType);

      const validatorsLength = validation.length;

      for(let j = 0; j < validatorsLength; j++) {
        const validator = validation[j];
        const validatorName = validator.validatorName;

        if(ctx.errors.length > 0) {
          break;
        }
        if(await validator.validate(field, record[property], property, record)) {
          continue;
        }

        ctx.errors.push({
          path: ctx.path.slice(0),
          validator: validatorName
        });
      }

      ctx.path.shift();
    }

    return ctx.errors.slice(0);
  }
}

function createValidator(validatorName, validate) {
  return {
    validate,
    validatorName
  };
}

SchemaValidator.Validators = Validators;
SchemaValidator.createValidator = createValidator;

export default SchemaValidator;
