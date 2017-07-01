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
    models[key] = new SchemaExecutioner({
      exec,
      schema: schemas[key]
    });
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
