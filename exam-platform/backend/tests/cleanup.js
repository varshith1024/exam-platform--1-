const prisma = require("../src/utils/prisma");

async function cleanupDatabase() {
  await prisma.answer.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.question.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.user.deleteMany();
}

module.exports = cleanupDatabase;