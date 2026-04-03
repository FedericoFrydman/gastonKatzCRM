import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setSuccess(null)
    setError(null)

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'Email o contraseña incorrectos'
            : error.message,
        )
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess(
          'Cuenta creada. Si tenés confirmación por email activa, revisá tu bandeja para continuar.',
        )
        setMode('login')
        setConfirmPassword('')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-700/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-500 rounded-xl mb-4">
            <span className="text-white text-xl font-bold">G</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">GastonKatz CRM</h1>
          <p className="text-zinc-500 text-sm mt-1">Administración de eventos</p>
        </div>

        <div className="mb-4 flex rounded-lg border border-surface-border bg-surface-tertiary p-1">
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setError(null)
              setSuccess(null)
            }}
            className={
              mode === 'login'
                ? 'flex-1 rounded-md bg-brand-500 text-white text-sm font-medium py-1.5'
                : 'flex-1 rounded-md text-zinc-400 text-sm font-medium py-1.5 hover:text-zinc-200'
            }
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setError(null)
              setSuccess(null)
            }}
            className={
              mode === 'signup'
                ? 'flex-1 rounded-md bg-brand-500 text-white text-sm font-medium py-1.5'
                : 'flex-1 rounded-md text-zinc-400 text-sm font-medium py-1.5 hover:text-zinc-200'
            }
          >
            Crear cuenta
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
          className="card space-y-4"
        >
          <div>
            <label htmlFor="email" className="label-base">Email</label>
            <input
              id="email"
              type="email"
              className="input-base"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value) }}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="label-base">Contraseña</label>
            <input
              id="password"
              type="password"
              className="input-base"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value) }}
              required
              autoComplete="current-password"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label htmlFor="confirm-password" className="label-base">Confirmar contraseña</label>
              <input
                id="confirm-password"
                type="password"
                className="input-base"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                }}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {success && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-emerald-400 text-sm"
            >
              {success}
            </motion.p>
          )}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className="btn-primary w-full justify-center"
            disabled={loading}
          >
            {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
