/** Pièce choisie à l'étape 2 du parcours « Mon premier chez-moi ». */
export interface PlannerRoom {
  id: string
  label: string
  /** Exemples de meubles, affichés sous le libellé. */
  description?: string
}

/** Tranche de budget proposée (même logique que le filtre Prix du site, par tranches). */
export interface BudgetPreset {
  id: string
  label: string
  description?: string
  /** Borne basse incluse, en euros. */
  min: number
  /** Borne haute exclue, en euros. `null` = tranche ouverte (« Plus de … »). */
  max: number | null
}

/** Étape du parcours, pour l'indicateur de progression. */
export interface PlannerStep {
  id: string
  label: string
}

/** Valeur portée par le v-model. Le parent la conserve : revenir en arrière ne perd rien. */
export interface BudgetPlannerValue {
  /** Tranche sélectionnée. */
  presetId: string | null
  /** Montant exact saisi (facultatif), en euros. */
  amount: number | null
  /** Identifiants des pièces prioritaires, dans l'ordre de priorité. */
  priorities: string[]
}

/** Récapitulatif des étapes précédentes, affiché en lecture seule. */
export interface PlannerContext {
  housing?: string
  style?: string
}

export type PlannerErrorField = 'budget' | 'amount' | 'priorities' | 'rooms'

export interface PlannerError {
  field: PlannerErrorField
  message: string
}

export interface AllocationLine {
  /** Libellé affiché (pièce ou groupe de pièces). */
  label: string
  /** Part du budget, de 0 à 100. */
  percent: number
  /** Montant arrondi à l'euro. */
  amount: number
}
