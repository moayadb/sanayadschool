const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log("Users found:", users.length);
  console.log("Users:", users.map(u => ({ email: u.email, name: u.name })));
  await prisma.$disconnect();
}

main();
