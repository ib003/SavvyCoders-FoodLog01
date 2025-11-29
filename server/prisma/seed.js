// prisma/seed.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // --- Seed Allergy (or Allergen) master list ---
  const allergies = [
    'Peanuts',
    'Tree Nuts',
    'Dairy',
    'Eggs',
    'Gluten',
    'Wheat',
    'Soy',
    'Fish',
    'Shellfish',
    'Sesame',
    'Lactose Intolerance'
  ];

  // NOTE: Make sure the model name matches your schema:
  // If your schema has `model Allergy { ... }`, use `prisma.allergy`
  // If it has `model Allergen { ... }`, use `prisma.allergen`
  for (const name of allergies) {
    await prisma.allergy.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // --- Seed Symptom master list ---
  const symptoms = [
    'Bloating',
    'Stomach Pain',
    'Gas',
    'Diarrhea',
    'Constipation',
    'Nausea',
    'Headache',
    'Fatigue',
    'Brain Fog',
    'Anxiety',
    'Skin Rash',
    'Itching',
  ];

  for (const name of symptoms) {
    await prisma.symptom.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log('✅ Seed completed');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
