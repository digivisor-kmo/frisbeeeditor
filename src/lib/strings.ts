/**
 * Every user-visible string lives here. The interface is Dutch; the code is English.
 */
export const nl = {
  app: {
    naam: 'DUCs Playbook',
    ondertitel: 'Spelvarianten en drills voor DUC Dendermonde',
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
    stap: 'Stap 1 van de editor: het veld.',
    toelichting:
      'Alleen de veldweergave staat er. Spelers, pionnen en arrows komen in de volgende stappen.',
  },
} as const
