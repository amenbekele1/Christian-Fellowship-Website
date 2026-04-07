import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
// Run with: npx tsx prisma/seed.ts

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create Guardian (Admin)
  const guardianPassword = await bcrypt.hash("Guardian@2024", 12);
  const guardian = await prisma.user.upsert({
    where: { email: "admin@wecf.org" },
    update: {},
    create: {
      name: "Fellowship Admin",
      email: "admin@wecf.org",
      password: guardianPassword,
      role: Role.GUARDIAN,
    },
  });

  // Create BUS Leader
  const leaderPassword = await bcrypt.hash("Leader@2024", 12);
  const busLeader = await prisma.user.upsert({
    where: { email: "leader@wecf.org" },
    update: {},
    create: {
      name: "Daniel Tesfaye",
      email: "leader@wecf.org",
      password: leaderPassword,
      role: Role.BUS_LEADER,
    },
  });

  // Create BUS Group
  const busGroup = await prisma.bUSGroup.upsert({
    where: { name: "Alpha Group" },
    update: {},
    create: {
      name: "Alpha Group",
      description: "First BUS group of the fellowship",
      leaderId: busLeader.id,
    },
  });

  // Create a regular member
  const memberPassword = await bcrypt.hash("Member@2024", 12);
  await prisma.user.upsert({
    where: { email: "member@wecf.org" },
    update: {},
    create: {
      name: "Miriam Haile",
      email: "member@wecf.org",
      password: memberPassword,
      role: Role.MEMBER,
      busGroupId: busGroup.id,
    },
  });

  // Update leader to be in their group
  await prisma.user.update({
    where: { id: busLeader.id },
    data: { busGroupId: busGroup.id },
  });

  // Create Events
  const now = new Date();
  await prisma.event.createMany({
    skipDuplicates: true,
    data: [
      {
        title: "Sunday Worship Service",
        description:
          "Join us for our weekly worship service with praise, prayer and the Word of God.",
        location: "Warsaw Ethiopian Christian Fellowship Hall",
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 10, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 13, 0),
        type: "Worship",
        isPublic: true,
      },
      {
        title: "Bible Study Night",
        description:
          "In-depth study of the Book of Romans. All members are encouraged to attend.",
        location: "Fellowship Hall - Room 2",
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 18, 30),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 20, 30),
        type: "Bible Study",
        isPublic: true,
      },
      {
        title: "Worship Night",
        description:
          "A night of praise and worship dedicated to the Lord. Come with an open heart.",
        location: "Main Hall",
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10, 18, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 10, 21, 0),
        type: "Worship Night",
        isPublic: true,
      },
      {
        title: "Literature Night",
        description:
          "Discussing Christian literature and theological works. This month: C.S. Lewis - Mere Christianity.",
        location: "Library Room",
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 17, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14, 19, 0),
        type: "Literature Night",
        isPublic: true,
      },
      {
        title: "BUS Group Meeting",
        description: "Monthly BUS group leadership meetings to coordinate fellowship activities.",
        location: "Conference Room",
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 15, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 17, 0),
        type: "BUS Meeting",
        isPublic: false,
      },
    ],
  });

  // Create Announcements
  await prisma.announcement.createMany({
    skipDuplicates: true,
    data: [
      {
        title: "Welcome to Our New Website!",
        content:
          "We are thrilled to launch our new fellowship website and member portal. Members can now manage attendance, reserve library books, and stay connected. Praise God!",
        isPublic: true,
        isPinned: true,
      },
      {
        title: "Saturday Service Time Change",
        content:
          "Please note that our Saturday service will now begin at 10:00 AM instead of 9:30 AM starting from next month. Please update your schedules accordingly.",
        isPublic: false,
        isPinned: true,
      },
      {
        title: "Library Books Available",
        content:
          "We have received new books for our fellowship library. Members can browse and reserve books through the member portal. Come and enrich your spiritual walk!",
        isPublic: false,
        isPinned: false,
      },
    ],
  });

  // Create Books
  await prisma.book.createMany({
    skipDuplicates: true,
    data: [
      {
        title: "Mere Christianity",
        author: "C.S. Lewis",
        description:
          "A classic work of Christian apologetics that presents the core beliefs of Christianity in a clear and compelling way.",
        category: "Apologetics",
        totalQuantity: 3,
        availableQty: 2,
        publishedYear: 1952,
      },
      {
        title: "The Purpose Driven Life",
        author: "Rick Warren",
        description:
          "A global bestseller that answers the question: What on earth am I here for? Explores God's plan for your life.",
        category: "Christian Living",
        totalQuantity: 2,
        availableQty: 2,
        publishedYear: 2002,
      },
      {
        title: "Knowing God",
        author: "J.I. Packer",
        description:
          "A profound exploration of what it means to know God and be known by Him. Essential reading for every Christian.",
        category: "Theology",
        totalQuantity: 2,
        availableQty: 1,
        publishedYear: 1973,
      },
      {
        title: "The Screwtape Letters",
        author: "C.S. Lewis",
        description:
          "A satirical Christian novel told from the perspective of a senior demon advising his nephew on temptation.",
        category: "Fiction",
        totalQuantity: 1,
        availableQty: 1,
        publishedYear: 1942,
      },
      {
        title: "Desiring God",
        author: "John Piper",
        description:
          "Meditations on Christian hedonism — the idea that God is most glorified in us when we are most satisfied in Him.",
        category: "Theology",
        totalQuantity: 2,
        availableQty: 2,
        publishedYear: 1986,
      },
      {
        title: "The Pursuit of God",
        author: "A.W. Tozer",
        description:
          "A classic devotional that calls Christians to seek a deeper, more intimate relationship with God.",
        category: "Devotional",
        totalQuantity: 3,
        availableQty: 3,
        publishedYear: 1948,
      },
    ],
  });

  console.log("✅ Database seeded successfully!");
  console.log("");
  console.log("Default accounts:");
  console.log("  Guardian: admin@wecf.org / Guardian@2024");
  console.log("  BUS Leader: leader@wecf.org / Leader@2024");
  console.log("  Member: member@wecf.org / Member@2024");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
