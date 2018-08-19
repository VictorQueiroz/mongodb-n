import { FilterQuery } from 'mongodb';
import Executioner from './executioner';
import ExecutionerCursor from './executioner-cursor';
import Schema from './schema';

export default class SchemaExecutioner<T, R> {
  constructor(private exec: Executioner<R>, private schema: Schema) {
  }

  public getCollection() {
    return this.exec.getCollection(this.schema);
  }

  public insertOne(document: T) {
    return this.exec.insertOne(this.schema, document);
  }

  public insertMany(document: T[]) {
    return this.exec.insertMany(this.schema, document);
  }

  public findOne(query?: FilterQuery<T>) {
    return this.exec.findOne(this.schema, {}, query);
  }

  public find(query?: FilterQuery<T>): ExecutionerCursor<R> {
    return this.exec.find(this.schema, {}, query);
  }
}
