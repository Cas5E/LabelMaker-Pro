import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Cable,
  Minus,
  Package,
  Plus,
  Printer,
  ImagePlus,
  LogOut,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  Warehouse,
  Scissors,
  X,
} from 'lucide-react'
import { BinLabel } from './components/BinLabel'
import { CableLabel } from './components/CableLabel'
import { LoginScreen } from './components/LoginScreen'
import { PreviewFrame } from './components/PreviewFrame'
import { PrintSheet } from './components/PrintSheet'
import { api, compressImageFile, fileToDataUrl } from './lib/api'
import { SIZE_PRESETS } from './lib/defaults'
import { capacityFor, paginateLabels } from './lib/layout'
import type {
  AppState,
  BatchTemplate,
  Bin,
  LabelItem,
  LabelKind,
  MeterColor,
  Preset,
  RentmanEquipmentOption,
  RentmanFolder,
} from './lib/types'

type Tab = 'labels' | 'bins' | 'colors' | 'company' | 'batches'

const emptyState: AppState = {
  profile: {
    logoDataUrl: null,
    companyTel: '',
    companyWeb: '',
    gapMm: 2,
    showCutMarks: true,
  },
  presets: [],
  meterColors: [],
  templates: [],
  bins: [],
  nextBinCode: 'BAK-001',
}

export default function App() {
  const [state, setState] = useState<AppState>(emptyState)
  const [auth, setAuth] = useState<'checking' | 'anon' | 'ok'>('checking')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [batch, setBatch] = useState<Record<string, number>>({})
  const [binBatch, setBinBatch] = useState<Record<string, number>>({})
  const [tab, setTab] = useState<Tab>('labels')
  const [binQuery, setBinQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const notify = (msg: string) => setToast(msg)

  const refresh = useCallback(async () => {
    const next = await api.getState()
    setState(next)
    setError(null)
    return next
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const me = await api.me()
        if (cancelled) return
        if (!me.authenticated) {
          setAuth('anon')
          setLoading(false)
          return
        }
        setUserEmail(me.email ?? null)
        setAuth('ok')
        await refresh()
      } catch (e) {
        if (cancelled) return
        const err = e as Error & { status?: number }
        if (err.status === 401) {
          setAuth('anon')
        } else {
          setError(err.message || 'API niet bereikbaar — start `npm run dev`')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refresh])

  const handleLogin = async (email: string, password: string) => {
    const me = await api.login(email, password)
    setUserEmail(me.email)
    setAuth('ok')
    setLoading(true)
    try {
      await refresh()
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden mislukt')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch {
      /* ignore */
    }
    setAuth('anon')
    setUserEmail(null)
    setState(emptyState)
  }

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 2200)
    return () => window.clearTimeout(t)
  }, [toast])

  const labels = useMemo<LabelItem[]>(() => {
    const out: LabelItem[] = []
    for (const p of state.presets) {
      const qty = batch[p.id] ?? 0
      for (let i = 0; i < qty; i++) {
        out.push({
          label: p.label,
          color: p.color,
          textColor: p.textColor,
          widthMm: p.widthMm,
          heightMm: p.heightMm,
          kind: p.kind,
          subtitle: p.subtitle,
          qrDataUrl: p.qrDataUrl,
          location: p.location,
        })
      }
    }
    for (const b of state.bins) {
      const qty = binBatch[b.id] ?? 0
      for (let i = 0; i < qty; i++) {
        out.push({
          label: b.code,
          color: '#0F172A',
          textColor: '#FFFFFF',
          widthMm: b.widthMm,
          heightMm: b.heightMm,
          kind: 'bin',
          subtitle: b.name,
          contents: b.contents,
          qrDataUrl: b.qrDataUrl,
          photoDataUrl: b.photoDataUrl,
          location: b.location,
        })
      }
    }
    return out
  }, [batch, binBatch, state.presets, state.bins])

  const pages = useMemo(
    () => paginateLabels(labels, state.profile.gapMm),
    [labels, state.profile.gapMm],
  )

  const filteredBins = useMemo(() => {
    const q = binQuery.trim().toLowerCase()
    if (!q) return state.bins
    return state.bins.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.contents.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q),
    )
  }, [state.bins, binQuery])

  const setQty = (presetId: string, qty: number) => {
    setBatch((b) => {
      const n = { ...b }
      if (qty <= 0) delete n[presetId]
      else n[presetId] = qty
      return n
    })
  }

  const setBinQty = (binId: string, qty: number) => {
    setBinBatch((b) => {
      const n = { ...b }
      if (qty <= 0) delete n[binId]
      else n[binId] = qty
      return n
    })
  }

  const upsertMeterColor = async (label: string, color: string, textColor: string) => {
    try {
      const meterColors = await api.upsertMeterColor(label, color, textColor)
      setState((s) => ({
        ...s,
        meterColors,
        presets: s.presets.map((p) =>
          p.kind === 'cable' && p.label.toLowerCase() === label.trim().toLowerCase()
            ? { ...p, color, textColor }
            : p,
        ),
      }))
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Kleur opslaan mislukt')
    }
  }

  const addPreset = async (kind: LabelKind) => {
    try {
      const preset = await api.createPreset({ kind })
      setState((s) => ({ ...s, presets: [...s.presets, preset] }))
      notify(kind === 'bin' ? 'Bak-labeltype toegevoegd' : 'Labeltype toegevoegd')
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Labeltype toevoegen mislukt')
    }
  }

  const updatePreset = async (id: string, patch: Partial<Preset>) => {
    try {
      await api.updatePreset(id, patch)
      await refresh()
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Labeltype opslaan mislukt')
      await refresh().catch(() => undefined)
    }
  }

  const deletePreset = async (id: string) => {
    try {
      await api.deletePreset(id)
      setBatch((b) => {
        const n = { ...b }
        delete n[id]
        return n
      })
      await refresh()
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Verwijderen mislukt')
    }
  }

  const saveTemplate = async () => {
    const items = [
      ...state.presets
        .filter((p) => (batch[p.id] ?? 0) > 0)
        .map((p) => ({
          label: p.label,
          color: p.color,
          textColor: p.textColor,
          qty: batch[p.id],
          widthMm: p.widthMm,
          heightMm: p.heightMm,
          kind: p.kind,
          subtitle: p.subtitle,
          qrDataUrl: p.qrDataUrl,
          location: p.location,
        })),
      ...state.bins
        .filter((b) => (binBatch[b.id] ?? 0) > 0)
        .map((b) => ({
          label: b.code,
          color: '#0F172A',
          textColor: '#FFFFFF',
          qty: binBatch[b.id],
          widthMm: b.widthMm,
          heightMm: b.heightMm,
          kind: 'bin' as const,
          subtitle: b.name,
          qrDataUrl: b.qrDataUrl,
          photoDataUrl: b.photoDataUrl,
          location: b.location,
        })),
    ]
    if (!items.length) return notify('Voeg eerst aantallen toe')
    const name = window.prompt('Naam voor dit sjabloon?')
    if (!name?.trim()) return
    await api.saveTemplate(name.trim(), items)
    await refresh()
    notify('Sjabloon opgeslagen')
  }

  const loadTemplate = (tpl: BatchTemplate) => {
    const nextPreset: Record<string, number> = {}
    const nextBin: Record<string, number> = {}
    for (const item of tpl.items) {
      if (item.kind === 'bin') {
        const match = state.bins.find((b) => b.code.toLowerCase() === item.label.toLowerCase())
        if (match) nextBin[match.id] = (nextBin[match.id] ?? 0) + item.qty
      } else {
        const match = state.presets.find(
          (p) =>
            p.label.toLowerCase() === item.label.toLowerCase() &&
            p.kind === (item.kind ?? 'cable'),
        )
        if (match) nextPreset[match.id] = (nextPreset[match.id] ?? 0) + item.qty
      }
    }
    setBatch(nextPreset)
    setBinBatch(nextBin)
    notify(`Sjabloon “${tpl.name}” geladen`)
  }

  const patchBinInState = (updated: Bin) => {
    setState((s) => ({
      ...s,
      bins: s.bins.map((b) => (b.id === updated.id ? updated : b)),
      nextBinCode: s.nextBinCode, // refreshed on full reload; fine for now
    }))
  }

  const createBin = async () => {
    const bin = await api.createBin({
      code: state.nextBinCode,
      name: '',
      contents: '',
      location: '',
    })
    const next = await refresh()
    setBinQty(bin.id, 1)
    setTab('bins')
    notify(`${bin.code} aangemaakt — vul naam & inhoud in`)
    void next
  }

  const updateBin = async (id: string, patch: Partial<Bin>) => {
    const updated = await api.updateBin(id, patch)
    patchBinInState(updated)
    return updated
  }

  const totalQty = labels.length

  if (auth === 'checking' || (auth === 'ok' && loading)) {
    return (
      <div className="grid min-h-screen place-items-center text-[var(--color-muted)]">
        {auth === 'checking' ? 'Sessie controleren…' : 'Database laden…'}
      </div>
    )
  }

  if (auth === 'anon') {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div className="panel max-w-md space-y-3">
          <h1 className="panel-title">API offline</h1>
          <p className="text-sm text-[var(--color-muted)]">{error}</p>
          <p className="text-sm text-[var(--color-muted)]">
            Start opnieuw met <code className="text-[var(--color-accent)]">npm run dev</code> —
            die zet frontend + SQLite-API tegelijk aan.
          </p>
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            Opnieuw proberen
          </button>
        </div>
        <StyleTag />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-20 border-b border-[var(--color-line)] bg-[rgba(11,18,32,0.88)] backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-accent)] text-[#041016]">
              <Cable className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight">
                LabelMaker Pro
              </h1>
              <p className="text-xs text-[var(--color-muted)]">
                SQLite · kabels · flightcases · magazijnbakken
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userEmail ? (
              <span className="hidden text-xs text-[var(--color-muted)] sm:inline">{userEmail}</span>
            ) : null}
            <button type="button" className="btn-ghost btn-sm" onClick={() => void handleLogout()}>
              <LogOut className="h-3.5 w-3.5" />
              Uitloggen
            </button>
            <button
              type="button"
              disabled={totalQty === 0}
              onClick={() => window.print()}
              className="btn-primary"
            >
              <Printer className="h-4 w-4" />
              Print ({totalQty})
            </button>
          </div>
        </div>
      </header>

      <main className="no-print mx-auto grid max-w-[1400px] gap-5 px-4 py-5 lg:grid-cols-[420px_1fr]">
        <aside className="space-y-4">
          <nav className="flex flex-wrap gap-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)] p-1">
            {(
              [
                ['labels', 'Labels'],
                ['bins', 'Bakken'],
                ['colors', 'Kleuren'],
                ['company', 'Bedrijf'],
                ['batches', 'Batches'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition ${
                  tab === id
                    ? 'bg-[var(--color-panel-2)] text-[var(--color-accent)] shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {tab === 'company' && (
            <section className="panel space-y-3">
              <h2 className="panel-title">Bedrijfsgegevens</h2>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-md border border-[var(--color-line)] bg-[var(--color-panel-2)]">
                  {state.profile.logoDataUrl ? (
                    <img
                      src={state.profile.logoDataUrl}
                      alt="logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-[var(--color-muted)]">geen logo</span>
                  )}
                </div>
                <button type="button" className="btn-ghost" onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Logo
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    try {
                      const compressed = await compressImageFile(f)
                      const profile = await api.uploadLogo(compressed)
                      setState((s) => ({ ...s, profile: { ...s.profile, ...profile } }))
                      notify('Logo opgeslagen')
                    } catch (err) {
                      notify(err instanceof Error ? err.message : 'Logo opslaan mislukt')
                    }
                    e.target.value = ''
                  }}
                />
              </div>
              <input
                className="field"
                value={state.profile.companyTel}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    profile: { ...s.profile, companyTel: e.target.value },
                  }))
                }
                onBlur={async () => {
                  try {
                    const profile = await api.patchProfile({ companyTel: state.profile.companyTel })
                    setState((s) => ({ ...s, profile: { ...s.profile, ...profile } }))
                  } catch (err) {
                    notify(err instanceof Error ? err.message : 'Telefoon opslaan mislukt')
                  }
                }}
                placeholder="Telefoon"
              />
              <input
                className="field"
                value={state.profile.companyWeb}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    profile: { ...s.profile, companyWeb: e.target.value },
                  }))
                }
                onBlur={async () => {
                  try {
                    const profile = await api.patchProfile({ companyWeb: state.profile.companyWeb })
                    setState((s) => ({ ...s, profile: { ...s.profile, ...profile } }))
                  } catch (err) {
                    notify(err instanceof Error ? err.message : 'Website opslaan mislukt')
                  }
                }}
                placeholder="www.voorbeeld.nl"
              />
            </section>
          )}

          {tab === 'colors' && (
            <section className="panel space-y-3">
              <h2 className="panel-title">Kleur per lengte</h2>
              <p className="text-xs text-[var(--color-muted)]">
                Opgeslagen in SQLite. Balk + tekstkleur — geel krijgt zwart.
              </p>
              <div className="space-y-2">
                {state.meterColors.map((c) => (
                  <MeterColorRow
                    key={c.id}
                    item={c}
                    onChange={(color, textColor) => upsertMeterColor(c.label, color, textColor)}
                    onDelete={async () => {
                      await api.deleteMeterColor(c.id)
                      await refresh()
                    }}
                  />
                ))}
              </div>
              <NewMeterColor onAdd={upsertMeterColor} />
            </section>
          )}

          {tab === 'labels' && (
            <section className="panel space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="panel-title">Label types</h2>
                <div className="flex gap-2">
                  <button type="button" className="btn-ghost btn-sm" onClick={() => addPreset('cable')}>
                    <Cable className="h-3.5 w-3.5" /> Kabel
                  </button>
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => addPreset('flightcase')}
                  >
                    <Package className="h-3.5 w-3.5" /> Flightcase
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {state.presets
                  .filter((p) => p.kind !== 'bin')
                  .map((p) => (
                    <PresetRow
                      key={p.id}
                      preset={p}
                      qty={batch[p.id] ?? 0}
                      onUpdate={(patch) => updatePreset(p.id, patch)}
                      onDelete={() => deletePreset(p.id)}
                      onQty={(q) => setQty(p.id, q)}
                    />
                  ))}
              </div>
            </section>
          )}

          {tab === 'bins' && (
            <section className="panel space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="panel-title">Magazijnbakken</h2>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Importeer uit Rentman of vul handmatig in.
                  </p>
                </div>
                <button type="button" className="btn-ghost btn-sm" onClick={() => void createBin()}>
                  <Warehouse className="h-3.5 w-3.5" /> Leeg
                </button>
              </div>

              <RentmanImportPanel
                onImported={async (bin) => {
                  await refresh()
                  setBinQty(bin.id, Math.max(1, binBatch[bin.id] ?? 1))
                  notify(`Geïmporteerd: ${bin.name || bin.code}`)
                }}
                onError={(msg) => notify(msg)}
              />

              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  className="field pl-8"
                  value={binQuery}
                  onChange={(e) => setBinQuery(e.target.value)}
                  placeholder="Zoeken in bakken…"
                />
              </div>
              <div className="space-y-3">
                {filteredBins.length === 0 && (
                  <p className="text-sm text-[var(--color-muted)]">
                    Nog geen bakken. Kies een Rentman-product hierboven.
                  </p>
                )}
                {filteredBins.map((b) => (
                  <BinRow
                    key={b.id}
                    bin={b}
                    logoUrl={state.profile.logoDataUrl}
                    qty={binBatch[b.id] ?? 0}
                    onQty={(q) => setBinQty(b.id, q)}
                    onSave={async (patch) => {
                      await updateBin(b.id, patch)
                      notify('Bak opgeslagen')
                    }}
                    onRegen={async () => {
                      const updated = await api.regenerateBinQr(b.id)
                      patchBinInState(updated)
                      notify('QR opnieuw gegenereerd')
                    }}
                    onUploadQr={async (file) => {
                      const qrDataUrl = await fileToDataUrl(file)
                      const updated = await api.updateBin(b.id, { qrDataUrl })
                      patchBinInState(updated)
                      notify('QR geüpload')
                    }}
                    onUploadPhoto={async (file) => {
                      const photoDataUrl = await fileToDataUrl(file)
                      const updated = await api.updateBin(b.id, { photoDataUrl })
                      patchBinInState(updated)
                      notify('Productfoto opgeslagen')
                    }}
                    onClearPhoto={async () => {
                      const updated = await api.updateBin(b.id, { photoDataUrl: null })
                      patchBinInState(updated)
                      notify('Foto verwijderd')
                    }}
                    onDelete={async () => {
                      await api.deleteBin(b.id)
                      setBinBatch((prev) => {
                        const n = { ...prev }
                        delete n[b.id]
                        return n
                      })
                      setState((s) => ({ ...s, bins: s.bins.filter((x) => x.id !== b.id) }))
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {tab === 'batches' && (
            <section className="panel space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="panel-title">Opgeslagen batches</h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => {
                      setBatch({})
                      setBinBatch({})
                    }}
                  >
                    Leegmaken
                  </button>
                  <button type="button" className="btn-ghost btn-sm" onClick={() => void saveTemplate()}>
                    <Save className="h-3.5 w-3.5" /> Opslaan
                  </button>
                </div>
              </div>
              {state.templates.length === 0 ? (
                <p className="text-xs text-[var(--color-muted)]">
                  Sla kabel- én bak-batches op in de database.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {state.templates.map((tpl) => {
                    const total = tpl.items.reduce((s, i) => s + i.qty, 0)
                    return (
                      <div
                        key={tpl.id}
                        className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] px-2 py-1.5"
                      >
                        <button
                          type="button"
                          className="flex-1 text-left text-sm hover:text-[var(--color-accent)]"
                          onClick={() => loadTemplate(tpl)}
                        >
                          <span className="font-medium">{tpl.name}</span>{' '}
                          <span className="text-[var(--color-muted)]">· {total} labels</span>
                        </button>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={async () => {
                            await api.deleteTemplate(tpl.id)
                            await refresh()
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          <section className="panel space-y-3 text-sm text-[var(--color-muted)]">
            <p>
              <strong className="text-[var(--color-ink)]">{totalQty}</strong> labels ·{' '}
              <strong className="text-[var(--color-ink)]">{pages.length || 0}</strong> A4 vel(len)
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span>Snijruimte</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={async () => {
                    const gapMm = Math.max(0, state.profile.gapMm - 1)
                    const profile = await api.patchProfile({ gapMm })
                    setState((s) => ({ ...s, profile: { ...s.profile, ...profile } }))
                  }}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={state.profile.gapMm}
                  onChange={async (e) => {
                    const gapMm = Math.max(0, Math.min(10, Number(e.target.value) || 0))
                    setState((s) => ({ ...s, profile: { ...s.profile, gapMm } }))
                    const profile = await api.patchProfile({ gapMm })
                    setState((s) => ({ ...s, profile: { ...s.profile, ...profile } }))
                  }}
                  className="field w-14 text-center"
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={async () => {
                    const gapMm = Math.min(10, state.profile.gapMm + 1)
                    const profile = await api.patchProfile({ gapMm })
                    setState((s) => ({ ...s, profile: { ...s.profile, ...profile } }))
                  }}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <span>mm</span>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-[var(--color-ink)]">
              <input
                type="checkbox"
                checked={state.profile.showCutMarks}
                onChange={async (e) => {
                  const profile = await api.patchProfile({ showCutMarks: e.target.checked })
                  setState((s) => ({ ...s, profile: { ...s.profile, ...profile } }))
                }}
                className="accent-[var(--color-accent)]"
              />
              <Scissors className="h-3.5 w-3.5 text-[var(--color-muted)]" />
              Snijhulplijnen
            </label>
          </section>
        </aside>

        <section>
          <div className="mb-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Voorbeeld</h2>
            <p className="text-xs text-[var(--color-muted)]">
              Exacte A4 · bakken met scannbare QR · data in SQLite (`data/labelmaker.db`)
            </p>
          </div>

          <div className="preview-stage">
            {pages.length === 0 ? (
              <div className="panel w-full max-w-[210mm] px-6 py-12 text-center text-[var(--color-muted)]">
                Stel aantallen in of maak een bak aan.
                <div className="mx-auto mt-8 flex flex-wrap justify-center gap-3 opacity-90">
                  <CableLabel
                    label="5M"
                    color="#2FA9E0"
                    textColor="#FFFFFF"
                    logoUrl={state.profile.logoDataUrl}
                  />
                  <div className="w-full max-w-[200mm] overflow-hidden rounded-lg border border-[var(--color-line)] bg-white p-1 text-left">
                    <div className="origin-top-left scale-[0.72]" style={{ width: '139%' }}>
                      <BinLabel
                        code="BAK-001"
                        name="DMX adapters"
                        contents="5-pin / 3-pin"
                        location="Stelling A2"
                        logoUrl={state.profile.logoDataUrl}
                        qrDataUrl={null}
                        photoDataUrl={null}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              pages.map((page, pi) => {
                const cap = capacityFor(page.widthMm, page.heightMm, page.gapMm)
                const kindLabel =
                  page.kind === 'bin'
                    ? 'Bak'
                    : page.kind === 'flightcase'
                      ? 'Flightcase'
                      : 'Kabel'
                return (
                  <div key={pi} className="w-full max-w-[210mm]">
                    <div className="mb-2 text-xs text-[var(--color-muted)]">
                      Vel {pi + 1} · {kindLabel} · {page.widthMm}×{page.heightMm} mm ·{' '}
                      {page.items.length}/{cap.perPage}
                    </div>
                    <PreviewFrame>
                      <PrintSheet
                        page={page}
                        logoUrl={state.profile.logoDataUrl}
                        companyTel={state.profile.companyTel}
                        companyWeb={state.profile.companyWeb}
                        showCutMarks={state.profile.showCutMarks}
                      />
                    </PreviewFrame>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </main>

      <div className="print-only">
        {pages.map((page, pi) => (
          <PrintSheet
            key={pi}
            page={page}
            logoUrl={state.profile.logoDataUrl}
            companyTel={state.profile.companyTel}
            companyWeb={state.profile.companyWeb}
            showCutMarks={state.profile.showCutMarks}
          />
        ))}
      </div>

      {toast && (
        <div className="no-print fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[var(--color-line)] bg-[var(--color-panel)] px-4 py-2 text-sm shadow-xl">
          {toast}
        </div>
      )}

      <StyleTag />
    </div>
  )
}

function StyleTag() {
  return (
    <style>{`
      .panel {
        border: 1px solid var(--color-line);
        background: linear-gradient(180deg, var(--color-panel) 0%, rgba(18,26,43,0.92) 100%);
        border-radius: 0.9rem;
        padding: 1rem;
      }
      .panel-title {
        margin: 0;
        font-family: var(--font-display);
        font-size: 1rem;
        font-weight: 700;
      }
      .field {
        width: 100%;
        border: 1px solid var(--color-line);
        background: var(--color-panel-2);
        color: var(--color-ink);
        border-radius: 0.55rem;
        padding: 0.45rem 0.65rem;
        outline: none;
      }
      .field:focus {
        border-color: color-mix(in oklab, var(--color-accent) 60%, var(--color-line));
        box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.12);
      }
      .btn-primary, .btn-ghost, .icon-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        border-radius: 0.6rem;
        border: 1px solid transparent;
        cursor: pointer;
        transition: 0.15s ease;
      }
      .btn-primary {
        background: linear-gradient(135deg, var(--color-accent), var(--color-accent-2));
        color: #041016;
        font-weight: 700;
        padding: 0.55rem 0.9rem;
      }
      .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
      .btn-ghost {
        background: var(--color-panel-2);
        border-color: var(--color-line);
        color: var(--color-ink);
        padding: 0.5rem 0.75rem;
      }
      .btn-ghost:hover, .icon-btn:hover {
        border-color: color-mix(in oklab, var(--color-accent) 45%, var(--color-line));
      }
      .btn-sm { padding: 0.35rem 0.55rem; font-size: 0.8rem; }
      .icon-btn {
        width: 2rem; height: 2rem;
        background: var(--color-panel-2);
        border-color: var(--color-line);
        color: var(--color-ink);
      }
      .tone-btn {
        width: 1.7rem; height: 1.7rem; border-radius: 0.45rem;
        border: 1px solid var(--color-line); background: #0a0f1a; color: #fff;
        font-size: 0.7rem; font-weight: 800; cursor: pointer;
      }
      .tone-btn--light { background: #fff; color: #0a0f1a; }
      .tone-btn--active { outline: 2px solid var(--color-accent); outline-offset: 1px; }
    `}</style>
  )
}

function ColorSwatch({
  value,
  onChange,
  title,
}: {
  value: string
  onChange: (v: string) => void
  title: string
}) {
  return (
    <label
      className="relative inline-flex h-9 w-9 cursor-pointer overflow-hidden rounded-lg border border-[var(--color-line)]"
      title={title}
    >
      <span className="absolute inset-0" style={{ background: value }} />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  )
}

function TextToneButtons({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const isBlack = value.toLowerCase() === '#000000' || value.toLowerCase() === '#000'
  const isWhite = value.toLowerCase() === '#ffffff' || value.toLowerCase() === '#fff'
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={`tone-btn ${isBlack ? 'tone-btn--active' : ''}`}
        onClick={() => onChange('#000000')}
      >
        Z
      </button>
      <button
        type="button"
        className={`tone-btn tone-btn--light ${isWhite ? 'tone-btn--active' : ''}`}
        onClick={() => onChange('#FFFFFF')}
      >
        W
      </button>
    </div>
  )
}

function MeterColorRow({
  item,
  onChange,
  onDelete,
}: {
  item: MeterColor
  onChange: (color: string, textColor: string) => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[rgba(24,35,56,0.65)] p-2.5">
      <div className="flex items-center gap-2">
        <div
          className="flex h-10 w-12 items-center justify-center rounded-md text-[11px] font-black"
          style={{
            background: item.color,
            color: item.textColor,
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {item.label}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm font-semibold">{item.label}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Balk</span>
            <ColorSwatch
              value={item.color}
              onChange={(color) => onChange(color, item.textColor)}
              title="Balkkleur"
            />
            <span className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">Tekst</span>
            <ColorSwatch
              value={item.textColor}
              onChange={(textColor) => onChange(item.color, textColor)}
              title="Tekstkleur"
            />
            <TextToneButtons
              value={item.textColor}
              onChange={(textColor) => onChange(item.color, textColor)}
            />
          </div>
        </div>
        <button type="button" className="icon-btn" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function NewMeterColor({
  onAdd,
}: {
  onAdd: (label: string, color: string, textColor: string) => void
}) {
  const [label, setLabel] = useState('')
  const [color, setColor] = useState('#F5C400')
  const [textColor, setTextColor] = useState('#000000')
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-[var(--color-line)] p-2.5">
      <div className="flex items-center gap-2">
        <div
          className="flex h-10 w-12 items-center justify-center rounded-md text-[10px] font-black"
          style={{
            background: color,
            color: textColor,
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}
        >
          {label.trim() || '…'}
        </div>
        <input
          className="field flex-1"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="2.5M"
          maxLength={8}
        />
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => {
            if (!label.trim()) return
            onAdd(label, color, textColor)
            setLabel('')
          }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ColorSwatch value={color} onChange={setColor} title="Balkkleur" />
        <ColorSwatch value={textColor} onChange={setTextColor} title="Tekstkleur" />
        <TextToneButtons value={textColor} onChange={setTextColor} />
      </div>
    </div>
  )
}

function PresetRow({
  preset,
  qty,
  onUpdate,
  onDelete,
  onQty,
}: {
  preset: Preset
  qty: number
  onUpdate: (patch: Partial<Preset>) => void
  onDelete: () => void
  onQty: (q: number) => void
}) {
  const [label, setLabel] = useState(preset.label)
  const [subtitle, setSubtitle] = useState(preset.subtitle ?? '')
  const [widthMm, setWidthMm] = useState(String(preset.widthMm))
  const [heightMm, setHeightMm] = useState(String(preset.heightMm))
  const [color, setColor] = useState(preset.color)
  const [textColor, setTextColor] = useState(preset.textColor)

  useEffect(() => {
    setLabel(preset.label)
    setSubtitle(preset.subtitle ?? '')
    setWidthMm(String(preset.widthMm))
    setHeightMm(String(preset.heightMm))
    setColor(preset.color)
    setTextColor(preset.textColor)
  }, [preset])

  const sizes = SIZE_PRESETS.filter((sp) => !sp.kinds || sp.kinds.includes(preset.kind))

  return (
    <div className="space-y-2.5 rounded-xl border border-[var(--color-line)] bg-[rgba(24,35,56,0.72)] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-[rgba(34,211,238,0.12)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-accent)]">
          {preset.kind === 'flightcase' ? 'Flightcase' : 'Kabel'}
        </span>
        {preset.kind === 'cable' && (
          <div
            className="flex h-8 min-w-10 items-center justify-center rounded px-1.5 text-[11px] font-black"
            style={{
              background: color,
              color: textColor,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            {label || '—'}
          </div>
        )}
        <input
          className={`field ${preset.kind === 'flightcase' ? 'w-36' : 'w-20'}`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => onUpdate({ label })}
          maxLength={preset.kind === 'flightcase' ? 40 : 8}
        />
        <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
          <input
            type="number"
            value={widthMm}
            onChange={(e) => setWidthMm(e.target.value)}
            onBlur={() => onUpdate({ widthMm: Number(widthMm) || 50 })}
            className="field h-8 w-14 text-center"
          />
          ×
          <input
            type="number"
            value={heightMm}
            onChange={(e) => setHeightMm(e.target.value)}
            onBlur={() => onUpdate({ heightMm: Number(heightMm) || 35 })}
            className="field h-8 w-14 text-center"
          />
          mm
        </div>
        <select
          className="field h-8 w-auto text-xs"
          value=""
          onChange={(e) => {
            const sp = sizes[Number(e.target.value)]
            if (sp) onUpdate({ widthMm: sp.w, heightMm: sp.h })
          }}
        >
          <option value="">Formaat…</option>
          {sizes.map((sp, i) => (
            <option key={i} value={i}>
              {sp.label}
            </option>
          ))}
        </select>
      </div>

      {preset.kind === 'cable' && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-line)]/80 px-2 py-1.5">
          <ColorSwatch
            value={color}
            onChange={(v) => {
              setColor(v)
              onUpdate({ color: v })
            }}
            title="Balkkleur"
          />
          <ColorSwatch
            value={textColor}
            onChange={(v) => {
              setTextColor(v)
              onUpdate({ textColor: v })
            }}
            title="Tekstkleur"
          />
          <TextToneButtons
            value={textColor}
            onChange={(v) => {
              setTextColor(v)
              onUpdate({ textColor: v })
            }}
          />
        </div>
      )}

      {preset.kind === 'flightcase' && (
        <input
          className="field"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          onBlur={() => onUpdate({ subtitle })}
          placeholder="Inhoud (bv. LIGHT, CABLES)"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--color-muted)]">Aantal</span>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" className="icon-btn" onClick={() => onQty(qty - 1)}>
            <Minus className="h-3 w-3" />
          </button>
          <input
            type="number"
            min={0}
            value={qty}
            onChange={(e) => onQty(parseInt(e.target.value) || 0)}
            className="field w-14 text-center"
          />
          <button type="button" className="icon-btn" onClick={() => onQty(qty + 1)}>
            <Plus className="h-3 w-3" />
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => onQty(qty + 5)}>
            +5
          </button>
          <button type="button" className="btn-ghost btn-sm" onClick={() => onQty(qty + 10)}>
            +10
          </button>
          <button type="button" className="icon-btn" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
      {children}
    </label>
  )
}

function RentmanImportPanel({
  onImported,
  onError,
}: {
  onImported: (bin: Bin) => void | Promise<void>
  onError: (msg: string) => void
}) {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [folders, setFolders] = useState<RentmanFolder[]>([])
  const [equipment, setEquipment] = useState<RentmanEquipmentOption[]>([])
  const [folderId, setFolderId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [loadingEquipment, setLoadingEquipment] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    api
      .rentmanStatus()
      .then((s) => setConfigured(s.configured))
      .catch(() => setConfigured(false))
  }, [])

  useEffect(() => {
    if (!configured) return
    setLoadingFolders(true)
    api
      .rentmanFolders()
      .then((list) => setFolders(list))
      .catch((e: Error) => onError(e.message || 'Rentman folders laden mislukt'))
      .finally(() => setLoadingFolders(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onError is notify toast
  }, [configured])

  useEffect(() => {
    if (!folderId) {
      setEquipment([])
      setEquipmentId('')
      return
    }
    setLoadingEquipment(true)
    setEquipmentId('')
    api
      .rentmanEquipment(Number(folderId))
      .then((list) => setEquipment(list))
      .catch((e: Error) => onError(e.message || 'Producten laden mislukt'))
      .finally(() => setLoadingEquipment(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId])

  if (configured === false) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-line)] p-3 text-xs text-[var(--color-muted)]">
        Rentman niet gekoppeld. Zet <code className="text-[var(--color-accent)]">RENTMAN_API_KEY</code> in{' '}
        <code className="text-[var(--color-accent)]">.env</code> en herstart de server.
      </div>
    )
  }

  if (configured === null) {
    return (
      <div className="text-xs text-[var(--color-muted)]">Rentman verbinden…</div>
    )
  }

  const selected = equipment.find((e) => String(e.id) === equipmentId)

  return (
    <div className="space-y-2 rounded-xl border border-[var(--color-line)] bg-[rgba(24,35,56,0.55)] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)]">
        Rentman import
      </div>
      <div>
        <FieldLabel>Categorie</FieldLabel>
        <select
          className="field"
          value={folderId}
          disabled={loadingFolders}
          onChange={(e) => setFolderId(e.target.value)}
        >
          <option value="">{loadingFolders ? 'Laden…' : 'Kies categorie…'}</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.path}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>Product</FieldLabel>
        <select
          className="field"
          value={equipmentId}
          disabled={!folderId || loadingEquipment}
          onChange={(e) => setEquipmentId(e.target.value)}
        >
          <option value="">
            {!folderId
              ? 'Eerst categorie kiezen…'
              : loadingEquipment
                ? 'Laden…'
                : equipment.length
                  ? 'Kies product…'
                  : 'Geen producten in deze map'}
          </option>
          {equipment.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
              {e.code ? ` (${e.code})` : ''}
              {e.hasImage ? ' · foto' : ''}
              {e.qr ? ` · QR ${e.qr}` : ''}
            </option>
          ))}
        </select>
      </div>
      {selected && (
        <p className="text-[11px] text-[var(--color-muted)]">
          Code {selected.code || '—'}
          {selected.qr ? ` · QR ${selected.qr}` : ''}
          {selected.location ? ` · ${selected.location}` : ''}
          {selected.hasImage ? ' · met foto' : ''}
        </p>
      )}
      <button
        type="button"
        className="btn-primary w-full"
        disabled={!equipmentId || importing}
        onClick={() => {
          void (async () => {
            setImporting(true)
            try {
              const bin = await api.rentmanImport(Number(equipmentId))
              await onImported(bin)
            } catch (e) {
              onError(e instanceof Error ? e.message : 'Import mislukt')
            } finally {
              setImporting(false)
            }
          })()
        }}
      >
        {importing ? 'Importeren…' : 'Importeer als bak-label'}
      </button>
    </div>
  )
}

function BinRow({
  bin,
  logoUrl,
  qty,
  onQty,
  onSave,
  onRegen,
  onUploadQr,
  onUploadPhoto,
  onClearPhoto,
  onDelete,
}: {
  bin: Bin
  logoUrl: string | null
  qty: number
  onQty: (q: number) => void
  onSave: (patch: Partial<Bin>) => Promise<void>
  onRegen: () => void
  onUploadQr: (file: File) => void
  onUploadPhoto: (file: File) => void
  onClearPhoto: () => void
  onDelete: () => void
}) {
  const [code, setCode] = useState(bin.code)
  const [name, setName] = useState(bin.name)
  const [contents, setContents] = useState(bin.contents)
  const [location, setLocation] = useState(bin.location)
  const [qrPayload, setQrPayload] = useState(bin.qrPayload)
  const [showQrExtra, setShowQrExtra] = useState(false)
  const [saving, setSaving] = useState(false)
  const qrRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCode(bin.code)
    setName(bin.name)
    setContents(bin.contents)
    setLocation(bin.location)
    setQrPayload(bin.qrPayload)
  }, [bin.id, bin.updatedAt])

  const dirty =
    code !== bin.code ||
    name !== bin.name ||
    contents !== bin.contents ||
    location !== bin.location ||
    qrPayload !== bin.qrPayload

  const save = async () => {
    setSaving(true)
    try {
      await onSave({ code, name, contents, location, qrPayload })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-[var(--color-line)] bg-[rgba(24,35,56,0.72)] p-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="relative flex h-[4.5rem] w-[4.5rem] shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-panel)]"
          onClick={() => photoRef.current?.click()}
          title="Productfoto"
        >
          {bin.photoDataUrl ? (
            <img src={bin.photoDataUrl} alt="" className="h-full w-full object-contain bg-white" />
          ) : (
            <>
              <ImagePlus className="h-5 w-5 text-[var(--color-muted)]" />
              <span className="mt-1 text-[10px] text-[var(--color-muted)]">Foto</span>
            </>
          )}
        </button>
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onUploadPhoto(f)
            e.target.value = ''
          }}
        />

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          <div>
            <FieldLabel>Code</FieldLabel>
            <input
              className="field font-mono text-sm font-semibold"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="BAK-001"
            />
          </div>
          <div>
            <FieldLabel>Locatie</FieldLabel>
            <input
              className="field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Stelling A2"
            />
          </div>
          <div className="col-span-2">
            <FieldLabel>Naam op label</FieldLabel>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. DMX adapters"
            />
          </div>
          <div className="col-span-2">
            <FieldLabel>Inhoud</FieldLabel>
            <input
              className="field"
              value={contents}
              onChange={(e) => setContents(e.target.value)}
              placeholder="Bijv. 5-pin / 3-pin"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn-primary btn-sm"
          disabled={!dirty || saving}
          onClick={() => void save()}
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Bezig…' : 'Opslaan'}
        </button>
        {bin.photoDataUrl ? (
          <button type="button" className="btn-ghost btn-sm" onClick={onClearPhoto}>
            <X className="h-3.5 w-3.5" /> Foto weg
          </button>
        ) : (
          <button type="button" className="btn-ghost btn-sm" onClick={() => photoRef.current?.click()}>
            <ImagePlus className="h-3.5 w-3.5" /> Foto
          </button>
        )}
        <button
          type="button"
          className="btn-ghost btn-sm"
          onClick={() => setShowQrExtra((v) => !v)}
        >
          <QrCode className="h-3.5 w-3.5" /> QR opties
        </button>
        <div className="ml-auto flex items-center gap-1">
          <span className="text-xs text-[var(--color-muted)]">Print</span>
          <button type="button" className="icon-btn" onClick={() => onQty(qty - 1)}>
            <Minus className="h-3 w-3" />
          </button>
          <input
            type="number"
            min={0}
            value={qty}
            onChange={(e) => onQty(parseInt(e.target.value) || 0)}
            className="field w-12 text-center"
          />
          <button type="button" className="icon-btn" onClick={() => onQty(qty + 1)}>
            <Plus className="h-3 w-3" />
          </button>
          <button type="button" className="icon-btn" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showQrExtra && (
        <div className="space-y-2 rounded-lg border border-[var(--color-line)] bg-[rgba(11,18,32,0.35)] p-2.5">
          <FieldLabel>QR inhoud (tekst of URL)</FieldLabel>
          <div className="flex flex-wrap gap-2">
            <input
              className="field min-w-0 flex-1 font-mono text-xs"
              value={qrPayload}
              onChange={(e) => setQrPayload(e.target.value)}
              placeholder="Standaard = bakcode"
            />
            <button type="button" className="btn-ghost btn-sm" onClick={onRegen}>
              <RefreshCw className="h-3.5 w-3.5" /> Regenereer
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => qrRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" /> Upload QR
            </button>
            <input
              ref={qrRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onUploadQr(f)
                e.target.value = ''
              }}
            />
          </div>
          {dirty && (
            <p className="text-[11px] text-[var(--color-muted)]">
              Vergeet niet op Opslaan te klikken na het wijzigen van QR-inhoud.
            </p>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-[var(--color-line)] bg-[#dbe3ef] p-2">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          Live label
        </p>
        <div className="overflow-hidden rounded bg-white shadow-sm">
          <div className="origin-top-left scale-[0.58]" style={{ width: '172%' }}>
            <BinLabel
              code={code || 'BAK'}
              name={name}
              contents={contents}
              location={location}
              logoUrl={logoUrl}
              qrDataUrl={bin.qrDataUrl}
              photoDataUrl={bin.photoDataUrl}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
