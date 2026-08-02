import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { db, seedIfEmpty, uid } from './db.ts'
import { makeQrDataUrl } from './qr.ts'

seedIfEmpty()

const app = new Hono()
app.use('*', cors({ origin: '*' }))

type Row = Record<string, unknown>

function mapProfile(row: Row) {
  return {
    logoDataUrl: (row.logo_data_url as string | null) ?? null,
    companyTel: String(row.company_tel ?? ''),
    companyWeb: String(row.company_web ?? ''),
    gapMm: Number(row.gap_mm ?? 2),
    showCutMarks: Boolean(row.show_cut_marks),
  }
}

function mapMeterColor(row: Row) {
  return {
    id: String(row.id),
    label: String(row.label),
    color: String(row.color),
    textColor: String(row.text_color),
  }
}

function mapPreset(row: Row) {
  return {
    id: String(row.id),
    label: String(row.label),
    color: String(row.color),
    textColor: String(row.text_color),
    sortOrder: Number(row.sort_order ?? 0),
    widthMm: Number(row.width_mm ?? 50),
    heightMm: Number(row.height_mm ?? 35),
    kind: String(row.kind) as 'cable' | 'flightcase' | 'bin',
    subtitle: (row.subtitle as string | null) ?? null,
    qrPayload: (row.qr_payload as string | null) ?? null,
    qrDataUrl: (row.qr_data_url as string | null) ?? null,
    location: (row.location as string | null) ?? null,
  }
}

function mapBin(row: Row) {
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    contents: String(row.contents ?? ''),
    location: String(row.location ?? ''),
    qrPayload: String(row.qr_payload ?? row.code),
    qrDataUrl: (row.qr_data_url as string | null) ?? null,
    photoDataUrl: (row.photo_data_url as string | null) ?? null,
    widthMm: Number(row.width_mm ?? 200),
    heightMm: Number(row.height_mm ?? 70),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapTemplate(row: Row) {
  return {
    id: String(row.id),
    name: String(row.name),
    createdAt: String(row.created_at),
    items: JSON.parse(String(row.items_json || '[]')),
  }
}

/** Suggest next BAK-001 style code */
function nextBinCode(): string {
  const rows = db.prepare(`SELECT code FROM bins`).all() as { code: string }[]
  let max = 0
  for (const r of rows) {
    const m = /^BAK-(\d+)$/i.exec(r.code.trim())
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  return `BAK-${String(max + 1).padStart(3, '0')}`
}

app.get('/api/health', (c) => c.json({ ok: true }))

app.get('/api/state', (c) => {
  const profile = db.prepare('SELECT * FROM profile WHERE id = 1').get() as Row
  const meterColors = db.prepare('SELECT * FROM meter_colors ORDER BY label').all() as Row[]
  const presets = db
    .prepare('SELECT * FROM presets ORDER BY sort_order ASC, label ASC')
    .all() as Row[]
  const templates = db
    .prepare('SELECT * FROM batch_templates ORDER BY created_at DESC')
    .all() as Row[]
  const bins = db.prepare('SELECT * FROM bins ORDER BY code ASC').all() as Row[]
  return c.json({
    profile: mapProfile(profile),
    meterColors: meterColors.map(mapMeterColor),
    presets: presets.map(mapPreset),
    templates: templates.map(mapTemplate),
    bins: bins.map(mapBin),
    nextBinCode: nextBinCode(),
  })
})

app.patch('/api/profile', async (c) => {
  const body = await c.req.json<{
    logoDataUrl?: string | null
    companyTel?: string
    companyWeb?: string
    gapMm?: number
    showCutMarks?: boolean
  }>()
  const cur = db.prepare('SELECT * FROM profile WHERE id = 1').get() as Row
  db.prepare(
    `UPDATE profile SET
      logo_data_url = ?,
      company_tel = ?,
      company_web = ?,
      gap_mm = ?,
      show_cut_marks = ?
     WHERE id = 1`,
  ).run(
    body.logoDataUrl !== undefined ? body.logoDataUrl : cur.logo_data_url,
    body.companyTel ?? cur.company_tel,
    body.companyWeb ?? cur.company_web,
    body.gapMm ?? cur.gap_mm,
    body.showCutMarks !== undefined ? (body.showCutMarks ? 1 : 0) : cur.show_cut_marks,
  )
  return c.json(mapProfile(db.prepare('SELECT * FROM profile WHERE id = 1').get() as Row))
})

app.put('/api/meter-colors', async (c) => {
  const body = await c.req.json<{
    label: string
    color: string
    textColor: string
  }>()
  const label = body.label.trim()
  if (!label) return c.json({ error: 'label verplicht' }, 400)
  const existing = db
    .prepare('SELECT id FROM meter_colors WHERE label = ? COLLATE NOCASE')
    .get(label) as { id: string } | undefined

  if (existing) {
    db.prepare(
      `UPDATE meter_colors SET label = ?, color = ?, text_color = ? WHERE id = ?`,
    ).run(label, body.color, body.textColor, existing.id)
  } else {
    db.prepare(
      `INSERT INTO meter_colors (id, label, color, text_color) VALUES (?, ?, ?, ?)`,
    ).run(uid(), label, body.color, body.textColor)
  }

  // Cascade naar kabel-presets met dezelfde lengte
  db.prepare(
    `UPDATE presets SET color = ?, text_color = ?
     WHERE kind = 'cable' AND label = ? COLLATE NOCASE`,
  ).run(body.color, body.textColor, label)

  const rows = db.prepare('SELECT * FROM meter_colors ORDER BY label').all() as Row[]
  return c.json(rows.map(mapMeterColor))
})

app.delete('/api/meter-colors/:id', (c) => {
  db.prepare('DELETE FROM meter_colors WHERE id = ?').run(c.req.param('id'))
  return c.json({ ok: true })
})

app.post('/api/presets', async (c) => {
  const body = await c.req.json<{
    kind?: 'cable' | 'flightcase' | 'bin'
    label?: string
    color?: string
    textColor?: string
    widthMm?: number
    heightMm?: number
    subtitle?: string | null
  }>()
  const kind = body.kind ?? 'cable'
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), -1) AS m FROM presets').get() as {
    m: number
  }

  let label = body.label
  let color = body.color
  let textColor = body.textColor
  let widthMm = body.widthMm
  let heightMm = body.heightMm
  let subtitle = body.subtitle ?? null

  if (kind === 'flightcase') {
    label ??= 'CASE 1'
    color ??= '#0F172A'
    textColor ??= '#FFFFFF'
    widthMm ??= 200
    heightMm ??= 140
    subtitle ??= ''
  } else if (kind === 'bin') {
    label ??= 'BAK'
    color ??= '#0F172A'
    textColor ??= '#FFFFFF'
    widthMm ??= 200
    heightMm ??= 70
    subtitle ??= ''
  } else {
    label ??= '5M'
    const scheme = db
      .prepare('SELECT color, text_color FROM meter_colors WHERE label = ? COLLATE NOCASE')
      .get(label) as { color: string; text_color: string } | undefined
    color ??= scheme?.color ?? '#2FA9E0'
    textColor ??= scheme?.text_color ?? '#FFFFFF'
    widthMm ??= 50
    heightMm ??= 35
  }

  const id = uid()
  db.prepare(
    `INSERT INTO presets (id, label, color, text_color, sort_order, width_mm, height_mm, kind, subtitle)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, label, color, textColor, maxOrder.m + 1, widthMm, heightMm, kind, subtitle)

  return c.json(mapPreset(db.prepare('SELECT * FROM presets WHERE id = ?').get(id) as Row), 201)
})

app.patch('/api/presets/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<Record<string, unknown>>()
  const cur = db.prepare('SELECT * FROM presets WHERE id = ?').get(id) as Row | undefined
  if (!cur) return c.json({ error: 'niet gevonden' }, 404)

  let label = body.label !== undefined ? String(body.label) : String(cur.label)
  let color = body.color !== undefined ? String(body.color) : String(cur.color)
  let textColor = body.textColor !== undefined ? String(body.textColor) : String(cur.text_color)

  // Slim: bij lengte-wijziging pak schema-kleuren
  if (cur.kind === 'cable' && body.label !== undefined) {
    const scheme = db
      .prepare('SELECT color, text_color FROM meter_colors WHERE label = ? COLLATE NOCASE')
      .get(label) as { color: string; text_color: string } | undefined
    if (scheme) {
      color = scheme.color
      textColor = scheme.text_color
    }
  }

  db.prepare(
    `UPDATE presets SET
      label = ?, color = ?, text_color = ?,
      width_mm = ?, height_mm = ?, subtitle = ?,
      qr_payload = ?, qr_data_url = ?, location = ?
     WHERE id = ?`,
  ).run(
    label,
    color,
    textColor,
    body.widthMm !== undefined ? Number(body.widthMm) : cur.width_mm,
    body.heightMm !== undefined ? Number(body.heightMm) : cur.height_mm,
    body.subtitle !== undefined ? body.subtitle : cur.subtitle,
    body.qrPayload !== undefined ? body.qrPayload : cur.qr_payload,
    body.qrDataUrl !== undefined ? body.qrDataUrl : cur.qr_data_url,
    body.location !== undefined ? body.location : cur.location,
    id,
  )

  // Sync meter schema als kabelkleur wijzigt
  if (cur.kind === 'cable' && (body.color !== undefined || body.textColor !== undefined)) {
    const existing = db
      .prepare('SELECT id FROM meter_colors WHERE label = ? COLLATE NOCASE')
      .get(label) as { id: string } | undefined
    if (existing) {
      db.prepare(`UPDATE meter_colors SET color = ?, text_color = ? WHERE id = ?`).run(
        color,
        textColor,
        existing.id,
      )
    } else {
      db.prepare(
        `INSERT INTO meter_colors (id, label, color, text_color) VALUES (?, ?, ?, ?)`,
      ).run(uid(), label, color, textColor)
    }
  }

  return c.json(mapPreset(db.prepare('SELECT * FROM presets WHERE id = ?').get(id) as Row))
})

app.delete('/api/presets/:id', (c) => {
  db.prepare('DELETE FROM presets WHERE id = ?').run(c.req.param('id'))
  return c.json({ ok: true })
})

app.post('/api/templates', async (c) => {
  const body = await c.req.json<{ name: string; items: unknown[] }>()
  if (!body.name?.trim() || !body.items?.length) {
    return c.json({ error: 'naam en items verplicht' }, 400)
  }
  const id = uid()
  const createdAt = new Date().toISOString()
  db.prepare(
    `INSERT INTO batch_templates (id, name, created_at, items_json) VALUES (?, ?, ?, ?)`,
  ).run(id, body.name.trim(), createdAt, JSON.stringify(body.items))
  return c.json(
    mapTemplate(db.prepare('SELECT * FROM batch_templates WHERE id = ?').get(id) as Row),
    201,
  )
})

app.delete('/api/templates/:id', (c) => {
  db.prepare('DELETE FROM batch_templates WHERE id = ?').run(c.req.param('id'))
  return c.json({ ok: true })
})

app.get('/api/bins', (c) => {
  const q = (c.req.query('q') ?? '').trim().toLowerCase()
  const rows = db.prepare('SELECT * FROM bins ORDER BY code ASC').all() as Row[]
  const mapped = rows.map(mapBin)
  if (!q) return c.json(mapped)
  return c.json(
    mapped.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.contents.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q),
    ),
  )
})

app.post('/api/bins', async (c) => {
  const body = await c.req.json<{
    code?: string
    name?: string
    contents?: string
    location?: string
    qrPayload?: string
    qrDataUrl?: string | null
    photoDataUrl?: string | null
    widthMm?: number
    heightMm?: number
  }>()

  const code = (body.code?.trim() || nextBinCode()).toUpperCase()
  const name = body.name?.trim() ?? ''
  const contents = body.contents?.trim() || ''
  const location = body.location?.trim() || ''
  const qrPayload = body.qrPayload?.trim() || code
  const now = new Date().toISOString()
  const id = uid()

  let qrDataUrl = body.qrDataUrl ?? null
  if (!qrDataUrl) {
    qrDataUrl = await makeQrDataUrl(qrPayload)
  }

  try {
    db.prepare(
      `INSERT INTO bins (id, code, name, contents, location, qr_payload, qr_data_url, photo_data_url, width_mm, height_mm, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      code,
      name,
      contents,
      location,
      qrPayload,
      qrDataUrl,
      body.photoDataUrl ?? null,
      body.widthMm ?? 200,
      body.heightMm ?? 70,
      now,
      now,
    )
  } catch {
    return c.json({ error: `Code ${code} bestaat al` }, 409)
  }

  return c.json(mapBin(db.prepare('SELECT * FROM bins WHERE id = ?').get(id) as Row), 201)
})

app.patch('/api/bins/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<Record<string, unknown>>()
  const cur = db.prepare('SELECT * FROM bins WHERE id = ?').get(id) as Row | undefined
  if (!cur) return c.json({ error: 'niet gevonden' }, 404)

  const code = body.code !== undefined ? String(body.code).trim().toUpperCase() : String(cur.code)
  const name = body.name !== undefined ? String(body.name).trim() : String(cur.name)
  const contents =
    body.contents !== undefined ? String(body.contents).trim() : String(cur.contents ?? '')
  const location =
    body.location !== undefined ? String(body.location).trim() : String(cur.location ?? '')
  let qrPayload =
    body.qrPayload !== undefined ? String(body.qrPayload).trim() : String(cur.qr_payload)
  if (!qrPayload) qrPayload = code

  let qrDataUrl =
    body.qrDataUrl !== undefined
      ? (body.qrDataUrl as string | null)
      : (cur.qr_data_url as string | null)

  const photoDataUrl =
    body.photoDataUrl !== undefined
      ? (body.photoDataUrl as string | null)
      : ((cur.photo_data_url as string | null) ?? null)

  // Regenereren als payload wijzigt en er geen handmatige upload in deze request zit
  const payloadChanged =
    body.qrPayload !== undefined && String(body.qrPayload).trim() !== String(cur.qr_payload)
  const codeChanged = body.code !== undefined && code !== String(cur.code)
  if ((payloadChanged || (codeChanged && body.qrPayload === undefined)) && body.qrDataUrl === undefined) {
    if (codeChanged && body.qrPayload === undefined) qrPayload = code
    qrDataUrl = await makeQrDataUrl(qrPayload)
  }

  try {
    db.prepare(
      `UPDATE bins SET
        code = ?, name = ?, contents = ?, location = ?,
        qr_payload = ?, qr_data_url = ?, photo_data_url = ?,
        width_mm = ?, height_mm = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      code,
      name,
      contents,
      location,
      qrPayload,
      qrDataUrl,
      photoDataUrl,
      body.widthMm !== undefined ? Number(body.widthMm) : cur.width_mm,
      body.heightMm !== undefined ? Number(body.heightMm) : cur.height_mm,
      new Date().toISOString(),
      id,
    )
  } catch {
    return c.json({ error: `Code ${code} bestaat al` }, 409)
  }

  return c.json(mapBin(db.prepare('SELECT * FROM bins WHERE id = ?').get(id) as Row))
})

app.post('/api/bins/:id/regenerate-qr', async (c) => {
  const id = c.req.param('id')
  const cur = db.prepare('SELECT * FROM bins WHERE id = ?').get(id) as Row | undefined
  if (!cur) return c.json({ error: 'niet gevonden' }, 404)
  const qrDataUrl = await makeQrDataUrl(String(cur.qr_payload || cur.code))
  db.prepare(`UPDATE bins SET qr_data_url = ?, updated_at = ? WHERE id = ?`).run(
    qrDataUrl,
    new Date().toISOString(),
    id,
  )
  return c.json(mapBin(db.prepare('SELECT * FROM bins WHERE id = ?').get(id) as Row))
})

app.delete('/api/bins/:id', (c) => {
  db.prepare('DELETE FROM bins WHERE id = ?').run(c.req.param('id'))
  return c.json({ ok: true })
})

app.post('/api/qr', async (c) => {
  const body = await c.req.json<{ payload: string }>()
  const dataUrl = await makeQrDataUrl(body.payload ?? '')
  return c.json({ dataUrl })
})

const port = Number(process.env.PORT || 8787)
console.log(`LabelMaker API → http://localhost:${port}`)
serve({ fetch: app.fetch, port })
