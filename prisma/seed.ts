import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@sanayadtech.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@sanayadtech.com",
      hashedPassword,
    },
  });
  console.log(`  ✓ Admin user: ${admin.email}`);

  // Create default community group
  const group = await prisma.group.upsert({
    where: { slug: "sanayad-learn" },
    update: {},
    create: {
      name: "Sanayad Learn",
      slug: "sanayad-learn",
      description: "Welcome to the Sanayad Learn community! Access courses, join events, and connect with your instructor.",
      isPublic: false,
      requirePostApproval: true,
      autoAcceptMembers: false,
      welcomeMessage: "Welcome to Sanayad Learn, #NAME#! We're glad to have you here. Check out the Classroom tab to start learning.",
      membershipQuestions: JSON.stringify([
        "What is your primary learning goal?",
        "How did you hear about us?",
      ]),
    },
  });
  console.log(`  ✓ Group: ${group.name}`);

  // Make admin the owner of the group
  await prisma.membership.upsert({
    where: { userId_groupId: { userId: admin.id, groupId: group.id } },
    update: {},
    create: {
      userId: admin.id,
      groupId: group.id,
      role: "OWNER",
      status: "ACTIVE",
      points: 0,
      level: 1,
    },
  });
  console.log(`  ✓ Admin set as OWNER of ${group.name}`);

  // Create default categories
  const categories = [
    { name: "Announcements", slug: "announcements", order: 0, readOnly: true },
    { name: "General", slug: "general", order: 1, readOnly: false },
    { name: "Q&A", slug: "qa", order: 2, readOnly: false },
    { name: "Wins", slug: "wins", order: 3, readOnly: false },
    { name: "Resources", slug: "resources", order: 4, readOnly: false },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { groupId_slug: { groupId: group.id, slug: cat.slug } },
      update: {},
      create: {
        ...cat,
        groupId: group.id,
      },
    });
  }
  console.log(`  ✓ ${categories.length} categories created`);

  // Create default level configurations
  const levels = [
    { level: 1, name: "Newcomer", minPoints: 0 },
    { level: 2, name: "Learner", minPoints: 5 },
    { level: 3, name: "Contributor", minPoints: 20 },
    { level: 4, name: "Active", minPoints: 65 },
    { level: 5, name: "Dedicated", minPoints: 155 },
    { level: 6, name: "Expert", minPoints: 600 },
    { level: 7, name: "Master", minPoints: 2015 },
    { level: 8, name: "Legend", minPoints: 8015 },
    { level: 9, name: "Champion", minPoints: 33015 },
  ];

  for (const lvl of levels) {
    await prisma.levelConfig.upsert({
      where: { groupId_level: { groupId: group.id, level: lvl.level } },
      update: {},
      create: {
        ...lvl,
        groupId: group.id,
      },
    });
  }
  console.log(`  ✓ ${levels.length} level configs created`);

  console.log("\n✅ Seed complete!");
  console.log(`\n  Admin login: admin@sanayadtech.com / admin123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
