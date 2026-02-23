/** Hook for entries state: fetch, add, remove with loading/error handling. */
import { useState, useCallback } from 'react'
import { getEntries, createEntry, deleteEntry } from '../api/entries'
import type { FoodEntry, FoodEntryCreate, MealType, PaginatedResponse } from '../types'

export function useEntries() {
  const [entries, setEntries] = useState<PaginatedResponse<FoodEntry> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(
    async (params: {
      start_date: string
      end_date: string
      meal_type?: MealType | null
      page?: number
      page_size?: number
    }) => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getEntries(params)
        setEntries(data)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch entries'
        setError(msg)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const addEntry = useCallback(async (data: FoodEntryCreate) => {
    const entry = await createEntry(data)
    return entry
  }, [])

  const removeEntry = useCallback(async (id: string) => {
    await deleteEntry(id)
  }, [])

  return { entries, isLoading, error, fetchEntries, addEntry, removeEntry }
}
