# DUCs Playbook

Editor voor ultimate frisbee spelvarianten en drills, voor eigen gebruik binnen
DUC Dendermonde. Outdoor WFDF-veld.

## Draaien

```bash
npm install
cp .env.example .env.local   # vul de Supabase-waarden in
npm run dev
```

## Commando's

- `npm run dev` — ontwikkelserver
- `npm run build` — productiebuild
- `npm test` — Vitest
- `npm run lint` — ESLint

## Omgevingsvariabelen

| Naam | Waarvoor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-project `ducs-playbook` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publieke sleutel, veilig in de client |

## Structuur

```
src/app          routes
src/components   React-componenten, editor is handgeschreven SVG
src/lib/field    veldgeometrie, alles in meters
src/lib/strings  alle zichtbare strings, Nederlands
docs/            beslissingen
```

Alle posities worden opgeslagen in meters, nooit in pixels. Zie
`src/lib/field/geometry.ts`.
