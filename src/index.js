import _ from 'lodash';
import Schema from './schema';
import Executioner from './executioner';
import SchemaValidator from './schema-validator';
import SchemaExecutioner from './schema-executioner';

const { FieldTypes } = Schema;
const { Validators } = SchemaValidator;

export async function createModels(db, schemas) {
  const models = {};

  const exec = new Executioner({
    db
  });

  Object.keys(schemas).forEach(key => {
    const schema = schemas[key];

    models[key] = new SchemaExecutioner({
      exec,
      schema
    });

    if(schema.hasOwnProperty('methods')) {
      const methods = schema.methods;
      const model = models[key];

      _.forEach(methods, function(value, key) {
        if(model.hasOwnProperty(key)) {
          throw new Error(`You can't replace property "${key}"`);
        }

        model[key] = function(...args) {
          return value.call(model, models, ...args);
        };
      });
    }
  });

  return models;
}

export {
  Schema,
  Validators,
  FieldTypes,
  Executioner,
  SchemaValidator
};
