/// <reference path="./index.d.ts" />

module.exports = async () => {
    await global.db.dropDatabase();
    await global.connection.close();
};
