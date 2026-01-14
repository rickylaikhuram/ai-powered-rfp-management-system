import { prisma } from "../src/config/prisma"; // Adjust this path if your output path is different

async function main() {
  console.log("Start seeding...");

  const vendors = [
    {
      name: "Global Tech Solutions",
      email: "rickylaikhuram@yahoo.com", // Replace with your test email to act as vendor
    },
    {
      name: "Office Pro Supplies",
      email: "rickilaikhuram55@gmail.com",
    },
    {
      name: "Elite Electronics",
      email: "rickilaikhuram555@gmail.com",
    },
  ];

  for (const v of vendors) {
    const vendor = await prisma.vendor.upsert({
      where: { email: v.email },
      update: {},
      create: v,
    });
    console.log(`Created vendor with id: ${vendor.id}`);
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
