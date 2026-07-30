if (process.env.GITHUB_ACTIONS !== "true") {
  require("dotenv").config({
    path: ".env.test",
  });
}

if (process.env.NODE_ENV !== "test") {
  throw new Error("❌ Tests must run with NODE_ENV=test");
}

if (process.env.TEST_DATABASE !== "true") {
  throw new Error("❌ Refusing to run because this is not the test database.");
}

if (process.env.TEST_DATABASE == "true") {
 console.log(" running on test database.");
}

const prisma = require("../src/utils/prisma");
const cleanupDatabase = require("./cleanup");

afterEach(async () => {
  await cleanupDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});