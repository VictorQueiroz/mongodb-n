import Schema from './schema';
import Executioner from './executioner';
import SchemaExecutioner from '../src/schema-executioner';

const { FieldTypes } = Schema;

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
  FieldTypes,
  Executioner
};
