const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create test admin user
    const hashedPassword = await bcrypt.hash("admin123!", 12);
    const admin = await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@sanayadtech.com",
        hashedPassword,
      },
    });
    console.log("Created admin:", admin);

    // Create group
    const group = await prisma.group.create({
      data: {
        name: "Sanayad Learn",
        slug: "sanayad-learn",
        description: "Welcome to Sanayad Learn!",
        isPublic: false,
        requirePostApproval: true,
        welcomeMessage: "Welcome to Sanayad Learn!",
      },
    });
    console.log("Created group:", group);

    // Create membership
    const membership = await prisma.membership.create({
      data: {
        userId: admin.id,
        groupId: group.id,
        role: "OWNER",
        status: "ACTIVE",
      },
    });
    console.log("Created membership:", membership);

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
