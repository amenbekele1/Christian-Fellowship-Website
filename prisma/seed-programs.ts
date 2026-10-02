/**
 * Seeds the two live WETCF programmes.
 *
 * Safe to re-run: matches on title and updates in place, so it will not
 * create duplicates.
 *
 *   npx tsx prisma/seed-programs.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROGRAMS = [
  {
    title: "Weekly Fellowship",
    schedule: "Every Saturday · 18:00",
    location: "Naddnieprzańska 7, 04-205 Warszawa",
    description:
      "Our main weekly gathering. We come together to worship, open the Word, and encourage one another as a family in Christ. Whether you have walked with the Lord for years or are just beginning, there is a place for you here.",
    details: [
      "Prayer",
      "Worship",
      "Word of Encouragement (15 min)",
      "Bible Study",
      "Closing Prayer",
    ],
    icon: "fellowship",
    color: "from-brown-700 to-brown-900",
    order: 0,
  },
  {
    title: "Weekly Prayer",
    schedule: "Every Friday · 18:00",
    location: "Śniardwy 8/118, Warszawa",
    description:
      "An evening set apart for prayer — interceding for our fellowship, for one another, and for the needs God lays on our hearts. A quiet, unhurried time to seek Him together.",
    details: ["Prayer"],
    icon: "prayer",
    color: "from-gold-700 to-brown-800",
    order: 1,
  },
];

async function main() {
  for (const p of PROGRAMS) {
    const existing = await prisma.program.findFirst({ where: { title: p.title } });

    if (existing) {
      await prisma.program.update({
        where: { id: existing.id },
        data: { ...p, isActive: true },
      });
      console.log(`Updated: ${p.title}`);
    } else {
      await prisma.program.create({ data: { ...p, isActive: true } });
      console.log(`Created: ${p.title}`);
    }
  }

  // Hide any legacy programmes that are not in the list above
  const { count } = await prisma.program.updateMany({
    where: { title: { notIn: PROGRAMS.map((p) => p.title) }, isActive: true },
    data: { isActive: false },
  });
  if (count > 0) console.log(`Archived ${count} old programme(s)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
