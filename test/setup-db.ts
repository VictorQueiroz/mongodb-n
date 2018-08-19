/// <reference path="./index.d.ts" />

import { MongoClient } from "mongodb";
import { createModels } from "../src";
import * as allSchemas from './fixtures/schemas';

module.exports = async () => {
    const {
        TimelineTypes,
        ...schemas
    } = allSchemas;

    const connection = await MongoClient.connect('mongodb://database');
    const db = connection.db('test_db');
    const models = await createModels(db, schemas);

    await db.dropDatabase();

    global.models = models;
    global.connection = connection;
    global.db = db;
};
