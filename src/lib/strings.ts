/**
 * Every user-visible string lives here. The interface is Dutch; the code is English.
 */
export const nl = {
  app: {
    naam: 'DUCs Playbook',
    ondertitel: 'Spelvarianten en drills voor DUC Dendermonde',
  },
  login: {
    uitleg: 'Log in met je e-mailadres. Je krijgt een link, geen wachtwoord.',
    emailLabel: 'E-mailadres',
    knop: 'Stuur me een link',
    bezig: 'Bezig…',
    verstuurd: 'Er is een link onderweg naar',
    verstuurdUitleg:
      'Open hem op het toestel waar je wil werken. De link is één keer bruikbaar en vervalt na een uur.',
    fout: 'Dat lukte niet:',
    linkVerlopen: 'Die link werkt niet meer. Vraag hieronder een nieuwe aan.',
    afmelden: 'Afmelden',
  },
  rechten: {
    trainer: 'Trainer, mag bewerken',
    speler: 'Speler, alleen lezen',
    spelerUitleg:
      'Je account heeft nog geen bewerkrechten. Vraag Daan om je als trainer aan te zetten.',
  },
  veld: {
    volledig: 'Volledig veld',
    half: 'Half veld',
    vrij: 'Vrij vlak',
    volledigUitleg: 'Liggend, beide endzones. Voor volledige spelvarianten.',
    halfUitleg: 'Staand, één endzone plus 32 meter. Voor endzone-sets en drills.',
    vrijUitleg: 'Geen lijnen. Voor drills zonder veldreferentie.',
  },
  editor: {
    titel: 'Editor',
    terug: 'Terug',
    nietsBewaard: 'Nog niets wordt bewaard. Herlaad je de pagina, dan is je werk weg.',
    selecteren: 'Selecteren',
    speler: 'Speler',
    pion: 'Pion',
    aanval: 'Aanval',
    verdediging: 'Verdediging',
    raster: 'Raster',
    ongedaan: 'Ongedaan',
    opnieuw: 'Opnieuw',
    verwijderen: 'Verwijderen',
    bezettingUitleg: 'Aanval en verdediging op het veld. Kleurt zodra het er geen zeven zijn.',
    hulp:
      'Kies een gereedschap en tik op het veld om te plaatsen. Slepen verplaatst meteen. Tik een speler aan voor het menu; daar teken je ook een cut, juke of worp. Van een arrow open je met de punt het menu en met het lijfje de handvatten.',
  },
  menu: {
    schijf: 'Schijf',
    instellingen: 'Instellingen',
    verwijderen: 'Verwijderen',
    kant: 'Kant',
    kantWisselen: 'Kant wisselen',
    positie: 'Positie',
    eigenLabel: 'Eigen label',
    eigenLabelLeeg: 'Positie',
    kleur: 'Kleur',
    typeWisselen: 'Type wisselen',
    worptype: 'Worptype',
    worptypeUitleg:
      'Bepaalt hoe de curve standaard buigt. Heb je de bocht zelf al versleept, dan blijft die staan.',
  },
  bulk: {
    titel: 'Selectie bewerken',
    alles: 'Alles',
    spelers: 'Spelers',
    pionnen: 'Pionnen',
    arrows: 'Arrows',
    deselecteren: 'Deselecteren',
    dupliceren: 'Dupliceren',
    verwijderen: 'Verwijderen',
    gemengd: 'Gemengd',
    arrowtype: 'Arrowtype',
  },
  kleuren: {
    standaard: 'Standaard',
    geel: 'Geel',
    paars: 'Paars',
    wit: 'Wit',
    grijs: 'Grijs',
  },
  bouw: {
    stap: 'In aanbouw.',
    toelichting:
      'Het veld, het inloggen en het plaatsen van spelers en pionnen werken. Arrows, opslaan en de bibliotheek komen in de volgende stappen. Kies hieronder een startpunt om de editor te openen.',
  },
} as const
