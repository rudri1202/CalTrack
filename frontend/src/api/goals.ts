/** Goals API: get and update calorie/nutrient targets. */
import client from './client'
import type { Goal } from '../types'

export const getGoals = () =>
  client.get<Goal>('/goals/').then((r) => r.data)

export const updateGoals = (data: Partial<Goal>) =>
  client.put<Goal>('/goals/', data).then((r) => r.data)
