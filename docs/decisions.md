# Beslissingen

Wat gekozen is, welk alternatief er was, en waarom. Nieuwste bovenaan.

## 2026-09-04 — Het contextmenu is HTML boven de SVG, geen SVG erin

**Gekozen.** De boog met knoppen wordt getekend als HTML in een laag boven het
veld, met de knoppen op een vaste 44 px.

**Alternatief.** De knoppen als `<g>` in dezelfde SVG als het veld.

**Waarom.** In de SVG schaalt alles mee met de viewBox, dus een knop van 44 px
zou op de ene zoomstand een andere maat hebben dan op de andere, en tekst zou
mee vervormen. Bovendien zijn dit echte knoppen: bereikbaar met het toetsenbord,
met een `aria-label`, en met een tooltip die niet over naburige tokens valt.
Dat laatste doet de referentietool ook zo.

## 2026-09-04 — Instellingen openen een paneel, geen tweede boog

**Gekozen.** Het tandwiel klapt één paneel uit met kant, positie, eigen label en
kleur zichtbaar naast elkaar.

**Alternatief.** Een tweede boog van vier ronde knoppen, zoals in de
projectinstructie staat, waarbij elke knop zijn eigen keuze opent.

**Waarom.** De hoofdlus blijft precies dezelfde: je tikt op een ding, er
verschijnt een menu bij dat ding, je kiest een actie. Maar met een tweede boog
kost een kleur veranderen drie tikken en zie je nooit meer dan één instelling
tegelijk. Met één paneel is het één tik en zie je meteen wat er allemaal aan die
speler vastzit. Zeg het als je toch de tweede boog wil, het is een kleine
wijziging.

## 2026-09-04 — Tokengrootte volgt de zoom, met grenzen aan beide kanten

**Gekozen.** De straal van een token is `13 px omgerekend naar meter`, geklemd
tussen 0,8 en 1,6 meter. Het raakvlak is een aparte onzichtbare cirkel van
minstens 44 px.

**Alternatief.** Een vaste maat in meters, of een vaste maat in pixels.

**Waarom.** Een speler is ongeveer een meter breed, en een veld van honderd
meter op een telefoon van 360 px betekent 3,6 px per meter. Een token van één
meter is dan drie pixels: onzichtbaar en niet aan te tikken. Een vaste maat in
pixels is ook fout, want dan groeien de tokens mee bij het inzoomen tot ze het
veld opvreten. De geklemde variant is op een laptop en op een telefoon met het
halve veld allebei ongeveer 26 px breed. Daar staan tests op.

Dit legt wel iets bloot: het volledige veld op een telefoon blijft krap, ook met
de ondergrens. Het halve veld is daar de bruikbare weergave, en zoomen en pannen
zijn geen luxe maar noodzaak. Dat komt in een latere stap.

## 2026-09-04 — Pionnen zijn driehoeken, geen kruisjes

**Gekozen.** Een pion wordt getekend als een driehoekje.

**Alternatief.** Een wit kruisje, zoals in de referentietool.

**Waarom.** De brickmarks op het veld zijn al kruisjes. Een pion op of naast een
brickmark is dan niet meer te onderscheiden, en de brickmark ligt precies waar
je bij een pull play je pionnen legt.

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

## 2026-09-04 — Wijzigingen werken door naar de volgende frames

**Gekozen.** Een wijziging in frame N geldt vanaf frame N. Posities schuiven
door als verplaatsing (een delta), niet als herberekening. Identiteit — kant,
positie, eigen label, kleur — hoort bij de speler en landt in álle frames.
Toevoegen voegt toe vanaf dit frame, verwijderen verwijdert vanaf dit frame, en
de schijfdrager wordt vanaf dit frame vooruit herrekend.

Daarbovenop één invariant, want zonder die klopt de animatie niet: heeft een
speler in frame N een cut of juke, dan ís zijn positie in frame N+1 het eindpunt
van die arrow. Dat zijn twee kanten van hetzelfde. Sleep je hem in frame N+1,
dan sleept de punt van die arrow in frame N mee. Verdwijnt de arrow, dan blijft
hij vanaf daar staan waar hij stond.

**Alternatief.** Latere frames volledig herberekenen uit frame N, zoals
`volgendFrame` doet bij het aanmaken. Dat is eenvoudiger te schrijven en
eenvoudiger uit te leggen.

**Waarom niet.** Het gooit handwerk weg. Een trainer die in frame 3 een
verdediger een halve meter verzet en daarna in frame 1 iets rechtzet, verliest
die halve meter. Met delta's blijft alles wat je later zelf deed relatief op zijn
plaats. De prijs is dat een wijziging in een vroeg frame stilletjes vijf frames
raakt, en daarom staat naast de framenavigator permanent hoeveel frames
meebewegen.

**Waar het inzit.** `src/lib/diagram/propagatie.ts`, met 22 tests. Aangesloten
op alle plekken waar je iets kan wijzigen: plaatsen en slepen op het canvas, de
punt van een arrow, het contextmenu, het bulkpaneel en de Delete-toets.

## 2026-09-04 — Een worp gaat naar de cut, niet naar de plek

**Gekozen.** Het eindpunt van een worp klikt vast op twee punten per speler: waar
hij staat, en waar zijn cut of juke hem brengt. Beide zetten `targetId`.

**Waarom.** Zonder het tweede punt is de gewone situatie in ultimate niet te
tekenen: handler heeft de schijf, cutter loopt deep, de worp gaat naar waar de
cutter aankomt. Die worp kreeg geen ontvanger, dus de schijf werd niet
doorgegeven, het volgende frame liet de worp staan, en in de animatie vloog er
niets. Je kon alleen naar iemand gooien die stilstond.

**Meegenomen.** Een worp die op iemand gericht is volgt hem. Versleep je de
ontvanger of het eind van zijn cut, dan schuift het eindpunt van die worp mee in
plaats van naar het lege gras te blijven wijzen.

## 2026-09-04 — De schijf vertrekt en landt in een hand

**Gekozen.** Tijdens de vlucht wordt de positie van de schijf gecorrigeerd naar
de levende positie van werper en ontvanger: bij het vertrek volledig naar de
werper, bij de aankomst volledig naar de ontvanger, daartussen naar rato.

**Waarom.** De curve van de worp ligt vast bij het begin van het frame, maar
beide spelers bewegen tijdens dat frame. Een handler die geeft-en-gaat liet de
schijf los uit lege ruimte, en een cutter die verder liep dan het eindpunt van de
worp zag de schijf achter zich landen. De correctie loopt van nul bij het
vertrek tot volledig bij de aankomst, dus de vorm van de worp blijft staan.

**Ook aangescherpt.** De vliegende worp is nu die van de speler die de schijf
werkelijk heeft. Voordien werd de eerste worp met een ontvanger genomen, wie hem
ook getekend had.

## 2026-09-04 — De schijf vliegt anders dan een speler loopt

**Gekozen.** De vlucht van de schijf volgt `worpEase`, een curve die snel start
en zacht aankomt. De beweging van spelers houdt `easeInOut`.

**Waarom.** Een speler versnelt en vertraagt, een schijf niet: die verlaat de
hand op volle snelheid en zweeft binnen. Met dezelfde ease aan beide kanten leek
de worp eerder overgedragen dan gegooid. Nagemeten in de editor: met `easeInOut`
legde de schijf in de eerste helft van de vlucht een kwart van de afstand af.

## 2026-09-04 — Afspelen eindigt op wat je ziet, en lust met een adempauze

**Gekozen.** Tijdens het afspelen loopt het actieve frame mee met de tijdlijn, en
op het einde blijft het laatste frame het actieve. Bij lussen blijft de
eindpositie 600 ms staan voor het opnieuw begint.

**Waarom.** Het actieve frame liep niet mee, dus na het afspelen sprong het beeld
terug naar het frame waarin je op play had gedrukt: de animatie eindigde op een
stand die meteen weer verdween. En een lus die zonder pauze herbegint laat je
precies het moment missen waar het diagram om draait. De pauze is een
kijkinstelling zoals de snelheidsvermenigvuldiger en wordt niet opgeslagen.

## 2026-09-04 — Favorieten zijn gedeeld, verwijderen is echt

**Gekozen.** Eén kolom `favoriet` op `diagrams`, dezelfde ster voor de hele club.
Verwijderen wist het diagram en zijn frames, met een bevestiging die de kaart
zelf overneemt en de naam toont.

**Alternatief.** Favorieten per trainer in een aparte tabel, en een prullenbak
met een archiefvlag.

**Waarom niet.** Op vraag van Daan, en het past bij de projectinstructie: geen
extra tabel waar een kolom volstaat, en geen extra scherm voor een prullenbak
die niemand nakijkt. De prijs staat er wel tegenover: haalt iemand een ster weg,
dan is die bij iedereen weg, en verwijderen is niet terug te draaien. Daarom
dekt de bevestiging de kaart af in plaats van ernaast te staan, zodat je ziet
waar je ja op zegt.

**Zoeken.** In het geheugen, over naam, tags, categorie en type samen. Elk woord
moet ergens landen, dus een tweede woord versmalt. Accenten en hoofdletters doen
niet mee. Bij honderden diagrammen is dat direct; pas bij tienduizenden zou dit
naar de database moeten, en zoveel worden het er niet.

## 2026-09-04 — Inloggen met een wachtwoord naast de magic link

**Gekozen.** Het inlogscherm vraagt standaard e-mailadres en wachtwoord. De
inloglink blijft eronder staan voor wie nog geen wachtwoord heeft of het vergeten
is. Een wachtwoord instellen gebeurt op `/account`; een vlag
`profiles.heeft_wachtwoord` bestaat alleen om te weten of de herinnering nog
getoond moet worden, het wachtwoord zelf zit in Supabase Auth.

**Waarom.** Op vraag van Daan. Een Supabase-sessie verloopt niet, dus op hetzelfde
toestel hoort één keer inloggen te volstaan; op een nieuw toestel heeft elk
systeem iets nodig, en met een wachtwoordbeheerder is dat één tik in plaats van
wachten op een mail. Google-login zou nog vlotter zijn maar kost eenmalige setup
in Google Cloud.

**Meegenomen.** De middleware zet nu `Cache-Control: private, no-store` op zijn
antwoord. Dat antwoord kan een vernieuwd sessiecookie dragen, en een CDN dat het
bewaart geeft de volgende bezoeker een verkeerde of verlopen sessie. Dat is de
waarschijnlijke oorzaak van het onverwachte uitloggen.

**Rechten.** `profiles` mag je nu bijwerken, maar alleen je eigen rij en alleen de
kolommen `naam` en `heeft_wachtwoord`. RLS bepaalt welke rij, een kolomrecht
bepaalt welke velden; zonder dat tweede kon een trainer zichzelf `can_edit` geven.

## 2026-09-04 — Eén tegelijk in een diagram

**Gekozen.** Een aparte tabel `diagram_locks` met diagram, gebruiker en een
vervaltijd. De editor claimt bij het openen en vernieuwt elke dertig seconden,
maar alleen zolang het tabblad zichtbaar is. De claim staat op twee minuten.
Weggaan geeft hem meteen vrij.

Kom je terug en heeft iemand anders hem intussen, dan zegt het scherm dat, en ga
je terug naar het overzicht. Kom je aan bij een diagram dat al bezet is, dan zie
je wie ermee bezig is en een knop om het opnieuw te proberen. In beide gevallen
geen half werkende editor: knoppen die niets doen zijn erger dan geen knoppen.

**Alternatief.** Kolommen op `diagrams` in plaats van een eigen tabel.

**Waarom niet.** Er staat een trigger op `diagrams` die `gewijzigd_op` bijwerkt.
Een hartslag om de dertig seconden zou het diagram dus permanent bovenaan
"recent gewijzigd" houden zonder dat er iets gewijzigd is. Een slot is bovendien
vluchtige toestand met een eigen levensduur en hoort niet bij de inhoud.

**Het is een echt slot.** De policy op `frames` eist een geldige claim, dus zonder
slot weigert de database je schrijfactie. Een afspraak die alleen in de frontend
staat is geen afspraak.

**Twee minuten.** Kort genoeg dat wie wegloopt de club niet lang blokkeert, lang
genoeg dat nadenken of een wankele verbinding je plek niet kost. Er is bewust
geen knop om een slot af te pakken: dan kan je iemands werk wegtrekken terwijl
hij aan het typen is.

**Ook rechtgezet.** Een ster zetten dook het diagram naar boven in "recent
gewijzigd". De trigger negeert nu een wijziging die alleen `favoriet` betreft.
