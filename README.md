# LabelMaker Pro

Lokale app om **kabellabels**, **flightcase-labels** en **magazijnbak-labels** te ontwerpen en op A4 te printen. Alles staat in een **SQLite-database**.

## Starten

```bash
npm install
npm run dev
```

- Web: http://localhost:5173  
- API: http://localhost:8787  
- Database: `data/labelmaker.db`

## Slimme features

- **Kleur per lengte** + eigen tekstkleur (geel → zwart)
- Kabellabels in **Arial/Helvetica Black** (compatibel met eerdere prints)
- **Magazijnbakken** (200×70 mm) met automatisch gegenereerde QR
- QR-payload aanpasbaar (code, URL, …) of eigen QR-afbeelding uploaden
- Codes automatisch: `BAK-001`, `BAK-002`, …
- Batches, logo en bedrijfsgegevens in SQLite

## Printen

Browser print → marges **Geen**, schaal **100%**.
