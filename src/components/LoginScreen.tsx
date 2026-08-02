import { useState, type FormEvent } from 'react'
import { Cable, LogIn } from 'lucide-react'

export function LoginScreen({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onLogin(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inloggen mislukt')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-accent)] text-[#041016] shadow-[0_0_40px_rgba(34,211,238,0.35)]">
            <Cable className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight">
            LabelMaker Pro
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Log in om labels te beheren</p>
        </div>

        <form onSubmit={(e) => void submit(e)} className="panel space-y-4">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              E-mail
            </label>
            <input
              className="field"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="naam@bedrijf.nl"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Wachtwoord
            </label>
            <input
              className="field"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-[var(--color-danger)]/40 bg-[rgba(248,113,113,0.08)] px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-primary w-full justify-center" disabled={busy}>
            <LogIn className="h-4 w-4" />
            {busy ? 'Bezig…' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  )
}
