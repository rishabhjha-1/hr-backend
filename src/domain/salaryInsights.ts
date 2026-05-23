export type SalaryStats = {
  min: number
  max: number
  average: number
  count: number
}

export function computeSalaryStats(salaries: number[]): SalaryStats {
  if (salaries.length === 0) {
    return { min: 0, max: 0, average: 0, count: 0 }
  }

  const min = Math.min(...salaries)
  const max = Math.max(...salaries)
  const average = salaries.reduce((sum, salary) => sum + salary, 0) / salaries.length

  return {
    min,
    max,
    average: Math.round(average * 100) / 100,
    count: salaries.length,
  }
}

export function computeAverageSalary(salaries: number[]): number {
  return computeSalaryStats(salaries).average
}

export function groupSalariesByKey<T extends string>(
  records: Array<{ key: T; salary: number }>,
): Map<T, number[]> {
  const grouped = new Map<T, number[]>()

  for (const record of records) {
    const existing = grouped.get(record.key) ?? []
    existing.push(record.salary)
    grouped.set(record.key, existing)
  }

  return grouped
}
