# ApartmentBudgetPlanner

Composant Vue 3 qui permet à une personne qui meuble son premier logement de fixer son budget mobilier global et de choisir les pièces à équiper en premier, avec un récapitulatif mis à jour en direct.

- **Maquette Figma** : [Vente-unique — Mon premier chez-moi · Budget & priorités](https://www.figma.com/design/bWZR3sctpqjQYcOUf5cBoM)
- **Démo publique du parcours en 4 étapes** : [dikengadesign.fr/apartment-budget-planner](https://dikengadesign.fr/apartment-budget-planner/) (GitHub Pages, branche `gh-pages` ; ou `npm run dev`)

> **Exercice de conception, non affilié à Vente-unique.** Réalisé dans le cadre d'un exercice de recrutement en product design. Les tokens de style (couleurs, espacements, rayons, polices) ont été relevés dans les feuilles CSS publiques de vente-unique.com ; aucun logo ni image du site n'est inclus dans ce dépôt : la démo affiche le logo et les photos produits en les chargeant directement depuis vente-unique.com. Les produits cités dans la démo sont des données de démonstration.

## Installation

```bash
npm install
npm run dev              # démo du parcours en 4 étapes (données de démonstration)
npm test                 # 21 tests Vitest (logique, composant, briques seules, cas limites)
npm run build            # vérification TypeScript + build
SINGLE=1 npm run build   # démo en un seul fichier dist/index.html
```

Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Vitest + Vue Test Utils.

## Contenu

```
src/components/ApartmentBudgetPlanner/
├── ApartmentBudgetPlanner.vue   composant de l'étape 3
├── parts/
│   ├── ChoiceCard.vue           choix encadré (radio / checkbox)
│   ├── PriorityBadge.vue        pastille de rang
│   ├── ProgressSteps.vue        indicateur d'étapes
│   └── BudgetSummary.vue        récapitulatif et répartition
├── budget-logic.ts              fonctions pures (montant, tranche, priorités, répartition, validation)
├── types.ts                     types publics
└── index.ts                     exports
src/App.vue, src/demo/           démo du parcours (données de démonstration)
tests/                           tests Vitest
docs/                            analyse du site et choix UX
```

Sommaire de la documentation : [Nom](#1-nom) · [Description](#2-description) · [Cas d'utilisation](#3-cas-dutilisation) · [Structure](#4-structure) · [Propriétés](#5-propriétés) · [Événements](#6-événements) · [États](#7-états) · [Variantes](#8-variantes) · [Espacements](#9-règles-despacement) · [Responsive](#10-comportement-responsive) · [Accessibilité](#11-accessibilité) · [Exemple d'intégration](#12-exemple-dintégration)

---

## 1. Nom
`ApartmentBudgetPlanner` — fichier `src/components/ApartmentBudgetPlanner/ApartmentBudgetPlanner.vue`.

## 2. Description
Formulaire en deux sections (budget, pièces prioritaires) + indicateur d'étapes + récapitulatif. Le composant ne connaît ni l'API ni le routeur : il reçoit les données par props, renvoie chaque modification par `v-model`, et signale la navigation et la validation par événements.

## 3. Cas d'utilisation
- Étape 3 du parcours « Mon premier chez-moi » (cas principal).
- Toute configuration « budget global + priorités » : liste de mariage, aménagement d'une pièce, offre pro (en changeant `rooms`, `presets`, `steps`).
- À ne pas utiliser pour un simple filtre de prix de listing (le filtre Prix existant suffit).

## 4. Structure
Le composant est un **assemblage de 4 briques réutilisables**, chacune exportée seule et dessinée en composant Figma :

| Brique | Fichier | Rôle | Réutilisable pour |
|---|---|---|---|
| `ChoiceCard` | `parts/ChoiceCard.vue` | Choix encadré du site (`toggle-choice`), vrai radio ou checkbox, slot `aside` | Livraison, options de service, taille, couleur |
| `PriorityBadge` | `parts/PriorityBadge.vue` | Pastille de rang | Liste de souhaits, classement, ordre d'étapes |
| `ProgressSteps` | `parts/ProgressSteps.vue` | Indicateur d'étapes (seul composant nouveau) | Tout parcours guidé, tunnel |
| `BudgetSummary` | `parts/BudgetSummary.vue` | Récapitulatif : lignes + Modifier, répartition, « À l'étape suivante » | Étape 4, panier de projet |

```
ApartmentBudgetPlanner.vue
├── ProgressSteps                 ol, aria-current="step" ; version mobile : retour + « Étape 3 sur 4 »
├── .abp-layout (2 colonnes ≥ 992 px)
│   ├── .abp-main
│   │   ├── header                Titre (h1) + texte explicatif + rappel du style
│   │   ├── fieldset Budget       ChoiceCard × tranches (radio) + champ montant (input du site)
│   │   └── fieldset Priorités    ChoiceCard × pièces (checkbox) → PriorityBadge ; compteur « n sur 3 »
│   └── BudgetSummary             + boutons du site (primary / secondary), barre fixe sous 768 px
└── p[aria-live]                  Annonces lecteur d'écran
```
Fichiers : `types.ts` (types publics), `budget-logic.ts` (fonctions pures testées), `index.ts` (exporte le composant **et** les 4 briques).

```ts
import { ChoiceCard, PriorityBadge, BudgetSummary } from '@/components/ApartmentBudgetPlanner'
```

### Fidélité au site
Repris tel quel : Poppins (`--font-family-base`), couleurs squid/red/orange/green/blue, bouton principal et secondaire (h48, rayon 28), choix encadré (rayon 14, bord 1 → 2 px), champ (h48, rayon 14), rayons, espacements, anneau de focus. Les styles utilisent les **noms de variables CSS du site** avec valeur de repli : sur vente-unique.com, ce sont les variables du site qui s'appliquent (titres en Recoleta via `--font-family-heading`). Ajouté : indicateur d'étapes, pastille de priorité, compteur, récapitulatif budget.

## 5. Propriétés
| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `modelValue` | `BudgetPlannerValue` `{ presetId, amount, priorities }` | — (requis) | Valeur du v-model. Le parent la garde : revenir en arrière ne perd rien. |
| `rooms` | `PlannerRoom[]` `{ id, label, description? }` | — (requis) | Pièces choisies à l'étape 2. Tableau vide → état vide. |
| `presets` | `BudgetPreset[]` `{ id, label, description?, min, max }` | 4 tranches | Tranches de budget ; `description` dit ce que la tranche permet (`max: null` = tranche ouverte). |
| `minAmount` / `maxAmount` | `number` | `300` / `10000` | Bornes du montant exact (hypothèse produit). |
| `maxPriorities` / `minPriorities` | `number` | `3` / `1` | Limites de sélection des pièces prioritaires. |
| `steps` | `PlannerStep[]` | 4 étapes | Libellés de l'indicateur. |
| `currentStep` | `number` (1-based) | `3` | Étape affichée. |
| `context` | `{ housing?, style? }` | `{}` | Rappel des étapes précédentes. |
| `allocationWeights` | `number[]` | `[40, 35, 25]` | Répartition indicative : priorité 1, priorité 2, reste. |
| `title`, `intro`, `submitLabel`, `previousLabel` | `string` | textes FR | Contenus éditables. |
| `loading` | `boolean` | `false` | Désactive les actions et affiche un indicateur. |
| `locale` / `currency` | `string` | `fr-FR` / `EUR` | Formatage des montants. |

## 6. Événements
| Événement | Charge utile | Quand |
|---|---|---|
| `update:modelValue` | `BudgetPlannerValue` | À chaque changement de tranche, de montant ou de priorité. |
| `submit` | `{ value, referenceAmount }` | Clic sur le bouton principal, données valides. `referenceAmount` = montant exact, ou milieu de la tranche. |
| `invalid` | `PlannerError[]` `{ field, message }` | Clic sur le bouton principal, données invalides. Le focus va au premier champ en erreur. |

### Slot
| Slot | Rôle |
|---|---|
| `summary-footer` | Contenu libre sous les boutons du récapitulatif (ex. réassurance du site). Masqué sous 768 px. |

### Exports utiles
`computeAllocation(total, priorités, pièces, poids?)` calcule la répartition indicative ; `joinLabels(['Bureau', 'Cuisine'])` renvoie « Bureau et cuisine ». Tous deux sont exportés par `index.ts`.
| `previous` | — | « Étape précédente » (bouton desktop, lien mobile). |
| `edit-step` | `number` | Clic sur une étape terminée ou un « Modifier » du récapitulatif. |
| `edit-style` | — | « Modifier » du style choisi. |

## 7. États
| Élément | États |
|---|---|
| Choix encadré | défaut · survol (bord squid-700) · focus clavier (anneau 2 px blanc + 4 px blue-600) · sélectionné (bord 2 px, contrôle plein) · désactivé (opacité 0,5, non focusable) |
| Champ montant | défaut · focus (fond blanc + anneau) · erreur (bord rouge + message, `aria-invalid` ; un montant invalide décoche la tranche) · désactivé |
| Bouton principal | défaut · survol · focus · **indisponible** (étape incomplète : grisé, `aria-disabled`, reste cliquable pour afficher les erreurs, raison affichée dessous) · désactivé (aucune pièce ou `loading`) · chargement |
| Pièces | limite atteinte (autres pièces désactivées + message) · état vide (aucune pièce → « Choisir mes pièces ») |
| Récapitulatif | budget « À définir » · répartition masquée tant qu'aucun budget n'est choisi · « À l’étape suivante » cite les pièces prioritaires |
| Compteur | « n sur 3 sélectionnée(s) », passe en couleur attention à la limite (avec message texte) |
| Validation | erreurs visibles après le premier envoi ; le montant est vérifié dès la sortie du champ |

## 8. Variantes
- **Avec ou sans tranches** : `presets: []` n'affiche que le champ montant (libellé « Montant de votre budget »).
- **Nombre de priorités** : `maxPriorities` (1 à n), `minPriorities: 0` pour les rendre facultatives.
- **Parcours différent** : `steps` + `currentStep`.
- **Affichage** : desktop 2 colonnes, tablette 1 colonne, mobile avec barre fixe (voir §10).

## 9. Règles d'espacement
Uniquement les tokens `spacing-*` du site (2 · 4 · 8 · 12 · 16 · 24 · 32 · 48).
- Entre sections : 32 (`spacing-extra-large`) · entre choix : 16 (`spacing-medium`), 12 sur mobile.
- Choix encadré : padding 12 (`spacing-small`), gap 12, hauteur ≥ 62.
- Récapitulatif : padding 24 (`spacing-large`), rayon 20 (`radius-medium`).
- Colonnes : contenu flexible + récapitulatif 400 px, gouttière 64 (`spacing-extra-extra-large`).
- Rayons : 14 (`radius-small`) choix et champ · 20 (`radius-medium`) récap · 28 (`radius-large`) boutons.

## 10. Comportement responsive
Points de rupture repris du site (992 et 768 px).
- **≥ 992 px** : 2 colonnes, récapitulatif collant (`top: var(--var-sticky-offset)`, variable du site).
- **768 – 991 px** : 1 colonne, choix sur 2 colonnes, récapitulatif sous le contenu, seuls le numéro et le libellé de l'étape en cours sont affichés.
- **< 768 px** : choix pleine largeur ; indicateur en 4 segments + lien retour + « Étape 3 sur 4 » ; récapitulatif replié dans une barre fixe en bas (budget, nombre de priorités, bouton principal), « Récapitulatif » le déplie.

## 11. Accessibilité
- Sections en `fieldset` / `legend` ; tranches en vrais `input[type=radio]` (flèches du clavier natives) ; pièces en `input[type=checkbox]`.
- Indicateur d'étapes en `nav` + `ol`, étape en cours `aria-current="step"`, étapes terminées en boutons explicites (« Mon logement, étape 1 terminée. Modifier »).
- Focus visible partout : anneau `shadow-focus` du site (2 px blanc + 4 px blue-600).
- Erreurs : texte + icône + couleur (jamais la couleur seule), `aria-invalid`, `aria-describedby`, focus déplacé sur le premier champ en erreur.
- Région `aria-live="polite"` : ajout/retrait d'une priorité, limite atteinte, nombre d'erreurs.
- Pièces au-delà de la limite : `disabled` (sorties de l'ordre de tabulation) + message explicatif.
- Cibles tactiles ≥ 44 px ; `prefers-reduced-motion` respecté.
- Ordre DOM = ordre visuel.

## 12. Exemple d'intégration
```vue
<script setup lang="ts">
import { ref } from 'vue'
import { ApartmentBudgetPlanner, type BudgetPlannerValue } from '@/components/ApartmentBudgetPlanner'

const value = ref<BudgetPlannerValue>({ presetId: null, amount: null, priorities: [] })
const rooms = [
  { id: 'salon', label: 'Salon', description: 'Canapé, table basse, meuble TV' },
  { id: 'chambre', label: 'Chambre', description: 'Lit, matelas, rangement' },
]
function goToSelection({ value, referenceAmount }) {
  // appel de l'API de recommandation, puis navigation vers l'étape 4
}
</script>

<template>
  <ApartmentBudgetPlanner
    v-model="value"
    :rooms="rooms"
    :context="{ housing: 'Studio · 32 m²', style: 'Contemporain' }"
    :current-step="3"
    @previous="router.push({ name: 'mes-pieces' })"
    @edit-step="(n) => router.push(stepRoute(n))"
    @submit="goToSelection"
  />
</template>
```

## Titre et police
Le titre utilise `--font-family-heading` (Recoleta sur le site). Graisse et taille sont réglables par variables :
`--abp-title-weight` (défaut `400`), `--abp-title-size` (`40px`), `--abp-title-line-height` (`48px`), soit Recoleta 400 40/48 comme sur le site.
La démo, sans Recoleta, utilise Poppins SemiBold 32/40 comme la maquette Figma (`--abp-title-weight: 600; --abp-title-size: 32px; --abp-title-line-height: 40px`).

## Cibles tactiles
Choix encadrés 62 px, boutons et champ 48 px, boutons des cartes produit 44 px ; les liens texte (« Modifier ») ont une zone de clic de 44 px de haut.

## Tokens
Le composant utilise **les noms des variables CSS du site** (`--interactive-primary-background-default`, `--stroke-neutral-hard`, `--spacing-small`, `--radius-small`, `--font-family-base`…), avec en repli la valeur relevée le 25/11/2026. Intégré à vente-unique.com, il hérite automatiquement des tokens officiels ; isolé, il garde le même rendu.

## Points ouverts
- Police de titre `--font-family-heading` (Recoleta) : chargée par le site ; en dehors, repli Poppins.
- Bornes 300 – 10 000 €, tranches et poids 40/35/25 : hypothèses produit à valider avec les données.
- Le style est choisi en haut de l'étape 3, hors de ce composant (événement `edit-style`).

---

## Licence

Code fourni pour l'évaluation de l'exercice. Aucune licence de réutilisation n'est accordée : merci de me contacter pour tout autre usage.
