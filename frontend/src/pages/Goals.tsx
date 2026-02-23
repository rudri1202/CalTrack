/** Goals page: view and update daily calorie and macro targets. */
import { useState, useEffect } from 'react'
import { Target, CheckCircle, Sparkles, PencilLine } from 'lucide-react'
import { getGoals, updateGoals } from '../api/goals'
import type { Goal } from '../types'
import GoalForm from '../components/GoalForm'

export default function Goals() {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getGoals()
      .then(setGoal)
      .catch(() => setGoal(null))
      .finally(() => setIsLoading(false))
  }, [])

  const handleSubmit = async (data: Partial<Goal>) => {
    setIsSaving(true)
    setError(null)
    try {
      const updated = await updateGoals(data)
      setGoal(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (_) {
      setError('Failed to save goals. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 dark:border-primary-400" />
      </div>
    )
  }

  // Calculate macro percentages for display
  const totalMacroCalories = goal
    ? goal.protein_g * 4 + goal.carbs_g * 4 + goal.fat_g * 9
    : 0
  const macroPercents = goal && totalMacroCalories > 0
    ? {
        protein: ((goal.protein_g * 4) / totalMacroCalories * 100).toFixed(0),
        carbs: ((goal.carbs_g * 4) / totalMacroCalories * 100).toFixed(0),
        fat: ((goal.fat_g * 9) / totalMacroCalories * 100).toFixed(0),
      }
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <Target className="text-primary-600 dark:text-primary-400" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nutrition Goals</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Set your daily targets</p>
        </div>
      </div>

      {/* Current goals summary */}
      {goal && macroPercents && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Current Goals</h2>
            {goal.is_custom ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
                <PencilLine size={12} /> Custom
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-full">
                <Sparkles size={12} /> Auto-calculated
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{goal.daily_calories}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">kcal / day</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{goal.protein_g}g</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Protein ({macroPercents.protein}%)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500">{goal.carbs_g}g</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Carbs ({macroPercents.carbs}%)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{goal.fat_g}g</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Fat ({macroPercents.fat}%)</p>
            </div>
          </div>
          {goal.weight_goal_kg && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Weight goal: <span className="font-semibold text-gray-700 dark:text-gray-300">{goal.weight_goal_kg} kg</span>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Update Goals</h2>

        {saved && (
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm mb-4">
            <CheckCircle size={16} />
            Goals saved successfully!
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <GoalForm
          onSubmit={handleSubmit}
          initialValues={goal || undefined}
          isLoading={isSaving}
        />
      </div>
    </div>
  )
}
