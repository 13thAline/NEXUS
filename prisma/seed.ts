import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data to prevent duplicates during multiple seeds
  await prisma.incidentLog.deleteMany()
  await prisma.task.deleteMany()
  await prisma.incident.deleteMany()

  console.log('✅ Database cleared. Ready for mock incidents.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })