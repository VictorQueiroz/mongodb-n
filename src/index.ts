import { Db } from 'mongodb';
import Executioner from './executioner';
import Schema from './schema';
import { FieldTypes } from './schema';
import SchemaExecutioner from './schema-executioner';

export async function createModels<T, C>(
  db: Db,
  schemas: any & { [s: string]: Schema; }
): Promise<{
  [K in keyof T]: SchemaExecutioner<T[K], C>;
}> {
  const models: any = {};

  const exec = new Executioner(db);
  const names = Object.keys(schemas);

  for(const name of names) {
    models[name] = new SchemaExecutioner(exec, schemas[name]);
  }

  return models;
}

export {
  Schema,
  FieldTypes,
  Executioner
};
