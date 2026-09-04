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
    nietsBewaard:
      'Dit diagram wordt nog niet bewaard. Opslaan komt in de volgende stap; als je de pagina herlaadt is je werk weg.',
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
      'Kies een gereedschap en tik op het veld om te plaatsen. Slepen verplaatst meteen. Shift-klik selecteert er een bij, alt schakelt het raster tijdelijk uit.',
  },
  bouw: {
    stap: 'In aanbouw.',
    toelichting:
      'Het veld, het inloggen en het plaatsen van spelers en pionnen werken. Arrows, opslaan en de bibliotheek komen in de volgende stappen. Kies hieronder een startpunt om de editor te openen.',
  },
} as const
