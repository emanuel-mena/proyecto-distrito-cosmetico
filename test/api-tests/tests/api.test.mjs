import { afterAll, beforeAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { createApi } from "../clients/client.mjs";
import { resetData } from "../../data/data.mjs";
import { setApi, setData } from "../utils/context.mjs";
import { registerAuthTests } from "./auth/auth.cases.mjs";
import { registerProductTests } from "./products/products.cases.mjs";
import { registerCategoryTests } from "./categories/categories.cases.mjs";
import { registerCartTests } from "./cart/cart.cases.mjs";
import { registerOrderTests } from "./orders/orders.cases.mjs";

process.env.JWT_SECRET = "api-test-secret-with-at-least-thirty-two-characters";
const require = createRequire(import.meta.url);
let server, testDbName;

beforeAll(async () => {
  dotenv.config();
  if (!process.env.MONGODB_URI)
    throw new Error("Configure MONGODB_URI para ejecutar la suite API");
  
  testDbName = `api_test_${randomUUID().replaceAll("-", "").slice(0, 24)}`;
  await mongoose.connect(process.env.MONGODB_URI, { dbName: testDbName });
  const { app } = require("../../../src/server");
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  setApi(createApi(`http://127.0.0.1:${server.address().port}`));
});

beforeEach(async () => {
  setData(await resetData());
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (testDbName && mongoose.connection.db?.databaseName === testDbName)
    await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

registerAuthTests();
registerProductTests();
registerCategoryTests();
registerCartTests();
registerOrderTests();
