/** Card displaying a single food entry with macros and delete action. */
import { Trash2 } from 'lucide-react'
import type { FoodEntry } from '../types'

interface Props {
  entry: FoodEntry
  onDelete?: (id: string) => void
}

const mealColors: Record<string, string> = {
  breakfast: 'bg-yellow-100 text-yellow-800',
  lunch: 'bg-green-100 text-green-800',
  dinner: 'bg-blue-100 text-blue-800',
  snack: 'bg-purple-100 text-purple-800',
}

export default function FoodEntryCard({ entry, onDelete }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full capitalize ${mealColors[entry.meal_type] || 'bg-gray-100 text-gray-700'}`}
            >
              {entry.meal_type}
            </span>
            <h3 className="font-medium text-gray-900 truncate">{entry.food_name}</h3>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {entry.quantity} {entry.quantity_unit}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-semibold text-gray-900">{Math.round(entry.calories)} kcal</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-4 text-xs text-gray-500">
          <span>P: {entry.protein_g.toFixed(1)}g</span>
          <span>C: {entry.carbs_g.toFixed(1)}g</span>
          <span>F: {entry.fat_g.toFixed(1)}g</span>
          {entry.fiber_g != null && <span>Fiber: {entry.fiber_g.toFixed(1)}g</span>}
        </div>
        {onDelete && (
          <button
            onClick={() => onDelete(entry.id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
            aria-label="Delete entry"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
