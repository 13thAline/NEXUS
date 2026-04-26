const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

async function testPrisma() {
  const adapter = new PrismaBetterSqlite3({
    url: 'file:./nexus.db',
  })
  const prisma = new PrismaClient({ adapter })
  try {
    const count = await prisma.incident.count();
    console.log('Incident count:', count);
    process.exit(0);
  } catch (err) {
    console.error('Prisma Error:', err);
    process.exit(1);
  }
}

testPrisma();
