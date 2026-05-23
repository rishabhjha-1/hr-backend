import { Router, type Router as ExpressRouter } from 'express'
import { computeSalaryStats } from '../domain/salaryInsights.js'
import { employeeRepository } from '../repositories/employeeRepository.js'

export const insightsRouter: ExpressRouter = Router()

insightsRouter.get('/summary', async (_req, res) => {
  const summary = await employeeRepository.getOrganizationSummary()
  res.json(summary)
})

insightsRouter.get('/countries', async (_req, res) => {
  const countries = await employeeRepository.getCountrySummaries()
  res.json(countries)
})

insightsRouter.get('/countries/:country', async (req, res) => {
  const salaries = await employeeRepository.getSalariesByCountry(req.params.country)
  if (salaries.length === 0) {
    res.status(404).json({ error: 'No employees found for this country' })
    return
  }

  const jobTitles = await employeeRepository.getJobTitleSummariesByCountry(req.params.country)

  res.json({
    country: req.params.country,
    ...computeSalaryStats(salaries),
    jobTitles,
  })
})

insightsRouter.get('/countries/:country/job-titles/:jobTitle', async (req, res) => {
  const salaries = await employeeRepository.getSalariesByCountryAndJobTitle(
    req.params.country,
    req.params.jobTitle,
  )

  if (salaries.length === 0) {
    res.status(404).json({ error: 'No employees found for this country and job title' })
    return
  }

  res.json({
    country: req.params.country,
    jobTitle: req.params.jobTitle,
    ...computeSalaryStats(salaries),
  })
})
