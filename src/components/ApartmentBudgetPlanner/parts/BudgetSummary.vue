<script setup lang="ts">
/**
 * BudgetSummary — récapitulatif d'un projet : lignes « libellé / valeur / Modifier »,
 * répartition indicative du budget et « À l'étape suivante ».
 * Réutilisable : étape 4 « Ma sélection » (budget consommé / restant), panier d'un projet, liste de souhaits.
 */
import type { AllocationLine } from '../types'

export interface SummaryRow {
  label: string
  value: string
  /** Étape à rouvrir via « Modifier » (absent = pas de lien) */
  editStep?: number
}

withDefaults(
  defineProps<{
    titleId: string
    title?: string
    rows: SummaryRow[]
    allocation?: AllocationLine[]
    allocationTitle?: string
    allocationNote?: string
    emptyAllocationNote?: string
    nextSteps?: string[]
    formatMoney: (n: number) => string
  }>(),
  { title: 'Récapitulatif', allocationTitle: 'Répartition indicative', allocation: () => [], nextSteps: () => [] },
)
const emit = defineEmits<{ (e: 'edit-step', step: number): void }>()
</script>

<template>
  <div class="vu-summary">
    <h2 :id="titleId" class="vu-summary__title">{{ title }}</h2>
    <dl class="vu-summary__list">
      <div v-for="row in rows" :key="row.label" class="vu-summary__row">
        <dt>{{ row.label }}</dt>
        <dd>{{ row.value }}</dd>
        <button v-if="row.editStep" type="button" class="vu-summary__link" @click="emit('edit-step', row.editStep)">
          Modifier<span class="vu-sr"> : {{ row.label.toLowerCase() }}</span>
        </button>
      </div>
    </dl>

    <div v-if="allocation.length" class="vu-summary__block">
      <h3 class="vu-summary__sub">{{ allocationTitle }}</h3>
      <ul class="vu-summary__alloc">
        <li v-for="line in allocation" :key="line.label">
          <span class="vu-summary__alloc-row"><span>{{ line.label }}</span><strong>{{ formatMoney(line.amount) }}</strong></span>
          <span class="vu-summary__track" aria-hidden="true"><span class="vu-summary__fill" :style="{ width: `${line.percent}%` }" /></span>
        </li>
      </ul>
      <p v-if="allocationNote" class="vu-summary__caption">{{ allocationNote }}</p>
    </div>
    <p v-else-if="emptyAllocationNote" class="vu-summary__caption">{{ emptyAllocationNote }}</p>

    <div v-if="nextSteps.length" class="vu-summary__block">
      <h3 class="vu-summary__sub">À l’étape suivante</h3>
      <ol class="vu-summary__next">
        <li v-for="line in nextSteps" :key="line">{{ line }}</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.vu-summary { display: grid; gap: var(--spacing-large, 24px); font-family: var(--font-family-base, 'Poppins', sans-serif); font-size: 14px; line-height: 20px; color: var(--text-icon-neutral-hard, #130c0c); }
.vu-summary__title { margin: 0; font-size: 20px; line-height: 24px; font-weight: 600; }
.vu-summary__list { margin: 0; display: grid; gap: var(--spacing-medium, 16px); }
.vu-summary__row { display: grid; grid-template-columns: 1fr auto; column-gap: var(--spacing-small, 12px); }
.vu-summary__row dt { font-size: 12px; line-height: 16px; color: var(--text-icon-neutral-light, #1f14159c); }
.vu-summary__row dd { margin: 2px 0 0; font-weight: 500; grid-column: 1; }
.vu-summary__link { grid-column: 2; grid-row: 1; padding: 0; border: 0; background: none; font: 400 12px/16px var(--font-family-base, 'Poppins', sans-serif); color: var(--text-icon-neutral-medium, #170d0ecc); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; border-radius: 4px; }
.vu-summary__link:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--shadow-focus-focus, #fff), 0 0 0 4px var(--shadow-focus-default, #0072d6); }
.vu-summary__block { display: grid; gap: var(--spacing-small, 12px); padding-top: var(--spacing-large, 24px); border-top: 1px solid var(--surface-separator, #b8a8ab52); }
.vu-summary__sub { margin: 0; font-size: 14px; line-height: 20px; font-weight: 600; }
.vu-summary__alloc { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--spacing-small, 12px); }
.vu-summary__alloc li { display: grid; gap: var(--spacing-extra-extra-small, 4px); }
.vu-summary__alloc-row { display: flex; justify-content: space-between; gap: var(--spacing-extra-small, 8px); font-size: 12px; line-height: 16px; color: var(--text-icon-neutral-medium, #170d0ecc); }
.vu-summary__alloc-row strong { color: var(--text-icon-neutral-hard, #130c0c); font-weight: 500; white-space: nowrap; }
.vu-summary__track { height: 8px; border-radius: 999px; background: var(--stroke-neutral-hard, #b8a8ab52); overflow: hidden; }
.vu-summary__fill { display: block; height: 100%; border-radius: inherit; background: var(--interactive-primary-background-default, #130c0c); transition: width .3s ease; }
.vu-summary__caption { margin: 0; font-size: 12px; line-height: 16px; color: var(--text-icon-neutral-light, #1f14159c); }
.vu-summary__next { margin: 0; padding-left: 20px; display: grid; gap: var(--spacing-extra-extra-small, 4px); font-size: 12px; line-height: 16px; color: var(--text-icon-neutral-medium, #170d0ecc); }
.vu-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
@media (prefers-reduced-motion: reduce) { .vu-summary__fill { transition: none; } }
</style>
