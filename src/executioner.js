import _ from 'lodash';
import Schema from './schema';
import { ObjectId } from 'bson';
import SchemaValidator from './schema-validator';
import ExecutionerCursor from './executioner-cursor';

const { FieldTypes } = Schema;

class ValidationError extends Error {

}

class Executioner {
  constructor({ db }) {
    this.db = db;
    this.validator = new SchemaValidator({
      db
    });
  }

  find(schema, collections, query, operation) {
    return new ExecutionerCursor({
      exec: this,
      schema,
      cursor: this.db.collection(schema.collection).find(query),
      operation,
      collections
    });
  }

  getFieldType(field) {
    return _.isNumber(field) ? field : field.type;
  }

  async beforeInsertOne(schema, raw) {
    const errors = await this.validator.validate(schema, raw);

    if(errors.length > 0) {
      const reason = new ValidationError('ER_MONGODB_VALIDATION');

      reason.errors = errors;
      throw reason;
    }
  }

  async insertMany(schema, list) {
    const listLength = list.length;

    if(listLength) {
      for(let i = 0; i < listLength; i++) {
        await this.beforeInsertOne(schema, list[i]);
      }
      const result = await this.db.collection(schema.collection).insertMany(list);

      return result.ops;
    }
    return [];
  }

  async insertOne(schema, raw) {
    await this.beforeInsertOne(schema, raw);

    const result = await this.db.collection(schema.collection).insertOne(raw);

    return result.ops;
  }

  async findOne(schema, collections, query, operation) {
    let record;

    const { collection } = schema;

    if((record = await this.db.collection(collection).findOne(query))) {
      await this.transform(schema, {}, collections, record, operation);
    }

    return record ? collections : record;
  }

  getIdsFromRecord(record, property) {
    const list = _.toArray(record[property]);
    const ids = new Array(list.length);

    for(let j = 0; j < list.length; j++) {
      const id = list[j];

      // TODO: log it somehow
      if(!ObjectId.isValid(id)){
        ids.splice(j, 1);
        continue;
      }

      ids[j] = new ObjectId(id);
    }

    return ids;
  }

  async transform(schema, result, collections, record, operation = {}) {
    const properties = Object.keys(schema.fields);
    const propsLength = properties.length;

    if(!operation.hasOwnProperty('processedIds'))
      operation.processedIds = {};

    if(!schema.virtualSchema) {
      const recordId = record._id.toString();

      // console.log(recordId, operation.processedIds);

      // avoid already processed documents
      if(operation.processedIds[recordId]){
        return collections;
      }

      operation.processedIds[recordId] = true;

      if(!collections.hasOwnProperty(schema.collection)) {
        collections[schema.collection] = [];
      }

      result._id = record._id;

      collections[schema.collection].push(result);
    }

    for(let i = 0; i < propsLength; i++) {
      const property = properties[i];
      const field = schema.fields[property];

      const type = this.getFieldType(field);

      if(field instanceof Schema === true) {
        if(field.virtualSchema) {
          if(record[property]) {
            result[property] = {};
            await this.transform(field, result[property], collections, record[property], operation);
          }
        } else if(record[property]) {
          result[property] = record[property];
          await this.find(field, collections, {
            _id: record[property]._id
          }, operation).toArray();
        }
      } else if (type & FieldTypes.ConditionalSchema) {
        const schema = field.getSchema(record);

        result[property] = {};

        return this.transform(schema, result[property], collections, record[property], operation);
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
          if(record.hasOwnProperty(property)) {
            const list = record[property];
            const schema = field.schema;
            const listLength = list.length;
            const targetList = new Array(listLength);
            const promises = new Array(listLength);

            for(let j = 0; j < listLength; j++) {
              targetList[j] = {};
              promises[j] = this.transform(schema, targetList[j], collections, list[j], operation);
            }

            await Promise.all(promises);

            result[property] = targetList;
          } else {
            result[property] = [];
          }
        } else if(type & FieldTypes.ObjectId) {
          if(type & FieldTypes.ForeignerReference) {
            await this.find(ref, collections, {
              [field.property]: record._id
            }).toArray();
          } else if(type & FieldTypes.SchemaReference) {
            if(record.hasOwnProperty(property)) {
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
          }
        } else {
          throw new Error(`${schema.collection} -> Invalid flags -> "${type}" -> for property "${property}"`);
        }
      } else if (type & FieldTypes.SchemaReference) {
        await this.findOne(field.reference, collections, {
          _id: new ObjectId(record[property])
        }, operation);

        result[property] = record[property];
      } else if([
        Schema.FieldTypes.Array,
        Schema.FieldTypes.String,
        Schema.FieldTypes.Number,
        Schema.FieldTypes.Object,
        Schema.FieldTypes.Boolean,
        Schema.FieldTypes.ObjectId
      ].some(f => type & f)) {
        if(record.hasOwnProperty(property)) {
          result[property] = record[property];
        }
      }
    }

    return collections;
  }
}

_.forEach(['updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'aggregate'], key => {
  Executioner.prototype[key] = async function (schema, ...args) {
    return await this.db.collection(schema.collection)[key](...args);
  };
});

export default Executioner;
