/** Form to add/edit a food entry with meal type, macros, and optional prefill from AI. */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import type { FoodEntryCreate, MealType, AIAnalysisResult } from '../types'

const schema = z.object({
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  food_name: z.string().min(1, 'Food name required'),
  quantity: z.coerce.number().positive('Must be positive'),
  quantity_unit: z.string().min(1),
  calories: z.coerce.number().min(0),
  protein_g: z.coerce.number().min(0),
  carbs_g: z.coerce.number().min(0),
  fat_g: z.coerce.number().min(0),
  fiber_g: z.coerce.number().min(0).optional().nullable(),
  sugar_g: z.coerce.number().min(0).optional().nullable(),
  sodium_mg: z.coerce.number().min(0).optional().nullable(),
  logged_at: z.string().min(1),
})

type FormData = z.infer<typeof schema>

interface Props {
  onSubmit: (data: FoodEntryCreate) => Promise<void>
  onCancel?: () => void
  prefill?: Partial<AIAnalysisResult>
  defaultMealType?: MealType
  defaultDate?: string
  isLoading?: boolean
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const UNITS = ['g', 'ml', 'oz', 'cup', 'piece', 'serving', 'tbsp', 'tsp']

export default function MealEntryForm({
  onSubmit,
  onCancel,
  prefill,
  defaultMealType = 'breakfast',
  defaultDate,
  isLoading = false,
}: Props) {
  const today = defaultDate || format(new Date(), 'yyyy-MM-dd')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      meal_type: defaultMealType,
      food_name: prefill?.food_name || '',
      quantity: prefill?.quantity || 1,
      quantity_unit: prefill?.quantity_unit || 'serving',
      calories: prefill?.calories || 0,
      protein_g: prefill?.protein_g || 0,
      carbs_g: prefill?.carbs_g || 0,
      fat_g: prefill?.fat_g || 0,
      fiber_g: prefill?.fiber_g || null,
      sugar_g: prefill?.sugar_g || null,
      sodium_mg: prefill?.sodium_mg || null,
      logged_at: today,
    },
  })

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit(data as FoodEntryCreate)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meal Type</label>
          <select
            {...register('meal_type')}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
          <input
            type="date"
            {...register('logged_at')}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Food Name</label>
        <input
          type="text"
          {...register('food_name')}
          placeholder="e.g. Grilled Chicken Breast"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {errors.food_name && <p className="text-xs text-red-500 mt-1">{errors.food_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
          <input
            type="number"
            step="0.1"
            {...register('quantity')}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
          <select
            {...register('quantity_unit')}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Macros</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'calories' as const, label: 'Calories (kcal)' },
            { name: 'protein_g' as const, label: 'Protein (g)' },
            { name: 'carbs_g' as const, label: 'Carbs (g)' },
            { name: 'fat_g' as const, label: 'Fat (g)' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
              <input
                type="number"
                step="0.1"
                {...register(name)}
                className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Micros (optional)</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'fiber_g' as const, label: 'Fiber (g)' },
            { name: 'sugar_g' as const, label: 'Sugar (g)' },
            { name: 'sodium_mg' as const, label: 'Sodium (mg)' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
              <input
                type="number"
                step="0.1"
                {...register(name)}
                placeholder="0"
                className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Saving...' : 'Log Entry'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
