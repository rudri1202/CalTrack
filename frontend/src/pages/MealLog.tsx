/** Meal log: date range, meal filter, add/edit/delete entries, image upload. */
import { useState, useEffect, useCallback } from 'react'
import { format, subDays } from 'date-fns'
import { Plus, Filter, X } from 'lucide-react'
import { getEntries, deleteEntry } from '../api/entries'
import type { FoodEntry, MealType, PaginatedResponse } from '../types'
import FoodEntryCard from '../components/FoodEntryCard'
import MealEntryForm from '../components/MealEntryForm'
import ImageUpload from './ImageUpload'
import { createEntry } from '../api/entries'
import type { FoodEntryCreate } from '../types'

const MEAL_TYPES: Array<{ value: MealType | ''; label: string }> = [
  { value: '', label: 'All meals' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

export default function MealLog() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [mealType, setMealType] = useState<MealType | ''>('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedResponse<FoodEntry> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchEntries = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getEntries({
        start_date: startDate,
        end_date: endDate,
        meal_type: mealType || undefined,
        page,
        page_size: 20,
      })
      setData(result)
    } catch (_) {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [startDate, endDate, mealType, page])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const handleDelete = async (id: string) => {
    await deleteEntry(id)
    fetchEntries()
  }

  const handleSubmit = async (entryData: FoodEntryCreate) => {
    setIsSubmitting(true)
    try {
      await createEntry(entryData)
      setShowForm(false)
      fetchEntries()
    } finally {
      setIsSubmitting(false)
    }
  }

  const setQuickDate = (days: number | 'all') => {
    if (days === 'all') {
      setStartDate('2020-01-01')
      setEndDate(today)
    } else {
      setStartDate(format(subDays(new Date(), days), 'yyyy-MM-dd'))
      setEndDate(today)
    }
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meal Log</h1>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowImageUpload(true); setShowForm(false) }}
            className="flex items-center gap-2 border border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400 px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium"
          >
            AI Scan
          </button>
          <button
            onClick={() => { setShowForm(true); setShowImageUpload(false) }}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Log Entry
          </button>
        </div>
      </div>

      {/* Entry Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">New Food Entry</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={20} />
            </button>
          </div>
          <MealEntryForm
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            defaultDate={today}
            isLoading={isSubmitting}
          />
        </div>
      )}

      {/* Image Upload */}
      {showImageUpload && (
        <ImageUpload
          onClose={() => setShowImageUpload(false)}
          onEntryCreated={() => { setShowImageUpload(false); fetchEntries() }}
        />
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Meal Type</label>
            <select
              value={mealType}
              onChange={(e) => { setMealType(e.target.value as MealType | ''); setPage(1) }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-2 py-1.5 text-sm"
            >
              {MEAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Quick</label>
            <div className="flex gap-1">
              {([0, 1, 7, 'all'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setQuickDate(d)}
                  className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded px-1 py-1.5 transition-colors text-gray-900 dark:text-gray-100"
                >
                  {d === 0 ? 'Today' : d === 1 ? 'Yesterday' : d === 7 ? '7d' : 'All'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400" />
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">{data.total} entries found</p>
              {data.total > 0 && (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Math.round(data.items.reduce((s, e) => s + e.calories, 0))} kcal total
                </p>
              )}
            </div>
            <div className="space-y-2">
              {data.items.map((entry) => (
                <FoodEntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
              ))}
            </div>
            {data.total_pages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400">
                  {page} / {data.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={page === data.total_pages}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-100"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No entries found for this date range</p>
          </div>
        )}
      </div>
    </div>
  )
}
