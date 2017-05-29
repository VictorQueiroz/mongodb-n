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
  Buffer: 512
};

class Schema {
  constructor(options) {
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
