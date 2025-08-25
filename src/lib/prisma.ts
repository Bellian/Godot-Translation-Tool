import { PrismaClient } from '../generated/prisma'

declare global {
    // allow global caching of Prisma client in development to avoid creating
    // too many connections during hot-reloads
    var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
