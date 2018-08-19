import { Cursor } from "mongodb";
import Executioner, { OperationContext, TransformResult } from "./executioner";
import Schema from "./schema";

class ExecutionerCursor<T> {
    private exec: Executioner<T>;
    private schema: Schema;
    private cursor: Cursor;
    private operation?: OperationContext;
    private collections: TransformResult<T>;
    constructor({ exec, schema, cursor, collections, operation }: {
        exec: Executioner<T>;
        schema: Schema;
        cursor: Cursor;
        operation?: OperationContext;
        collections: TransformResult<T>;
    }) {
        this.exec = exec;
        this.schema = schema;
        this.cursor = cursor;
        this.operation = operation;
        this.collections = collections;
    }

    public async toArray(): Promise<TransformResult<T>> {
        const records = await this.cursor.toArray();
        const collections = this.collections;
        const operation = this.operation;

        for(const record of records) {
            await this.exec.transform(
              this.schema,
              {},
              collections,
              record,
              operation
            );
        }

        return collections;
    }
}

export default ExecutionerCursor;
