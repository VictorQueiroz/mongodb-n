export enum FieldTypes {
  ObjectId = 1,
  ArrayOf = 2,
  String = 4,
  Object = 8,
  Boolean = 16,
  SchemaReference = 32,
  Number = 64,
  Array = 128,
  ForeignerReference = 256,
  Buffer = 512,
  Schema = 1024,
  ConditionalSchema = 2048,
  Date = 4096
}

export interface SchemaField {
  type: FieldTypes;
  [s: string]: any;
}

export interface SchemaFields {
  [s: string]: FieldTypes | SchemaField;
}

class Schema {
  private fields: SchemaFields;
  private virtualSchema: boolean = false;
  private collection?: string;

  constructor(options: any | {
    fields: SchemaFields;
    collection?: string;
  }) {
    if(options.collection) {
      this.fields = options.fields;
      this.collection = options.collection;
    } else {
      this.fields = options.fields ? options.fields : options;
      this.virtualSchema = true;
    }
  }

  public getFields() {
    return this.fields;
  }

  public isVirtualSchema() {
    return this.virtualSchema;
  }

  public getCollectionName() {
    if(!this.collection) {
      throw new Error('No collection name to return');
    }
    return this.collection;
  }
}

export default Schema;
