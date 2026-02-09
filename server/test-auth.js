// Quick test script to check auth setup
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function testAuth() {
  try {
    console.log("=== Testing Auth Setup ===\n");
    
    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "fallback-secret-key") {
      console.log("⚠️  WARNING: JWT_SECRET not set or using fallback!");
    } else {
      console.log("✅ JWT_SECRET is configured");
    }
    
    // Check database connection
    console.log("\n--- Checking Database Connection ---");
    const userCount = await prisma.user.count();
    console.log(`Total users in database: ${userCount}`);
    
    // List all users (without passwords)
    if (userCount > 0) {
      console.log("\n--- Existing Users ---");
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          createdAt: true
        },
        take: 10
      });
      users.forEach((u, i) => {
        console.log(`${i + 1}. ${u.email} (ID: ${u.id}, Created: ${u.createdAt})`);
      });
    } else {
      console.log("⚠️  No users found in database. Registration is needed.");
    }
    
    // Test password hashing
    console.log("\n--- Testing Password Hashing ---");
    const testPassword = "testpassword123";
    const hash = await bcrypt.hash(testPassword, 12);
    const isValid = await bcrypt.compare(testPassword, hash);
    console.log(`Password hash test: ${isValid ? "✅ PASS" : "❌ FAIL"}`);
    
    console.log("\n=== Test Complete ===");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();

