import assert from "node:assert/strict";
import { isCronRequestAuthorised } from "../lib/cron-auth.mjs";

assert.equal(isCronRequestAuthorised({ authorization: null, secret: undefined, nodeEnv: "production" }), false);
assert.equal(isCronRequestAuthorised({ authorization: "Bearer anything", secret: undefined, nodeEnv: "production" }), false);
assert.equal(isCronRequestAuthorised({ authorization: null, secret: undefined, nodeEnv: "development" }), true);
assert.equal(isCronRequestAuthorised({ authorization: "Bearer wrong", secret: "correct", nodeEnv: "production" }), false);
assert.equal(isCronRequestAuthorised({ authorization: "Bearer correct", secret: "correct", nodeEnv: "production" }), true);

console.log("cron authorization contract: ok");
