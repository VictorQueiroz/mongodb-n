import _ from 'lodash';

class SchemaExecutioner {
    constructor({ exec, schema }) {
        this.exec = exec;
        this.schema = schema;
    }

    findOne(query) {
        return this.exec.findOne(this.schema, {}, query);
    }

    find(query) {
        return this.exec.find(this.schema, {}, query);
    }
}

_.forEach(['insertOne', 'insertMany', 'deleteOne', 'deleteMany', 'updateOne', 'aggregate'], key => {
    return SchemaExecutioner.prototype[key] = function(...args) {
        return this.exec[key](this.schema, ...args);
    };
});

export default SchemaExecutioner;
