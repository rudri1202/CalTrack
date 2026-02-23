/** Form to edit daily calorie and macro goals. */
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Goal } from '../types'

const schema = z.object({
  daily_calories: z.coerce.number().int().positive(),
  protein_g: z.coerce.number().min(0),
  carbs_g: z.coerce.number().min(0),
  fat_g: z.coerce.number().min(0),
  weight_goal_kg: z.coerce.number().positive().optional().nullable(),
})

type FormData = z.infer<typeof schema>

interface Props {
  onSubmit: (data: Partial<Goal>) => Promise<void>
  initialValues?: Partial<Goal>
  isLoading?: boolean
}

export default function GoalForm({ onSubmit, initialValues, isLoading = false }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      daily_calories: initialValues?.daily_calories || 2000,
      protein_g: initialValues?.protein_g || 150,
      carbs_g: initialValues?.carbs_g || 250,
      fat_g: initialValues?.fat_g || 65,
      weight_goal_kg: initialValues?.weight_goal_kg || null,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Calorie Target (kcal)</label>
        <input
          type="number"
          {...register('daily_calories')}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {errors.daily_calories && <p className="text-xs text-red-500 mt-1">{errors.daily_calories.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { name: 'protein_g' as const, label: 'Protein (g)' },
          { name: 'carbs_g' as const, label: 'Carbs (g)' },
          { name: 'fat_g' as const, label: 'Fat (g)' },
        ].map(({ name, label }) => (
          <div key={name}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input
              type="number"
              step="0.1"
              {...register(name)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]?.message}</p>}
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight Goal (kg, optional)</label>
        <input
          type="number"
          step="0.1"
          {...register('weight_goal_kg')}
          placeholder="e.g. 70"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Saving...' : 'Save Goals'}
      </button>
    </form>
  )
}
