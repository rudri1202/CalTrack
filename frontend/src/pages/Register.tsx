/** Registration form: account details + optional profile for auto goal calculation. */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { register as registerUser } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon, ChevronDown, ChevronUp } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  // Optional profile fields
  height_cm: z.coerce.number().positive('Must be positive').optional().nullable(),
  weight_kg: z.coerce.number().positive('Must be positive').optional().nullable(),
  age: z.coerce.number().int().min(10, 'Min 10').max(120, 'Max 120').optional().nullable(),
  gender: z.enum(['male', 'female']).optional().nullable(),
  goal_type: z.enum(['bulking', 'cutting', 'maintenance']).optional().nullable(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const GOAL_TYPE_LABELS = {
  bulking: 'Bulking (calorie surplus)',
  cutting: 'Cutting (calorie deficit)',
  maintenance: 'Maintenance (TDEE)',
}

export default function Register() {
  const { setTokens } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [apiError, setApiError] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setApiError(null)
    try {
      const response = await registerUser({
        email: data.email,
        password: data.password,
        name: data.name,
        height_cm: data.height_cm || null,
        weight_kg: data.weight_kg || null,
        age: data.age || null,
        gender: data.gender || null,
        goal_type: data.goal_type || null,
      })
      setTokens(response.access_token, response.refresh_token, response.user)
      // If profile was filled, goals are pre-calculated → go to dashboard
      // Otherwise → go to goals page to set them manually
      const hasProfile = data.height_cm && data.weight_kg && data.age && data.gender && data.goal_type
      navigate(hasProfile ? '/dashboard' : '/goals')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Registration failed. Please try again.'
      setApiError(msg)
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500'
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center px-4 py-8 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md border border-transparent dark:border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">CalTrack</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {apiError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
              {apiError}
            </div>
          )}

          <div>
            <label className={labelClass}>Name</label>
            <input type="text" {...register('name')} placeholder="Your name" className={inputClass} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input type="email" {...register('email')} placeholder="you@example.com" className={inputClass} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Password</label>
            <input type="password" {...register('password')} placeholder="At least 8 characters" className={inputClass} />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Confirm Password</label>
            <input type="password" {...register('confirmPassword')} placeholder="Repeat password" className={inputClass} />
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {/* Optional profile section */}
          <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowProfile((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <span>Auto-calculate goals from my profile <span className="text-gray-400 dark:text-gray-500">(optional)</span></span>
              {showProfile ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showProfile && (
              <div className="px-4 pb-4 space-y-3 border-t border-dashed border-gray-200 dark:border-gray-700 pt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Fill in all fields to get calorie and macro goals auto-calculated using Mifflin-St Jeor. You can always override them later.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Height (cm)</label>
                    <input type="number" step="0.1" {...register('height_cm')} placeholder="e.g. 175" className={inputClass} />
                    {errors.height_cm && <p className="text-xs text-red-500 mt-1">{errors.height_cm.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Weight (kg)</label>
                    <input type="number" step="0.1" {...register('weight_kg')} placeholder="e.g. 75" className={inputClass} />
                    {errors.weight_kg && <p className="text-xs text-red-500 mt-1">{errors.weight_kg.message}</p>}
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Age</label>
                  <input type="number" {...register('age')} placeholder="e.g. 25" className={inputClass} />
                  {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Gender</label>
                    <select {...register('gender')} className={inputClass}>
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Goal</label>
                    <select {...register('goal_type')} className={inputClass}>
                      <option value="">Select</option>
                      {(Object.entries(GOAL_TYPE_LABELS) as [string, string][]).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors mt-2"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
