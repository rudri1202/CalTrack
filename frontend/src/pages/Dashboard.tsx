/** Dashboard: today's calorie/macro summary, quick stats, and recent meals. */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Target, Flame, Beef, Wheat, Droplets, Plus } from 'lucide-react'
import { getEntries } from '../api/entries'
import { getGoals } from '../api/goals'
import { useAuth } from '../context/AuthContext'
import type { FoodEntry, Goal } from '../types'
import FoodEntryCard from '../components/FoodEntryCard'
import { deleteEntry } from '../api/entries'

interface MacroSummary {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

function MacroBar({ label, actual, goal, color }: { label: string; actual: number; goal: number; color: string }) {
  const pct = Math.min((actual / goal) * 100, 100)
  const over = actual > goal
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className={over ? 'text-red-600 font-semibold' : 'text-gray-500'}>
          {actual.toFixed(0)} / {goal}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${over ? 'bg-red-400' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [entries, setEntries] = useState<FoodEntry[]>([])
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const [entriesData, goalData] = await Promise.all([
          getEntries({ start_date: today, end_date: today, page_size: 100 }),
          getGoals().catch(() => null),
        ])
        setEntries(entriesData.items)
        setGoal(goalData)
      } catch (_) {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [today])

  const totals: MacroSummary = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein_g: acc.protein_g + e.protein_g,
      carbs_g: acc.carbs_g + e.carbs_g,
      fat_g: acc.fat_g + e.fat_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )

  const goals = goal || { daily_calories: 2000, protein_g: 150, carbs_g: 250, fat_g: 65 }
  const remaining = goals.daily_calories - totals.calories

  const handleDelete = async (id: string) => {
    await deleteEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good day, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-500 text-sm">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Link
          to="/meals"
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Log Meal
        </Link>
      </div>

      {/* Calorie summary card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="text-orange-500" size={20} />
          <h2 className="font-semibold text-gray-900">Today's Calories</h2>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <p className="text-5xl font-bold text-gray-900">{Math.round(totals.calories)}</p>
            <p className="text-sm text-gray-500 mt-1">of {goals.daily_calories} kcal goal</p>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Remaining</span>
              <span className={remaining < 0 ? 'text-red-600 font-semibold' : 'text-primary-600 font-semibold'}>
                {remaining < 0 ? `${Math.abs(Math.round(remaining))} over` : `${Math.round(remaining)} left`}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${remaining < 0 ? 'bg-red-400' : 'bg-primary-500'}`}
                style={{ width: `${Math.min((totals.calories / goals.daily_calories) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Macros breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Macros</h2>
        <div className="space-y-3">
          <MacroBar label="Protein" actual={totals.protein_g} goal={goals.protein_g} color="bg-blue-500" />
          <MacroBar label="Carbs" actual={totals.carbs_g} goal={goals.carbs_g} color="bg-yellow-400" />
          <MacroBar label="Fat" actual={totals.fat_g} goal={goals.fat_g} color="bg-red-400" />
        </div>
      </div>

      {/* Quick stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Calories', value: `${Math.round(totals.calories)}`, unit: 'kcal', icon: Flame, color: 'text-orange-500 bg-orange-50' },
          { label: 'Protein', value: `${totals.protein_g.toFixed(1)}`, unit: 'g', icon: Beef, color: 'text-blue-500 bg-blue-50' },
          { label: 'Carbs', value: `${totals.carbs_g.toFixed(1)}`, unit: 'g', icon: Wheat, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Fat', value: `${totals.fat_g.toFixed(1)}`, unit: 'g', icon: Droplets, color: 'text-red-500 bg-red-50' },
        ].map(({ label, value, unit, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`inline-flex p-2 rounded-lg mb-2 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {value}<span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Today's meals */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Today's Meals ({entries.length})</h2>
          <Link to="/meals" className="text-sm text-primary-600 hover:underline">
            View all
          </Link>
        </div>
        {entries.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500 mb-3">No meals logged today</p>
            <Link
              to="/meals"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              <Plus size={16} />
              Add your first meal
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 5).map((entry) => (
              <FoodEntryCard key={entry.id} entry={entry} onDelete={handleDelete} />
            ))}
            {entries.length > 5 && (
              <Link to="/meals" className="block text-center text-sm text-primary-600 hover:underline py-2">
                View {entries.length - 5} more entries
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
