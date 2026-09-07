# Waar de app staat, en wat ze nodig heeft

Opgemaakt op 7 september 2026, na de vraag om alles te herbekijken met
gebruiksvriendelijkheid als prioriteit. Vastgesteld door de code door te lopen
en de schermen te gebruiken, niet uit het hoofd.

---

## Eerst: niet herbouwen

De vraag was om alles opnieuw op te bouwen. Ik raad dat af, en dat is geen
gemakzucht.

Wat eronder zit, klopt. Posities in meters met een vaste schaal. Eén
interactielus voor alles op het veld. Immer-patches voor undo, waardoor een
sleep van vijftig bewegingen één stap is en een save alleen de frames wegschrijft
die veranderden. Het propagatiemodel met zijn invariant — de positie van een
speler in frame N+1 *is* het eindpunt van zijn pijl in frame N. Booglengte in
plaats van de curveparameter, zodat niemand in een bocht versnelt. RLS die in de
database staat en niet in de frontend. Daar zitten 254 tests op.

Herbouwen betekent dat allemaal opnieuw uitvinden, en met de fouten die we
onderweg al gevonden en gerepareerd hebben terug: de worp die stil faalde, de
zwevende pil die van het scherm liep, het tekstveld dat de cursor kwijtraakte,
het icoon dat op de verkeerde plek gesneden werd. Dat is geen vooruitgang.

Wat er wél scheelt is scherp en op te sommen. Het valt in drie soorten uiteen:
dingen die stuk zijn, dingen die halverwege stoppen, en dingen die per scherm
anders werken. Hieronder staan ze, met wat ik zou doen en in welke volgorde.

---

## 1. Stuk

### 1.1 Zones en tekst bestaan alleen in de editor

Het zwaarste punt. Je tekent een zone met een label en een notitie op het veld,
en geen enkele speler ziet ze ooit. Ze staan niet in de spelersweergave, niet op
de thumbnail in de bibliotheek, niet in de deellink, en ze verdwijnen tijdens het
afspelen daar.

De oorzaak is dat het veld op vier plaatsen apart getekend wordt: de editor, de
spelersweergave, de thumbnail en de animatielaag. De editor kreeg de nieuwe
entiteiten, de rest niet, en niets waarschuwde daarvoor.

**Wat ik doe.** Eén tekenlaag die alle vier gebruiken. Een entiteit erbij komt
dan overal tegelijk of nergens, in plaats van op één plek en drie plekken niet.

### 1.2 Er is geen weg naar de spelersweergave

`/speler` bestaat en werkt, maar nergens staat een link ernaartoe. Jij kan dus
niet nakijken wat je spelers te zien krijgen, en een speler die op `/` belandt
krijgt de trainersbibliotheek met sterren en prullenbakken die hij niet mag
gebruiken.

**Wat ik doe.** Een speler landt op zijn eigen weergave, altijd. Jij krijgt in
het accountmenu een regel "Bekijk als speler" die naar dezelfde weergave gaat,
met een strookje bovenaan om terug te keren.

### 1.3 De toelichting bij een frame kan niet ingevuld worden

De kolom bestaat, de spelersweergave leest hem uit en toont hem onder het veld.
Er is alleen nergens een invoerveld. Hij is dus altijd leeg, en dat is precies
het stukje tekst waarmee een speler begrijpt wat hij ziet.

**Wat ik doe.** Een veld op de framestrip, per frame, met dezelfde inline
bewerking als de naam van het diagram.

---

## 2. Halverwege gestopt

### 2.1 Sneltoetsen

Er werken er drie: ongedaan, opnieuw en verwijderen, plus escape. In de
afspraken staan er meer: `ctrl+d` dupliceren, `ctrl+a` alles, de cijfers 1 tot 5
voor het gereedschap, spatie om af te spelen. Op een laptop is dat het verschil
tussen werken en aanwijzen.

### 2.2 Velden die bestaan maar niet ingevuld kunnen worden

`tags`, `niveau`, `materiaal` en `aantal_spelers` staan in de database en worden
nergens gevraagd. Zoeken op tag is daardoor een zoekveld dat nooit iets vindt.

**Wat ik doe.** Tags erbij in het instellingenpaneel, want daar zoek je op. De
andere drie eruit, of pas terug wanneer ze een doel hebben. Een kolom die nooit
gevuld wordt is geen functie, het is rommel.

### 2.3 Hoe ver de ploeg met een variant staat

Uit de projectbeschrijving: geïntroduceerd, geoefend of ingeoefend, met de datum
van de laatste wijziging. De kolom staat er, de bediening niet. Dat is het ding
waarmee je bij het samenstellen van een training ziet wat lang niet meer aan bod
kwam, dus het verdient een plek op de kaart in de bibliotheek en een filter.

### 2.4 Export en playbooks

PNG per frame en PDF bestaan niet. De tabellen `playbooks` en `playbook_items`
staan klaar en zijn leeg. Dat is fase 3 en het is eerlijk dat het er nog niet is,
maar het hoort in dit overzicht.

---

## 3. Per scherm anders

### 3.1 De instellingen staan op twee plaatsen en zijn niet hetzelfde

Op een laptop zit een uitklappaneel, op een telefoon een blad van onderen. Het
blad bevat meer: de duur van een frame, de bezettingsteller, de deelknop en de
validatielijst. Wie op beide werkt, moet twee indelingen onthouden.

**Wat ik doe.** Eén lijst instellingen, één keer beschreven, die zich als paneel
of als blad toont. Verschillen in vorm, niet in inhoud.

### 3.2 Het boogmenu gaat over het veld heen

Bij een zone midden op het veld komt de boog over de spelers eronder te liggen.
Hij wijkt al uit voor de bovenrand van het scherm; hij zou ook moeten uitwijken
voor wat eronder ligt, of half doorschijnend moeten worden zolang hij openstaat.

### 3.3 Een half veld rechtop laat het scherm voor 40 procent leeg

Meetbaar: 410 bij 913 pixels, veld 410 bij 534. Dat is inherent aan de
verhouding van een half veld, tenzij we op een lang scherm meer meters tonen dan
de vaste 32. Dat verandert wat "half veld" betekent en is dus jouw beslissing,
geen technische.

### 3.4 De hulpzin staat alleen op een laptop

Onder het veld staat één regel uitleg. Op een telefoon, waar de helft van het
gebruik gebeurt, staat hij er niet.

---

## Volgorde

Drie rondes, elk op zichzelf af en de moeite waard om te deployen.

**Ronde 1 — wat je tekent, komt ook aan.** Eén gedeelde tekenlaag, zodat zones en
tekst overal verschijnen. Een weg naar en van de spelersweergave. De toelichting
per frame invulbaar. Hierna klopt wat een speler ziet met wat jij tekende, en dat
is nu niet zo.

**Ronde 2 — sneller werken.** Sneltoetsen. Eén instellingenlijst voor laptop en
telefoon. Het boogmenu dat uitwijkt. Tags. De status van een variant, met filter.
De hulpzin ook op een telefoon.

**Ronde 3 — het verlaat de app.** PNG per frame, PDF met de toelichting eronder,
en playbooks als geordende bundels.

Ronde 1 is het enige stuk dat ik dringend vind. Ronde 2 maakt het aangenaam.
Ronde 3 is fase 3 uit de afspraken en kan wachten tot 1 en 2 staan.
