const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const oatmeal = await prisma.food.create({
    data: {
      name: "Oatmeal",
      brand: "Quaker",
      servingUnit: "g",
      servingQty: 40,
      kcal: 150,
      macros: { carb: 27, protein: 5, fat: 3 }
    }
  });

  await prisma.barcode.create({
    data: { upc: "0012345678905", foodId: oatmeal.id }
  });

  console.log("Seeded sample food + barcode!");
}

main().catch(e => { console.error(e); process.exit(1); })
       .finally(() => prisma.$disconnect());
