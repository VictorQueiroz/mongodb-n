#!/bin/bash
npx sarg \
    $@ \
    --require source-map-support/register \
    --require ts-node/register \
    --teardown-script $PWD/test/close-db.ts \
    --setup-script $PWD/test/setup-db.ts \
    --ignore test/setup-db.ts \
    --ignore test/**/*.d.ts \
    --ignore test/close-db.ts \
    --ignore test/fixtures/schemas.ts \
    "test/**/*.ts"
