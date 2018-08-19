declare module NodeJS {
    interface Global {
        db: any;
        connection: any;
        models: {
            [s: string]: any;
        };
    }
}

