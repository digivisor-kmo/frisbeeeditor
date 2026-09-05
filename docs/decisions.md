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

## 2026-09-04 — Een worp die nergens aankomt mag niet stil mislukken

Vier dingen samen maakten het gooien van een schijf onbetrouwbaar aanvoelen. Ze
hebben één oorzaak: een worp zonder ontvanger deed niets en zag er precies uit
als een worp die wel aankwam.

**Een verse worp mikt nu op iemand.** Hij verscheen blind twaalf meter in de
aanvalsrichting, dus je moest élke keer de punt naar de ontvanger slepen, en als
je er anderhalve meter naast zat gebeurde er niets. Nu kiest hij de
waarschijnlijkste ontvanger: bij voorkeur iemand die cut, en dan naar het eind
van die cut, want daar gooi je naartoe. Klopt de gok niet, dan kost dat één
sleepbeweging, wat vroeger de vaste prijs was.

**Het magneetbereik groeit mee met de zoom.** Anderhalve meter is op een uitgezoomd
veld nog geen twintig pixels. Nu minstens een vingertop breed, hoe ver je ook
uitgezoomd bent.

**Je ziet waar hij vastklikt.** Tijdens het slepen verschijnt een ring rond de
ontvanger. Los je daar, dan weet je dat het gelukt is.

**Een worp zonder ontvanger ziet er onaf uit** — een open cirkel in plaats van een
pijlpunt — en staat in de teller "nog te doen". Zwijgen was hier het probleem.

**Ook rechtgezet.** Een frame toevoegen kon alleen met een cut of een juke. Een
swing waarbij de schijf van hand wisselt en niemand loopt is doodgewone ultimate,
en dat kon dus niet: de knop bleef grijs en zei dat je eerst een cut moest zetten,
alsof je worp niet meetelde. Een worp met een ontvanger is nu ook beweging. En een
cut van de schijfdrager kan je nu in een worp veranderen; die knop stond wel in
zijn spelersmenu maar niet in dat van de arrow zelf.

## 2026-09-04 — Gebruiksvriendelijkheid: wat weg mocht

**Eén framenummer, niet twee.** De navigator zei "Frame 2/2" terwijl de
afspeelbalk "Frame 1" zei, omdat de tijdlijn niet meebewoog met het actieve
frame. Nu verspringt de speelkop mee als je van frame wisselt, en is het tweede
nummer uit de afspeelbalk verdwenen. Twee tellers die elkaar tegenspreken zijn
erger dan één.

**De uitlegtekst verdwijnt zodra je tekent.** Er stond een alinea van vijf zinnen
permanent onder het veld, op desktop half afgesneden door de afspeelbalk. Nu één
zin, en alleen zolang er in het hele diagram nog geen arrow staat. Uitleg die
nooit weggaat wordt niet gelezen.

**De toolbar op een telefoon schuift niet meer zijwaarts.** Hij scrolde
horizontaal zonder scrollbalk, waardoor de instellingen, de teller "nog te doen"
en de opslaanstatus buiten beeld vielen aan de rechterkant. Nu breekt hij af over
meerdere rijen. Bediening die je niet ziet bestaat niet. Wat op een telefoon
wegvalt is alleen wat context is en geen knop: het woord bij de opslaanbolletje
en het chipje dat zegt hoeveel frames meebewegen.


## 2026-09-04 — Vormgeving: twee letters, en waarom dat de eerdere regel overrulet

**Gekozen.** Plus Jakarta Sans voor koppen en de naam van de app, Inter voor
alles wat je bedient en voor de letters op de tokens. Beide variabel en
zelf gehost door `next/font`, dus één verzoek en geen layout shift.

**Wat dit vervangt.** De vormgevingsbijlage zei: één humanistische schreefloze
voor alles. Dat is een goede regel en ik heb hem bewust doorbroken, op vraag van
Daan, met de referentie thealpy.studio erbij, die precies deze verdeling maakt
(Satoshi voor de koppen, Inter voor de rest). De discipline zit in de scheiding:
de displayletter komt nooit in een knop of een veld terecht, dus binnen één
bedieningselement botsen de twee nooit.

**Waarom het werkt.** Inter heeft de x-hoogte die een positieletter op 26 pixels
in de zon leesbaar houdt. Plus Jakarta Sans heeft de geometrie en de lichte
warmte die een scherm gemaakt laat lijken in plaats van in elkaar gezet. Een
zuivere UI-letter heeft dat laatste met opzet niet.

**Verder in dezelfde beweging.** Een typeschaal met eigen regelafstand en
spatiëring per stap. Koelere neutralen. Een schaduwladder van twee lagen per
trap, want één platte blur is precies wat een kaart opgeplakt doet lijken. Een
focusring als token. Knoppen die 38 pixels hoog zijn voor een muis en 44 voor een
vinger, via `pointer: coarse`, in plaats van het verschil te delen en geen van
beide te bedienen. Groepen knoppen zijn een echt segmented control: een verzonken
baan met een verhoogde pil op de keuze, want drie knoppen naast elkaar lezen als
drie beslissingen en dit leest als één beslissing met drie antwoorden.

## 2026-09-04 — De actiebalk op iconen

**Gekozen.** Ongedaan, opnieuw, frame toevoegen, vorige en volgende zijn iconen
met tooltip en aria-label. De gereedschappen dragen icoon plus woord op desktop
en alleen het icoon op een telefoon. Het framenummer staat binnen de baan tussen
zijn twee pijlen, met vaste breedte en tabelcijfers zodat 1/2 en 1/10 even breed
zijn.

**En het cirkelmenu andersom.** Daar staan de woorden nu juist altijd, ook met
een muis. Een cut, een juke en een worp zijn alle drie een pijl; vijf naamloze
icoontjes rond een token zijn een raadsel tot je ze hebt geleerd. De boog rekent
zijn straal op die labels, waardoor hij meteen ook niet meer over de buurman
valt. De drie arrowicoontjes dragen nu hun eigen vorm: recht, slingerend,
gestreept met open punt.

## 2026-09-04 — Waar het bulkpaneel staat

**Gekozen.** Het zweeft vast net boven de onderbalk, over de onderste strook van
het veld heen.

**Alternatief.** In de paginastroom onder het veld, zoals het eerst stond.

**Waarom niet.** Daar landde het achter de vaste onderbalk. Je moest ernaartoe
scrollen terwijl je een selectie vasthield, en dat is precies het moment waarop
scrollen niet kan. Onzichtbare bediening is geen bediening.

**De prijs.** Het dekt nu de onderste strook van het speelveld af. Dat is bewust
de onderkant en niet de bovenkant: de projectinstructie wijst er terecht op dat
de referentietool zijn paneel over de bovenste meters legt, precies waar bij een
endzone-set je spelers staan. Wie het veld daar nodig heeft, deselecteert.

**De hoogte van de dock wordt gemeten**, niet geraden, en als `--dock-hoogte`
gepubliceerd. Die dock is een afspeelbalk plus een framestrip op desktop, krijgt
een toolbar op een telefoon, en groeit een rij zodra er binnenin iets afbreekt.
Een vast getal klopt niet meer zodra iemand er een knop bij zet.

## 2026-09-04 — Het slot repareert zichzelf bij het opslaan

**Getest.** Met een verlopen slot weigert de database de schrijfactie werkelijk:
`new row violates row-level security policy for table "frames"`. Het slot is dus
een echte grendel en geen afspraak in de frontend. Dat is goed nieuws, maar de
trainer kreeg die Engelse zin te zien.

**Gekozen.** Niet het slot claimen vóór elke save — dat is een extra rondje naar
de server om de twee seconden tekenen. In plaats daarvan repareren bij het
mislukken: gaat de schrijfactie onderuit op de policy, neem dan het slot terug en
probeer één keer opnieuw. Alleen als iemand anders hem werkelijk vasthoudt wordt
het een fout, en dan staat er een zin over mensen in plaats van een policynaam.

Dit dekt meteen het gewone geval: een tabblad dat twee minuten in een broekzak
zat, verliest zijn slot omdat de hartslag stopt zodra het scherm verborgen is.
Kom je terug, dan gebeurt er nu niets zichtbaars in plaats van een rode melding.

**Nog niet getest.** De melding "iemand anders is hier bezig" zelf. Er bestaat
maar één account, en een tweede aanmaken om mijn eigen code te testen zou een
spookgebruiker in de echte database zetten. Dat moet met een tweede persoon.

## 2026-09-04 — De anon-rol kon alles lezen

**Gevonden.** De rollen `anon` en `authenticated` krijgen in Supabase standaard
rechten op elke tabel in `public`. Samen met de policies betekende dat: elk
niet-concept diagram, elk profiel inclusief e-mailadres, elk playbook en elk
deel-token was op te vragen zonder in te loggen. De publishable key zit in de
clientbundel en is dus openbaar; RLS was de enige poort en die stond open.

**Gedaan.** Alle rechten op de publieke tabellen ingetrokken voor `anon`, en de
select-policies noemen nu expliciet `to authenticated`, zodat de bedoeling in de
policy zelf staat en niet alleen in de grants. De tokenlijst is bovendien alleen
zichtbaar voor wie mag bewerken: een lijst die iedereen kan opvragen maakt het
token zinloos.

**Nagemeten.** Als `anon` geeft `select from diagrams` nu `permission denied`,
terwijl `diagram_via_token` met een geldig token wel het diagram teruggeeft.

## 2026-09-04 — Spelersweergave en deellinks

**Gekozen.** Spelers hebben een eigen route met een lijst en een leesscherm. Wie
geen bewerkrechten heeft wordt vanaf `/` en vanaf een editor-URL automatisch
daarnaartoe gestuurd.

**Het canvas is een eigen component**, niet de editor met zijn handlers uitgezet.
Een token dat twee pixels met je vinger meegaat en dan weigert is precies het
soort half werkend scherm dat de projectinstructie verbiedt. De afspeellogica
wordt wél gedeeld: de animatie is waar deze hele applicatie om draait, en twee
kopieën daarvan zijn binnen de maand twee verschillende animaties.

**Deellink.** Eén functie maakt de link of geeft de bestaande geldige terug, want
twee links naar hetzelfde diagram in dezelfde groepschat is verwarrend en wie
twee keer op delen drukt bedoelt niet twee links. Negentig dagen geldig. De
publieke route haalt alles uit één security definer functie, dus het token is de
enige sleutel: er staat geen id in een URL waarmee je kan raden.

De link komt op het klembord én voluit in beeld. Een klembord is onzichtbaar:
zonder de tekst op het scherm weet je niet of die druk iets gedaan heeft, en op
een telefoon kan je hem anders ook niet met de hand in een chat plakken.

## 2026-09-04 — De bovenbalk op een telefoon

De merknaam en twee knoppen pasten niet naast elkaar op een toestel van vierhonderd
pixels breed; de knoppen landden boven op de naam. Op een telefoon staat er nu
één icoon dat naar het accountscherm leidt, en afmelden heeft daar zijn eigen
plek gekregen. De primaire knop op een paginakop loopt daar ook over de volle
breedte, binnen duimbereik.

## 2026-09-04 — Mobiel: meten in plaats van aftrekken

**Wat er mis was.** De mobiele opmaak trok een hard getal van de schermhoogte af
om de veldhoogte te bepalen. Dat getal klopte niet in portret, opnieuw niet in
landschap, en een derde keer niet zodra de balk over twee rijen brak. Op een echt
toestel gaf dat een postzegel van een veld midden in een lege witte kaart. Ik had
het op een desktopbrowser beredeneerd en niet gezien; dat is precies waarom Daan
het op zijn eigen telefoon moest openen.

**Gekozen.** Niets wordt meer geraden. De hoogte van de vaste onderbalk en de
ruimte die daarboven overblijft worden gemeten en als `--dock-hoogte` en
`--veld-ruimte` gepubliceerd, met een ResizeObserver op de balken zelf, zodat het
meteen klopt als er een rij bijkomt.

**Breedte op auto in de editor**, zodat de doos het veld omsluit. Een doos over
de volle breedte rond een staand veld van 37 bij 100 meter is wat die twee velden
wit aan weerskanten veroorzaakte. Op een leesscherm net andersom: daar neemt het
veld de volle breedte en scrolt de pagina, want daar tekent niemand.

**De balk moest ook slanker.** Hij at 282 van de 911 pixels. Snelheid en focus
zijn naar het uitklappaneel verhuisd, waar de projectinstructie ze trouwens al
had staan: kijkinstellingen die je één keer aanraakt horen niet permanent in de
balk die wel moet blijven. Nu 178 in portret en 133 in landschap.

**Nagemeten** op 412×915 en op 915×412: niets loopt nog over, en het veld is
250×617 respectievelijk 865×351. In portret is de breedte begrensd door de
verhouding van het veld zelf, niet door de opmaak.

## 2026-09-04 — De editorkop op een telefoon

Terugknop, naam, delen, bezetting, validatie en opslaanstatus passen niet op één
regel van vierhonderd pixels. Ze werden afgekapt aan de rechterkant en het
naamveld verdween volledig. De kop loopt nu over twee rijen: de naam met de
terugknop, en daaronder de statusstrip. Alles blijft bereikbaar; niets verdwijnt
achter een rand.

## 2026-09-05 — Vlotheid: minder tekenen en minder wegschrijven

Drie oorzaken, alle drie zichtbaar in de code.

**Alles werd opnieuw getekend bij elke pointermove.** Er stond nergens
memoïsatie, dus één sleepbeweging hertekende elk token, elke arrow én elke
framethumbnail, veertig keer per seconde. Immer geeft het document structurele
deling: bij een sleep krijgt alleen de verplaatste entiteit een nieuwe
identiteit. Met `memo` op de tokens, de arrows en de thumbnails hertekent React
nu wat veranderde en de rest niet. Er staat een test op die eigenschap, want de
hele optimalisatie leunt erop: een frame dat je niet bewerkte moet letterlijk
hetzelfde object blijven.

**Elke save schreef het hele document.** Een frame draagt het volledige veld als
jsonb; alle tien de frames om de twee seconden versturen is een payload die met
het diagram meegroeit en een database die rijen herschrijft die niemand heeft
aangeraakt. De store onthoudt nu wat er als laatste in ging, en een save vergelijkt
frame per frame op identiteit en stuurt alleen het verschil. De update op de
diagramrij en de opruimdelete gebeuren alleen nog als er werkelijk iets aan de
meta veranderde of een frame verdween.

**De bibliotheek haalde alle frames van alle diagrammen op** om per diagram één
thumbnail te tekenen. Nu alleen frame 1.

**En één die ik zelf veroorzaakt had.** De hook die de dockhoogte meet stond
zonder dependencies, dus hij brak twee observers af en bouwde ze opnieuw op bij
élke render — dus veertig keer per seconde tijdens een sleep. Dat is het
tegenovergestelde van wat een meethook hoort te doen. Hij draait nu één keer, en
de observers vangen de veranderingen zelf op.

**Niet gemeten.** Ik heb geen betrouwbare voor-en-na in de browser kunnen halen:
via deze weg staat het tabblad op de achtergrond en dan bevriest de browser zijn
tekenlus. De diagnose staat in de code, niet in een grafiek.

## 2026-09-05 — De editor op een telefoon is één veld

**Gekozen.** Op een telefoon vult het veld het scherm en zweeft de bediening
erboven in pillen. Linksonder de gereedschappen met ongedaan en opnieuw,
rechtsonder de framenavigator met de afspeelknop, bovenaan terug, de teller nog
te doen, de opslaanstatus en een schuifknop die een blad opent met alles wat je
één keer instelt. Op een tablet of desktop blijft de gewone opmaak met een vaste
kop, balk en strip: daar bestaat de ruimte, en permanente bediening verslaat
bediening die je moet oproepen.

Wat wordt beoordeeld is de korte zijde van het scherm, niet de breedte. Een
telefoon die je omdraait blijft een telefoon en een tablet rechtop blijft een
tablet; op breedte alleen zou een liggende telefoon de desktopopmaak krijgen en
een staande tablet de telefoonopmaak, precies verkeerd om.

**Uit de weg blijven.** De pillen doen zelf een stap opzij zolang je iets
versleept, en een tabje aan de onderrand vouwt ze helemaal weg. Bediening waar je
omheen moet werken is erger dan geen bediening.

## 2026-09-05 — Oriëntatie afdwingen kan niet, dus we vragen het

**De beperking.** Een browser kan een telefoon niet draaien. iOS heeft er geen
enkele API voor, en Android honoreert `orientation` in het manifest alleen voor
een geïnstalleerde app, en dan voor de hele app in plaats van per diagram. De
`screen.orientation.lock()`-API bestaat wel maar vereist fullscreen en werkt niet
op iOS.

**Gekozen.** Wat elke app doet die één richting nodig heeft: een scherm dat het
veld afdekt, zegt welke kant op, en wacht. Een volledig veld van 100 bij 37 meter
vraagt liggend, een half veld vraagt rechtop. Alleen op een telefoon; een tablet
heeft in beide richtingen ruimte genoeg en zou zich terecht beledigd voelen.

Het toestel in dat scherm draait. Dat is de enige animatie in de hele interface,
en ze is de boodschap in plaats van versiering: een tekening van een telefoon die
niet draait zegt niets. Ze staat stil voor wie systeembreed minder beweging vraagt.

## 2026-09-05 — Het clubblauw

`#3452fe`, rechtstreeks uit het clubembleem. Tegen wit meet dat 5,55 op 1, dus het
draagt witte tekst als knopkleur zonder hulp. Blijft uitsluitend interfacekleur:
de ploegen zijn bijna zwart tegenover oranje, en zodra blauw ook een teamkleur
wordt betekent het niet langer "dit is het ding om op te drukken".

De app-iconen zijn de eend uit het embleem in wit op dat blauw. De volledige
lockup met "Dendermondse Ultimate Club" en "est 2017" is onleesbaar op dertig
pixels; de eend alleen is op elk formaat herkenbaar.

## 2026-09-05 — Rechtop stapelen de zwevende pillen

Op een telefoon rechtop zijn de twee pillen samen breder dan het scherm: 217 en
195 pixels naast elkaar in 410, dus de rechtse liep er tot zestig pixels buiten
en de afspeelknop stond half naast het scherm.

**Alternatief.** De knoppen smaller maken. Afgewezen: dan zakken ze onder de 44
pixels die een duim nodig heeft, en dat is precies de maat waarvoor deze hele
mobiele weergave bestaat.

**Gekozen.** Twee regels. De gereedschappen onderaan waar de duim vanzelf komt,
de frames erboven. Dat kost hoogte, en die is er: een half veld rechtop is
breedtegebonden en vult de hoogte toch nooit helemaal. Liggend blijft alles op
één regel, want daar past het.
