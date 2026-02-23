/** Reports API: weekly calories, macro/micro breakdown, goal comparison. */
import client from './client'
import type {
  WeeklyCaloriesReport,
  MacroBreakdownReport,
  MicroSummaryReport,
  GoalComparisonReport,
} from '../types'

export const getWeeklyCalories = (start_date: string, end_date: string) =>
  client.get<WeeklyCaloriesReport>('/reports/weekly-calories', { params: { start_date, end_date } }).then((r) => r.data)

export const getMacroBreakdown = (start_date: string, end_date: string) =>
  client.get<MacroBreakdownReport>('/reports/macro-breakdown', { params: { start_date, end_date } }).then((r) => r.data)

export const getMicroSummary = (start_date: string, end_date: string) =>
  client.get<MicroSummaryReport>('/reports/micro-summary', { params: { start_date, end_date } }).then((r) => r.data)

export const getGoalComparison = (start_date: string, end_date: string) =>
  client.get<GoalComparisonReport>('/reports/goal-comparison', { params: { start_date, end_date } }).then((r) => r.data)
