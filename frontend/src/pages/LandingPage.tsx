/** Public landing page — shown to unauthenticated visitors at "/". */
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  MessageSquare, Target, BarChart3, Upload,
  Sun, Moon, Zap, Shield, ArrowRight,
} from 'lucide-react'

// Six curated Unsplash food photographs used as mosaic background
const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=75',
  'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=75',
  'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=75',
  'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=75',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=75',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=75',
]

const FEATURES = [
  {
    icon: Target,
    title: 'Smart Goals',
    desc: 'Auto-calculated from your body profile using Mifflin-St Jeor BMR + TDEE. Fully overridable.',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  {
    icon: MessageSquare,
    title: 'AI Nutrition Chat',
    desc: 'Chat with an AI nutrition coach powered by Llama 3.3 70B. It can log meals and update goals for you.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: BarChart3,
    title: 'Rich Analytics',
    desc: 'Daily trends, macro breakdowns, goal vs actual charts, and micronutrient summaries.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: Upload,
    title: 'PDF Import',
    desc: 'Bulk-import from any exported nutrition diary PDF. Smart column detection, per-row validation.',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
]

const STATS = [
  { value: '4', label: 'Meal types' },
  { value: 'BMR', label: 'Auto goal calc' },
  { value: 'AI', label: 'Nutrition coach' },
  { value: 'PDF', label: 'Bulk import' },
]

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Already logged in → go straight to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">

      {/* ── Background food mosaic ─────────────────────────────── */}
      <div className="fixed inset-0 z-0">
        <div className="grid grid-cols-3 grid-rows-2 h-full w-full">
          {FOOD_IMAGES.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="w-full h-full object-cover"
              loading={i < 3 ? 'eager' : 'lazy'}
            />
          ))}
        </div>
        {/* Multi-layer dark overlay for readability */}
        <div className="absolute inset-0 bg-gray-950/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-transparent to-gray-950/80" />
        <div className="absolute inset-0 backdrop-blur-[1px]" />
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Navbar */}
        <header className="flex items-center justify-between px-6 sm:px-12 py-5">
          <span className="text-2xl font-bold text-primary-400 tracking-tight">CalTrack</span>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link
              to="/login"
              className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 sm:py-24">
          <div className="inline-flex items-center gap-2 bg-primary-500/15 border border-primary-500/30 text-primary-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            <Zap size={12} />
            AI-Powered Nutrition Tracking
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight max-w-3xl">
            Track smarter.{' '}
            <span className="bg-gradient-to-r from-primary-400 to-green-300 bg-clip-text text-transparent">
              Eat better.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-xl leading-relaxed">
            CalTrack combines precise calorie logging, automatic goal calculation,
            AI-powered meal analysis, and rich analytics — all in one place.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <Link
              to="/register"
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-primary-900/40"
            >
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium px-8 py-3.5 rounded-xl text-base transition-colors backdrop-blur-sm"
            >
              Sign In
            </Link>
          </div>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden border border-white/10 w-full max-w-2xl">
            {STATS.map(({ value, label }) => (
              <div key={label} className="bg-gray-950/60 backdrop-blur-sm px-6 py-4 text-center">
                <p className="text-2xl font-bold text-primary-400">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </main>

        {/* Features */}
        <section className="px-6 sm:px-12 pb-20 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className={`rounded-2xl border p-5 backdrop-blur-md bg-gray-900/60 ${bg} flex flex-col gap-3`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gray-800/80`}>
                  <Icon size={18} className={color} />
                </div>
                <h3 className="font-semibold text-white text-sm">{title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-gray-500">
            <Shield size={12} />
            JWT-secured · Async FastAPI backend · PostgreSQL · Open source
          </div>
        </section>

      </div>
    </div>
  )
}
