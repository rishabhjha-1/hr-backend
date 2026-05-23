import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../lib/prisma.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../../data')

const COUNTRIES = ['USA', 'India', 'UK', 'Germany', 'Canada', 'Australia', 'Japan', 'Brazil']
const JOB_TITLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Product Manager',
  'HR Manager',
  'Data Analyst',
  'DevOps Engineer',
  'QA Engineer',
  'UX Designer',
  'Sales Executive',
  'Finance Analyst',
]
const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Human Resources',
  'Data',
  'Operations',
  'Design',
  'Sales',
  'Finance',
]

const SALARY_RANGES: Record<string, [number, number]> = {
  USA: [60000, 180000],
  India: [500000, 3500000],
  UK: [35000, 120000],
  Germany: [45000, 130000],
  Canada: [55000, 150000],
  Australia: [65000, 160000],
  Japan: [5000000, 15000000],
  Brazil: [60000, 250000],
}

function loadNames(filename: string): string[] {
  return readFileSync(join(DATA_DIR, filename), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

function randomSalary(country: string): number {
  const [min, max] = SALARY_RANGES[country] ?? [30000, 100000]
  return Math.round(min + Math.random() * (max - min))
}

function randomHireDate(): Date {
  const start = new Date('2010-01-01').getTime()
  const end = new Date('2025-01-01').getTime()
  return new Date(start + Math.random() * (end - start))
}

export type SeedEmployee = {
  fullName: string
  jobTitle: string
  country: string
  salary: number
  department: string
  email: string
  hireDate: Date
}

export function buildSeedEmployees(count: number): SeedEmployee[] {
  const firstNames = loadNames('first_names.txt')
  const lastNames = loadNames('last_names.txt')
  const employees: SeedEmployee[] = []

  for (let index = 0; index < count; index += 1) {
    const country = randomItem(COUNTRIES)
    const firstName = randomItem(firstNames)
    const lastName = randomItem(lastNames)
    const jobTitle = randomItem(JOB_TITLES)

    employees.push({
      fullName: `${firstName} ${lastName}`,
      jobTitle,
      country,
      salary: randomSalary(country),
      department: randomItem(DEPARTMENTS),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@company.com`,
      hireDate: randomHireDate(),
    })
  }

  return employees
}

export async function seedEmployees(count = 10_000, batchSize = 1_000) {
  const employees = buildSeedEmployees(count)

  await prisma.employee.deleteMany()

  for (let index = 0; index < employees.length; index += batchSize) {
    const batch = employees.slice(index, index + batchSize)
    await prisma.employee.createMany({ data: batch })
  }

  return employees.length
}

async function main() {
  const count = Number(process.argv[2]) || 10_000
  const startedAt = performance.now()
  const inserted = await seedEmployees(count)
  const elapsedMs = Math.round(performance.now() - startedAt)

  console.log(`Seeded ${inserted} employees in ${elapsedMs}ms`)
}

const isDirectExecution = process.argv[1]?.includes('seed.ts')

if (isDirectExecution) {
  main()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
