import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import * as jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// Generate a secure secret for JWT signing
const generateSecret = () => crypto.randomBytes(32).toString("base64");

// Generate a JWT token with custom claims
function generateAdminJWT(name: string, secret: string) {
  return jwt.sign(
    {
      name,
      type: "admin",
      iat: Math.floor(Date.now() / 1000),
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn: "1000d", // Long expiry for admin tokens
    }
  );
}

async function main() {
  // First, clean up existing tokens
  await prisma.adminToken.deleteMany({});

  // Generate a secret for signing JWTs
  const jwtSecret = generateSecret();
  console.log("\nJWT Secret (store securely):", jwtSecret);
  console.log("\nGenerated Admin Tokens:");
  console.log("------------------------");

  // Generate 20 admin tokens
  const environments = ["prod", "staging", "dev", "test"];
  const purposes = ["api", "monitoring", "deployment", "backup", "maintenance"];

  for (let i = 0; i < 20; i++) {
    const env = environments[i % environments.length];
    const purpose = purposes[Math.floor(i / 4)];
    const name = `${env}-${purpose}-${i + 1}`;

    const token = generateAdminJWT(name, jwtSecret);

    await prisma.adminToken.create({
      data: {
        token,
        name,
        description: `Admin token for ${purpose} in ${env} environment`,
        isActive: true,
      },
    });

    console.log(`\n${name}:`);
    console.log(token);
  }

  const totalTokens = await prisma.adminToken.count();
  console.log("\n------------------------");
  console.log(`Generated ${totalTokens} admin tokens`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
