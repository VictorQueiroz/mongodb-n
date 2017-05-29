import _ from 'lodash';

class ExecutionerCursor {
    constructor({ exec, schema, cursor, collections }) {
        this.exec = exec;
        this.schema = schema;
        this.cursor = cursor;
        this.collections = collections;
    }

    async toArray() {
        const records = await this.cursor.toArray();
        const collections = this.collections;

        for(let i = 0; i < records.length; i++) {
            await this.exec.transform(this.schema, {}, collections, records[i]);
        }

        return collections;
    }
}

_.forEach(['count', 'isClosed', 'explain'], key => {
  ExecutionerCursor.prototype[key] = async function(...args) {
    return await this.cursor[key](...args);
  };
});

_.forEach(['skip', 'limit', 'sort', 'addCursorFlag', 'filter', 'comment'], key => {
    ExecutionerCursor.prototype[key] = function(...args) {
        this.cursor[key](...args);
        return this;
    };
});

export default ExecutionerCursor;
