import type {
  AllocationLine,
  BudgetPlannerValue,
  BudgetPreset,
  PlannerError,
  PlannerRoom,
} from './types'

/** Tranches par défaut et ce qu'elles permettent. Hypothèses produit à valider avec les données de vente. */
export const DEFAULT_PRESETS: BudgetPreset[] = [
  { id: 'lt-800', label: 'Moins de 800 €', description: 'L’essentiel : lit, matelas, canapé et table', min: 0, max: 800 },
  { id: '800-1200', label: '800 à 1 200 €', description: 'Les pièces principales, avec du rangement', min: 800, max: 1200 },
  { id: '1200-1800', label: '1 200 à 1 800 €', description: 'Tout le logement, rangements et éclairage compris', min: 1200, max: 1800 },
  { id: 'gte-1800', label: 'Plus de 1 800 €', description: 'Plus de choix de matières et de finitions', min: 1800, max: null },
]

/** Répartition par défaut entre priorité 1, priorité 2 et le reste (hypothèse produit). */
export const DEFAULT_WEIGHTS = [40, 35, 25]

/** Convertit une saisie libre (« 1 500 », « 1500,50 € ») en nombre. `null` = champ vide, `NaN` = saisie invalide. */
export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[\s  €]/g, '').replace(',', '.')
  if (cleaned === '') return null
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN
  return Number(cleaned)
}

/** Tranche qui contient le montant, ou `null`. */
export function presetForAmount(amount: number, presets: BudgetPreset[]): BudgetPreset | null {
  return presets.find((p) => amount >= p.min && (p.max === null || amount < p.max)) ?? null
}

/**
 * Montant de référence pour la répartition : le montant exact s'il existe,
 * sinon le milieu de la tranche (ou sa borne basse si elle est ouverte).
 */
export function referenceAmount(value: BudgetPlannerValue, presets: BudgetPreset[]): number | null {
  if (value.amount !== null && Number.isFinite(value.amount)) return value.amount
  const preset = presets.find((p) => p.id === value.presetId)
  if (!preset) return null
  return preset.max === null ? preset.min : Math.round((preset.min + preset.max) / 2)
}

/** Ajoute ou retire une priorité en respectant le maximum. L'ordre de clic devient l'ordre de priorité. */
export function togglePriority(current: string[], roomId: string, max: number): string[] {
  if (current.includes(roomId)) return current.filter((id) => id !== roomId)
  if (current.length >= max) return current
  return [...current, roomId]
}

/**
 * Répartition indicative : poids[0] pour la priorité 1, poids[1] pour la priorité 2…
 * le dernier poids couvre toutes les pièces restantes. Les poids non utilisés sont redistribués.
 */
/** « Bureau », « Cuisine » → « Bureau et cuisine » (libellés suivants en minuscule). */
export function joinLabels(labels: string[]): string {
  const l = labels.map((x, i) => (i === 0 ? x : x.charAt(0).toLowerCase() + x.slice(1)))
  return l.length <= 1 ? (l[0] ?? '') : `${l.slice(0, -1).join(', ')} et ${l[l.length - 1]}`
}

export function computeAllocation(
  total: number | null,
  priorities: string[],
  rooms: PlannerRoom[],
  weights: number[] = DEFAULT_WEIGHTS,
): AllocationLine[] {
  if (total === null || total <= 0 || rooms.length === 0) return []
  const label = (id: string) => rooms.find((r) => r.id === id)?.label ?? id
  const ordered = priorities.filter((id) => rooms.some((r) => r.id === id))
  const rest = rooms.filter((r) => !ordered.includes(r.id))
  const lines: { label: string; weight: number }[] = []
  const named = ordered.slice(0, Math.max(weights.length - 1, 0))
  named.forEach((id, i) => lines.push({ label: `${label(id)} · priorité ${i + 1}`, weight: weights[i] }))
  const others = [...ordered.slice(named.length).map(label), ...rest.map((r) => r.label)]
  if (others.length) {
    lines.push({ label: joinLabels(others), weight: weights.slice(named.length).reduce((a, b) => a + b, 0) })
  }
  const sum = lines.reduce((a, l) => a + l.weight, 0)
  let assigned = 0
  return lines.map((l, i) => {
    const percent = Math.round((l.weight / sum) * 100)
    const amount = i === lines.length - 1 ? Math.round(total) - assigned : Math.round((total * l.weight) / sum)
    assigned += amount
    return { label: l.label, percent, amount }
  })
}

export interface ValidationOptions {
  rooms: PlannerRoom[]
  presets: BudgetPreset[]
  min: number
  max: number
  minPriorities: number
  formatMoney: (n: number) => string
  /** Saisie brute du champ montant, pour distinguer « vide » et « invalide ». */
  rawAmount: string
}

/** Valide la valeur. Renvoie une liste vide si tout est correct. */
export function validate(value: BudgetPlannerValue, o: ValidationOptions): PlannerError[] {
  const errors: PlannerError[] = []
  if (o.rooms.length === 0) {
    errors.push({ field: 'rooms', message: 'Aucune pièce sélectionnée : revenez à l’étape « Mes pièces ».' })
  }
  const parsed = parseAmount(o.rawAmount)
  if (Number.isNaN(parsed)) {
    errors.push({ field: 'amount', message: 'Saisissez un montant en chiffres, par exemple 1 500.' })
  } else if (parsed !== null && (parsed < o.min || parsed > o.max)) {
    errors.push({ field: 'amount', message: `Indiquez un montant entre ${o.formatMoney(o.min)} et ${o.formatMoney(o.max)}.` })
  }
  const hasPreset = o.presets.some((p) => p.id === value.presetId)
  if (!hasPreset && (parsed === null || Number.isNaN(parsed))) {
    errors.push({ field: 'budget', message: 'Choisissez une tranche de budget ou indiquez un montant.' })
  }
  if (o.rooms.length > 0 && value.priorities.length < o.minPriorities) {
    errors.push({
      field: 'priorities',
      message: o.minPriorities === 1 ? 'Choisissez au moins une pièce prioritaire.' : `Choisissez au moins ${o.minPriorities} pièces prioritaires.`,
    })
  }
  return errors
}
