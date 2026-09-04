# Beslissingen

Wat gekozen is, welk alternatief er was, en waarom. Nieuwste bovenaan.

## 2026-09-04 — Kleuren zijn palletsleutels, geen hexwaarden

**Gekozen.** Het `color`-veld op een entiteit is een sleutel uit een vaste lijst:
`standaard`, `geel`, `paars`, `wit`, `grijs`. `standaard` betekent: volg de kant
waartoe de entiteit hoort.

**Alternatief.** Een hexwaarde opslaan, zoals in de projectinstructie staat.

**Waarom.** Bij export naar PDF moet hetzelfde diagram opnieuw getekend worden in
het printthema, met omlijnde tokens op wit. Met een hexwaarde in de data kan dat
niet: die kleur is dan hard vastgelegd en blijft ook op papier staan. Met een
sleutel verandert alleen de variabelenset. Rood en blauw ontbreken bewust in de
lijst: rood tegenover groen is precies de combinatie die bij deuteranopie
wegvalt, en blauw is de accentkleur van de interface.

## 2026-09-04 — Frame-invarianten zitten in het schema, niet in de interface

**Gekozen.** `frameContentSchema` controleert bij elke save ook de regels die
over meerdere entiteiten gaan: unieke ids, hoogstens één speler met de schijf,
elke arrow hoort bij een bestaande entiteit, en een worp kan alleen vanuit de
schijfdrager.

**Alternatief.** Die regels alleen in de editor afdwingen.

**Waarom.** Dit zijn stille fouten. Een worp die vertrekt vanuit iemand zonder
schijf ziet er op het scherm normaal uit en klopt pas niet als je het op training
probeert uit te leggen. De interface voorkomt ze al, maar de interface verandert
en het schema is de laatste controle voor het naar de database gaat.

## 2026-09-04 — Magic link met een middleware die de sessie ververst

**Gekozen.** `@supabase/ssr` met een middleware die bij elk verzoek
`getUser()` aanroept, en routes onder `/login` en `/auth` als enige publiek.

**Waarom.** Zonder die aanroep in de middleware verloopt het token en word je
midden in een sessie stilzwijgend uitgelogd. Op een telefoon aan de zijlijn is
dat precies het moment waarop je werk kwijt bent.

Nieuwe accounts krijgen `can_edit = false`. Bewerkrechten zet je met de hand aan
in het Supabase-dashboard. Voor tien trainers die je persoonlijk kent is een
uitnodigingsscherm meer werk dan het oplevert.

## 2026-09-04 — Veldcoördinaten in meters, viewBox groter dan het veld

**Gekozen.** Posities worden opgeslagen in meters met de oorsprong linksonder in
het volledige veld. Bij het renderen geldt een vaste schaal van 10 SVG-eenheden
per meter, dus het speelvlak beslaat exact 1000 x 370 eenheden. De viewBox is
groter: `-30 -30 1060 430`, oftewel 3 meter marge rondom.

**Alternatief.** De viewBox exact op `0 0 1000 370` zetten, zoals in de
projectinstructie staat.

**Waarom.** Bij een pull play staan spelers achter de goal line en soms net
buiten de zijlijn. Met een viewBox die exact op de lijnen eindigt vallen die
tokens half weg en zijn ze niet meer aan te tikken. De schaalconstante en de
opgeslagen coördinaten blijven precies zoals gespecificeerd; alleen het zichtbare
kader is ruimer. De marge staat als één constante in `geometry.ts`.

## 2026-09-04 — Half veld is een rotatie, geen tweede coördinatensysteem

**Gekozen.** De halve-veldweergave draait de projectie 90 graden met de klok mee.
Opgeslagen posities blijven in hetzelfde veldcoördinatensysteem.

**Alternatief.** Een apart coördinatensysteem voor de staande weergave.

**Waarom.** Wisselen van weergave mag posities niet verplaatsen. Belangrijker
nog: de rotatie is bewust een rotatie en geen spiegeling, want bij een spiegeling
wisselen open side en break side van kant en klopt elke forehand in het diagram
niet meer. Daar staat een test op.

## 2026-09-04 — Brickmark op 18 meter

**Gekozen.** 18 meter van de eigen goal line, op de middenas.

**Waarom.** Nagekeken in de WFDF-appendix: "The brick marks are eighteen (18)
metres from each goal line located midway between the sidelines." De 20 die in
Amerikaanse bronnen opduikt is 20 yards uit het USAU-reglement.

## 2026-09-04 — Supabase vanaf het begin

**Gekozen.** Nieuw Supabase-project `ducs-playbook` in eu-central-1, met het
volledige schema en de RLS-policies uit de projectinstructie meteen uitgerold.

**Alternatief.** Eerst localStorage, later omschakelen.

**Waarom.** Op vraag van Daan. Het scheelt een migratiestap en je kan vanaf stap
1 op je telefoon testen op de echte URL in plaats van via een lokaal IP-adres.

## 2026-09-04 — Nieuwe dependencies

Elke keuze hieronder is bewust, want de projectinstructie vraagt om een reden per
dependency.

- `next`, `react`, `react-dom` — de gekozen stack.
- `zustand` + `immer` — statebeheer met `produceWithPatches` voor undo en redo.
  Alternatief was Redux Toolkit; te zwaar voor één editorstore.
- `zod` — schemavalidatie van de frame-jsonb bij elke save. Alternatief was
  handgeschreven typeguards; die lopen uit de pas met de types.
- `@supabase/supabase-js` + `@supabase/ssr` — database en magic-link auth.
- `clsx` + `tailwind-merge` — klassennamen samenvoegen. Klein, en het alternatief
  is dezelfde logica zelf schrijven.
- `vitest` + `@vitejs/plugin-react` + `jsdom` + Testing Library — de rekenlogica
  en later de interactie testen.
- `tailwindcss` v4 + `@tailwindcss/postcss` — de schil. De editor zelf is
  handgeschreven SVG met design tokens, geen Tailwind-kleuren.

Nog niet toegevoegd, bewust: shadcn/ui. Pas nodig bij de bibliotheek en de
dialogen in stap 7.
