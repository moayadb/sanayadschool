const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://postgres:123456@localhost:5432/postgres?schema=public"
    }
  }
});

async function test() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully!");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("Query result:", result);
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
}

test();
