require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env before seeding the admin account."
    );
    process.exit(1);
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { password: hashed, role: "ADMIN", name: ADMIN_NAME || "Admin" },
    create: {
      name: ADMIN_NAME || "Admin",
      email: ADMIN_EMAIL,
      password: hashed,
      role: "ADMIN",
    },
  });

  console.log(`Admin account ready: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());