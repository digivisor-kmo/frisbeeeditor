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
  bouw: {
    stap: 'Het veld en het inloggen staan er.',
    toelichting:
      'Spelers, pionnen en arrows komen in de volgende stappen. Er valt hier nog niets te tekenen.',
  },
} as const
