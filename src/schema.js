import _ from 'lodash';

const FieldTypes = {
  ObjectId: 1,
  ArrayOf: 2,
  String: 4,
  Object: 8,
  Boolean: 16,
  SchemaReference: 32,
  Number: 64,
  Array: 128,
  ForeignerReference: 256,
  Buffer: 512,
  Schema: 1024
};

class Schema {
  constructor(options) {
    if(!options.hasOwnProperty('fields')) {
      this.fields = options;
      return false;
    }

    const { fields } = options;

    this.fields = fields;

    if(options.hasOwnProperty('collection')) {
      this.collection = options.collection;
    } else {
      this.virtualSchema = true;
    }
  }
}

Schema.FieldTypes = FieldTypes;

export default Schema;
