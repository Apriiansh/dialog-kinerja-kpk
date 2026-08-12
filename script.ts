import { prisma } from "./lib/prisma";

async function main() {
  const user = await prisma.user.create({
    data: {
      npp: "199001012024011001",
      nama_pegawai: "Alice Puspita",
      password: "rahasia123",
      role: "PEGAWAI",
    },
  });
  console.log("Created user:", user);

  const metode = await prisma.masterMetodePengembangan.create({
    data: { nama_metode: "Penugasan" },
  });
  console.log("Created metode:", metode);

  const allUsers = await prisma.user.findMany();
  console.log("All users:", JSON.stringify(allUsers, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
