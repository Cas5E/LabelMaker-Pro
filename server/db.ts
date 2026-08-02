import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, '..', 'data')
mkdirSync(dataDir, { recursive: true })

export const db = new DatabaseSync(join(dataDir, 'labelmaker.db'))

db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    logo_data_url TEXT,
    company_tel TEXT NOT NULL DEFAULT '',
    company_web TEXT NOT NULL DEFAULT '',
    gap_mm REAL NOT NULL DEFAULT 2,
    show_cut_marks INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS meter_colors (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL COLLATE NOCASE,
    color TEXT NOT NULL,
    text_color TEXT NOT NULL,
    UNIQUE(label)
  );

  CREATE TABLE IF NOT EXISTS presets (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    text_color TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    width_mm REAL NOT NULL DEFAULT 50,
    height_mm REAL NOT NULL DEFAULT 35,
    kind TEXT NOT NULL CHECK (kind IN ('cable', 'flightcase', 'bin')),
    subtitle TEXT,
    qr_payload TEXT,
    qr_data_url TEXT,
    location TEXT
  );

  CREATE TABLE IF NOT EXISTS batch_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    items_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bins (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL COLLATE NOCASE UNIQUE,
    name TEXT NOT NULL,
    contents TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    qr_payload TEXT NOT NULL,
    qr_data_url TEXT,
    photo_data_url TEXT,
    rentman_equipment_id INTEGER,
    width_mm REAL NOT NULL DEFAULT 200,
    height_mm REAL NOT NULL DEFAULT 70,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

/** Migraties voor bestaande databases */
function migrate() {
  const cols = db.prepare(`PRAGMA table_info(bins)`).all() as { name: string }[]
  const names = new Set(cols.map((c) => c.name))
  if (!names.has('photo_data_url')) {
    db.exec(`ALTER TABLE bins ADD COLUMN photo_data_url TEXT`)
  }
  if (!names.has('rentman_equipment_id')) {
    db.exec(`ALTER TABLE bins ADD COLUMN rentman_equipment_id INTEGER`)
  }
}
migrate()

const STARTER_COLORS = [
  { label: '1M', color: '#F97316', textColor: '#000000' },
  { label: '2.5M', color: '#F5C400', textColor: '#000000' },
  { label: '3M', color: '#22C55E', textColor: '#000000' },
  { label: '5M', color: '#2FA9E0', textColor: '#FFFFFF' },
  { label: '10M', color: '#E53935', textColor: '#FFFFFF' },
  { label: '20M', color: '#7C3AED', textColor: '#FFFFFF' },
  { label: '50M', color: '#0F172A', textColor: '#FFFFFF' },
] as const

export function uid() {
  return randomUUID()
}

export function seedIfEmpty() {
  const profile = db.prepare('SELECT id FROM profile WHERE id = 1').get()
  if (!profile) {
    db.prepare(
      `INSERT INTO profile (id, logo_data_url, company_tel, company_web, gap_mm, show_cut_marks)
       VALUES (1, NULL, '', '', 2, 1)`,
    ).run()
  }

  const colorCount = db.prepare('SELECT COUNT(*) AS c FROM meter_colors').get() as { c: number }
  if (colorCount.c === 0) {
    const insertColor = db.prepare(
      `INSERT INTO meter_colors (id, label, color, text_color) VALUES (?, ?, ?, ?)`,
    )
    for (const c of STARTER_COLORS) {
      insertColor.run(uid(), c.label, c.color, c.textColor)
    }
  }

  // Kabel-presets terugzetten als ze ontbreken (kleuren bestaan wel)
  const insertPreset = db.prepare(
    `INSERT INTO presets (id, label, color, text_color, sort_order, width_mm, height_mm, kind, subtitle)
     VALUES (?, ?, ?, ?, ?, 50, 35, 'cable', NULL)`,
  )
  const colors = db
    .prepare('SELECT label, color, text_color FROM meter_colors ORDER BY label')
    .all() as { label: string; color: string; text_color: string }[]
  for (const [i, c] of colors.entries()) {
    const exists = db
      .prepare(
        `SELECT id FROM presets WHERE kind = 'cable' AND label = ? COLLATE NOCASE`,
      )
      .get(c.label)
    if (!exists) {
      insertPreset.run(uid(), c.label, c.color, c.text_color, i)
    }
  }
}

seedIfEmpty()
