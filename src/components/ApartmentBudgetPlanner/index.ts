export { default as ApartmentBudgetPlanner } from './ApartmentBudgetPlanner.vue'
// Briques réutilisables, utilisables seules dans d'autres écrans
export { default as ChoiceCard } from './parts/ChoiceCard.vue'
export { default as PriorityBadge } from './parts/PriorityBadge.vue'
export { default as ProgressSteps } from './parts/ProgressSteps.vue'
export { default as BudgetSummary } from './parts/BudgetSummary.vue'
export type { SummaryRow } from './parts/BudgetSummary.vue'
export * from './types'
export { DEFAULT_PRESETS, DEFAULT_WEIGHTS, computeAllocation, joinLabels } from './budget-logic'
