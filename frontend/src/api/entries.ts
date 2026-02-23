/** Entries API: create, list, get, update, delete food entries. */
import client from './client'
import type { FoodEntry, FoodEntryCreate, PaginatedResponse, MealType } from '../types'

export const createEntry = (data: FoodEntryCreate) =>
  client.post<FoodEntry>('/entries/', data).then((r) => r.data)

export const getEntries = (params: {
  start_date: string
  end_date: string
  meal_type?: MealType | null
  page?: number
  page_size?: number
}) => client.get<PaginatedResponse<FoodEntry>>('/entries/', { params }).then((r) => r.data)

export const getEntry = (id: string) =>
  client.get<FoodEntry>(`/entries/${id}`).then((r) => r.data)

export const updateEntry = (id: string, data: Partial<FoodEntryCreate>) =>
  client.put<FoodEntry>(`/entries/${id}`, data).then((r) => r.data)

export const deleteEntry = (id: string) =>
  client.delete(`/entries/${id}`)
