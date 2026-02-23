/** Reports page: weekly calories, macro breakdown, micro summary, goal comparison charts. */
import { useState, useEffect } from 'react'
import { format, subDays } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { getWeeklyCalories, getMacroBreakdown, getMicroSummary, getGoalComparison } from '../api/reports'
import type { WeeklyCaloriesReport, MacroBreakdownReport, MicroSummaryReport, GoalComparisonReport } from '../types'

const MACRO_COLORS = { protein_g: '#3b82f6', carbs_g: '#f59e0b', fat_g: '#ef4444' }
const PIE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444']

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
}

export default function Reports() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const weekAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd')

  const [startDate, setStartDate] = useState(weekAgo)
  const [endDate, setEndDate] = useState(today)

  const [weeklyData, setWeeklyData] = useState<WeeklyCaloriesReport | null>(null)
  const [macroData, setMacroData] = useState<MacroBreakdownReport | null>(null)
  const [microData, setMicroData] = useState<MicroSummaryReport | null>(null)
  const [goalData, setGoalData] = useState<GoalComparisonReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [w, m, mi, g] = await Promise.all([
        getWeeklyCalories(startDate, endDate),
        getMacroBreakdown(startDate, endDate),
        getMicroSummary(startDate, endDate),
        getGoalComparison(startDate, endDate),
      ])
      setWeeklyData(w)
      setMacroData(m)
      setMicroData(mi)
      setGoalData(g)
    } catch (_) {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadData() }, [startDate, endDate])

  const formatDate = (d: string) => format(new Date(d + 'T00:00:00'), 'MMM d')

  // Pie data for macro totals
  const pieTotals = macroData
    ? [
        { name: 'Protein', value: macroData.totals.protein_g * 4 },
        { name: 'Carbs', value: macroData.totals.carbs_g * 4 },
        { name: 'Fat', value: macroData.totals.fat_g * 9 },
      ]
    : []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => {
                setStartDate(format(subDays(new Date(), d - 1), 'yyyy-MM-dd'))
                setEndDate(today)
              }}
              className="text-sm bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 transition-colors"
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Weekly Calorie Trend */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <SectionHeader title="Daily Calorie Intake" />
            {weeklyData && weeklyData.data.length > 0 ? (
              <>
                <div className="mb-3 text-sm text-gray-500">
                  Average: <span className="font-semibold text-gray-700">{weeklyData.average_daily_calories.toFixed(0)} kcal/day</span>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={weeklyData.data.map((d) => ({ ...d, date: formatDate(d.date) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => [`${v.toFixed(0)} kcal`, 'Calories']} />
                    {goalData?.goal && (
                      <ReferenceLine y={goalData.goal.daily_calories} stroke="#16a34a" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#16a34a', fontSize: 11 }} />
                    )}
                    <Line type="monotone" dataKey="calories" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <p className="text-gray-500 text-sm py-8 text-center">No data for this period</p>
            )}
          </div>

          {/* Macro Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <SectionHeader title="Daily Macronutrients" />
              {macroData && macroData.data.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={macroData.data.map((d) => ({ ...d, date: formatDate(d.date) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} unit="g" />
                    <Tooltip formatter={(v: number, name: string) => [`${v.toFixed(1)}g`, name.replace('_g', '').replace('protein', 'Protein').replace('carbs', 'Carbs').replace('fat', 'Fat')]} />
                    <Legend formatter={(v) => v.replace('_g', '').replace('protein', 'Protein').replace('carbs', 'Carbs').replace('fat', 'Fat')} />
                    <Bar dataKey="protein_g" fill={MACRO_COLORS.protein_g} stackId="a" />
                    <Bar dataKey="carbs_g" fill={MACRO_COLORS.carbs_g} stackId="a" />
                    <Bar dataKey="fat_g" fill={MACRO_COLORS.fat_g} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500 text-sm py-8 text-center">No data for this period</p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <SectionHeader title="Macro Distribution (Total Period)" />
              {macroData && pieTotals.some((p) => p.value > 0) ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="60%" height={200}>
                    <PieChart>
                      <Pie data={pieTotals} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {pieTotals.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v.toFixed(0)} kcal`, '']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {[
                      { label: 'Protein', color: PIE_COLORS[0], g: macroData.totals.protein_g },
                      { label: 'Carbs', color: PIE_COLORS[1], g: macroData.totals.carbs_g },
                      { label: 'Fat', color: PIE_COLORS[2], g: macroData.totals.fat_g },
                    ].map(({ label, color, g }) => (
                      <div key={label} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                        <span className="text-gray-600">{label}</span>
                        <span className="font-semibold text-gray-900 ml-auto">{g.toFixed(0)}g</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm py-8 text-center">No data for this period</p>
              )}
            </div>
          </div>

          {/* Goal vs Actual */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <SectionHeader title="Goal vs Actual Calories" />
            {goalData && goalData.data.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={goalData.data.map((d) => ({ ...d, date: formatDate(d.date) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number, name: string) => [`${v.toFixed(0)} kcal`, name === 'actual_calories' ? 'Actual' : 'Goal']} />
                  <Legend formatter={(v) => v === 'actual_calories' ? 'Actual' : 'Goal'} />
                  <Bar dataKey="goal_calories" fill="#d1fae5" stroke="#22c55e" strokeWidth={1} />
                  <Bar dataKey="actual_calories" fill="#22c55e" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-sm py-8 text-center">No data for this period</p>
            )}
          </div>

          {/* Micronutrient Summary */}
          {microData && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <SectionHeader title="Micronutrient Summary" />
              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: 'Fiber', value: microData.fiber_g, unit: 'g' },
                  { label: 'Sugar', value: microData.sugar_g, unit: 'g' },
                  { label: 'Sodium', value: microData.sodium_mg, unit: 'mg' },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="text-center bg-gray-50 rounded-xl p-3">
                    <p className="text-xl font-bold text-gray-900">{value.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">{label} ({unit})</p>
                  </div>
                ))}
              </div>
              {Object.keys(microData.micronutrients).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Other Nutrients</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(microData.micronutrients).map(([key, val]) => (
                      <div key={key} className="bg-gray-50 rounded-lg px-3 py-2 text-sm">
                        <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="float-right font-medium text-gray-800">{val.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
