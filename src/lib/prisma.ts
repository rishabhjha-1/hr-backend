import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { PrismaClient } from '../generated/prisma/client.js'

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient
  pgPool?: pg.Pool
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy hr-backend/.env.example to hr-backend/.env',
    )
  }

  const pool =
    globalForPrisma.pgPool ??
    new pg.Pool({
      connectionString,
    })

  globalForPrisma.pgPool = pool

  const adapter = new PrismaPg(pool)
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export async function disconnectPrisma() {
  await prisma.$disconnect()
  if (globalForPrisma.pgPool) {
    await globalForPrisma.pgPool.end()
  }
}
