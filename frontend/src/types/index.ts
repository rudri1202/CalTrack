/** Shared TypeScript types for CalTrack API responses and forms. */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type MessageRole = 'user' | 'assistant'

export type Gender = 'male' | 'female'
export type GoalType = 'bulking' | 'cutting' | 'maintenance'

export interface User {
  id: string
  email: string
  name: string
  height_cm: number | null
  weight_kg: number | null
  age: number | null
  gender: Gender | null
  goal_type: GoalType | null
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface Goal {
  id: string
  user_id: string
  daily_calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  weight_goal_kg: number | null
  is_custom: boolean
  created_at: string
  updated_at: string
}

export interface ImportResult {
  imported: number
  failed: number
  errors: string[]
}

export interface FoodEntry {
  id: string
  user_id: string
  meal_type: MealType
  food_name: string
  quantity: number
  quantity_unit: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  sugar_g: number | null
  sodium_mg: number | null
  micronutrients: Record<string, number> | null
  image_url: string | null
  logged_at: string
  created_at: string
  updated_at: string
}

export interface FoodEntryCreate {
  meal_type: MealType
  food_name: string
  quantity: number
  quantity_unit: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g?: number | null
  sugar_g?: number | null
  sodium_mg?: number | null
  micronutrients?: Record<string, number> | null
  logged_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface DailyCalories {
  date: string
  calories: number
  entry_count: number
}

export interface WeeklyCaloriesReport {
  data: DailyCalories[]
  start_date: string
  end_date: string
  average_daily_calories: number
}

export interface DailyMacros {
  date: string
  protein_g: number
  carbs_g: number
  fat_g: number
  calories: number
}

export interface MacroBreakdownReport {
  data: DailyMacros[]
  start_date: string
  end_date: string
  totals: { protein_g: number; carbs_g: number; fat_g: number }
}

export interface MicroSummaryReport {
  start_date: string
  end_date: string
  fiber_g: number
  sugar_g: number
  sodium_mg: number
  micronutrients: Record<string, number>
}

export interface GoalActual {
  date: string
  goal_calories: number
  actual_calories: number
  goal_protein_g: number
  actual_protein_g: number
  goal_carbs_g: number
  actual_carbs_g: number
  goal_fat_g: number
  actual_fat_g: number
}

export interface GoalComparisonReport {
  data: GoalActual[]
  start_date: string
  end_date: string
  goal: { daily_calories: number; protein_g: number; carbs_g: number; fat_g: number }
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  created_at: string
}

export interface ChatResponse {
  message: ChatMessage
  actions_taken: string[]
}

export interface AIAnalysisResult {
  food_name: string
  quantity: number
  quantity_unit: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number | null
  sugar_g: number | null
  sodium_mg: number | null
  micronutrients: Record<string, number> | null
}
