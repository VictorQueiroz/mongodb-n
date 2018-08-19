import { Db, ObjectId } from 'mongodb';
import ExecutionerCursor from './executioner-cursor';
import Schema, { FieldTypes, SchemaField } from './schema';

export type TransformResult<T> = {
  [K in keyof T]: Array<T[K]>;
} & {
  [s: string]: any;
};

export interface OperationContext {
  processedIds: Set<string>;
}

class Executioner<T> {
  constructor(private db: Db) {
  }

  public getCollection(schema: Schema) {
    return this.db.collection(schema.getCollectionName());
  }

  public find(
    schema: Schema,
    collections: any,
    query?: any,
    operation?: OperationContext
  ): ExecutionerCursor<T> {
    return new ExecutionerCursor({
      collections,
      cursor: this.db.collection(schema.getCollectionName()).find(query),
      exec: this,
      operation,
      schema
    });
  }

  public async insertMany(schema: Schema, list: any[]) {
    if(list.length) {
      const result = await this.db.collection(schema.getCollectionName()).insertMany(list);

      return result.ops;
    }
    return [];
  }

  public async insertOne(schema: Schema, raw: any) {
    const result = await this.db.collection(schema.getCollectionName()).insertOne(raw);

    return result.ops;
  }

  public async findOne(
    schema: Schema,
    collections: any,
    query?: any,
    operation?: OperationContext
  ): Promise<void | TransformResult<T>> {
    const record = await this.db.collection(schema.getCollectionName()).findOne(query);

    if(!record) {
      return;
    }

    await this.transform(
      schema,
      {},
      collections,
      record,
      operation
    );
    return collections;
  }

  public getIdsFromRecord(record: any, property: number | string) {
    const list = record[property];
    const ids = new Array(list.length);
    let i = 0;

    for(const id of list) {
      ids[i++] = new ObjectId(id);
    }

    return ids;
  }

  public async transform(
    schema: Schema,
    result: any,
    collections: TransformResult<T>,
    record: {
      [s: string]: any;
      _id: ObjectId;
    },
    operation: OperationContext = { processedIds: new Set() }
  ): Promise<TransformResult<T>> {
    const fields = schema.getFields();

    if(!schema.isVirtualSchema()) {
      const recordId = record._id.toHexString();

      // avoid already processed documents
      if(operation.processedIds.has(recordId)) {
        return collections;
      }

      operation.processedIds.add(recordId);

      if(!collections.hasOwnProperty(schema.getCollectionName())) {
        collections[schema.getCollectionName()] = [];
      }

      result._id = record._id;
      collections[schema.getCollectionName()].push(result);
    }

    for(const property of Object.keys(fields)) {
      let field: SchemaField;

      const fieldValue = fields[property];

      if(fieldValue instanceof Schema) {
        field = {
          schema: fieldValue,
          type: FieldTypes.Schema
        };
      } else if(typeof fieldValue === 'number') {
        field = { type: fieldValue };
      } else {
        field = fieldValue;
      }

      const {
        type
      } = field;

      if(type === FieldTypes.Schema) {
        const schema = field.schema;
        if(schema.isVirtualSchema()) {
          if(record[property]) {
            result[property] = {};
            await this.transform(
              schema,
              result[property],
              collections,
              record[property],
              operation
            );
          }
        } else if(typeof record[property] !== 'undefined' && record[property] !== null) {
          result[property] = record[property];
          await this.find(schema, collections, {
            _id: record[property]._id
          }).toArray();
        }
      } else if (type & FieldTypes.ConditionalSchema) {
        const schema = field.getSchema(record);

        result[property] = {};

        await this.transform(schema, result[property], collections, record[property], operation);
      } else if(type & FieldTypes.Buffer) {
        if(record.hasOwnProperty(property)) {
          result[property] = record[property].read(0);
        }
      } else if(type & FieldTypes.ArrayOf) {
        const { reference: ref } = field;

        if(ref && !collections.hasOwnProperty(ref.collection)) {
          collections[ref.collection] = [];
        }

        if(type & FieldTypes.Schema) {
          if(typeof record[property] === 'undefined' || record[property] === null) {
            result[property] = [];
          } else {
            const list = record[property];
            const schema = field.schema;
            const listLength = list.length;
            const targetList = new Array(listLength);
            const promises = new Array(listLength);

            for(let j = 0; j < listLength; j++) {
              const resultObject = {};
              promises[j] = this.transform(
                schema,
                resultObject,
                collections,
                list[j],
                operation
              );
              targetList[j] = resultObject;
            }

            await Promise.all(promises);

            result[property] = targetList;
          }
        } else if(type & FieldTypes.ObjectId) {
          if(type & FieldTypes.ForeignerReference) {
            await this.find(ref, collections, {
              [field.property]: record._id
            }, operation).toArray();
          } else if(type & FieldTypes.SchemaReference) {
            if(typeof record[property] !== 'undefined') {
              const ids = this.getIdsFromRecord(record, property);

              await this.find(ref, collections, {
                _id: {
                  $in: ids
                }
              }, operation).toArray();

              result[property] = record[property];
            } else {
              result[property] = [];
            }
          } else {
            throw new Error('Invalid flag for ObjectId field type');
          }
        } else {
          throw new Error(`${schema.getCollectionName()} -> Invalid flags -> "${type}" -> for property "${property}"`);
        }
      } else if (type & FieldTypes.SchemaReference) {
        if(record[property]) {
          await this.findOne(field.reference, collections, {
            _id: new ObjectId(record[property])
          }, operation);

          result[property] = record[property];
        }
      } else {
        if(record && typeof record[property] !== 'undefined') {
          result[property] = record[property];
        }
      }
    }

    return collections;
  }
}

export default Executioner;
