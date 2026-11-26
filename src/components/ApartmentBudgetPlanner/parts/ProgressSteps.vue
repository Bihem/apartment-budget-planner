<script setup lang="ts">
/**
 * ProgressSteps — indicateur d'étapes d'un parcours.
 * Nouveau sur vente-unique.com (aucun équivalent observé) : construit uniquement avec les tokens du site.
 * Réutilisable pour tout tunnel (parcours guidé, configurateur, tunnel de commande).
 */
import type { PlannerStep } from '../types'

const props = defineProps<{ steps: PlannerStep[]; currentStep: number; backLabel?: string; backDisabled?: boolean }>()
const emit = defineEmits<{ (e: 'edit-step', step: number): void; (e: 'back'): void }>()
const status = (i: number) => (i + 1 < props.currentStep ? 'done' : i + 1 === props.currentStep ? 'current' : 'upcoming')
</script>

<template>
  <nav class="vu-steps" aria-label="Étapes du parcours">
    <ol class="vu-steps__list">
      <li v-for="(step, i) in steps" :key="step.id" class="vu-step" :class="`is-${status(i)}`">
        <button
          v-if="status(i) === 'done'"
          type="button"
          class="vu-step__body"
          :aria-label="`${step.label}, étape ${i + 1} terminée. Modifier`"
          @click="emit('edit-step', i + 1)"
        >
          <span class="vu-step__dot" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
          <span class="vu-step__label">{{ step.label }}</span>
        </button>
        <span v-else class="vu-step__body" :aria-current="status(i) === 'current' ? 'step' : undefined">
          <span class="vu-step__dot" aria-hidden="true">{{ i + 1 }}</span>
          <span class="vu-step__label">{{ step.label }}</span>
        </span>
      </li>
    </ol>
    <div class="vu-steps__compact">
      <button v-if="backLabel" type="button" class="vu-steps__back" :disabled="backDisabled" @click="emit('back')">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>{{ backLabel }}
      </button>
      <span aria-hidden="true">Étape {{ currentStep }} sur {{ steps.length }}</span>
    </div>
  </nav>
</template>

<style scoped>
.vu-steps { font-family: var(--font-family-base, 'Poppins', sans-serif); font-size: 14px; line-height: 20px; color: var(--text-icon-neutral-hard, #130c0c); }
.vu-steps__list { display: flex; align-items: center; gap: var(--spacing-medium, 16px); list-style: none; margin: 0; padding: 0; }
.vu-step { display: flex; align-items: center; gap: var(--spacing-medium, 16px); flex: 1; }
.vu-step:last-child { flex: none; }
.vu-step:not(:last-child)::after { content: ''; flex: 1; height: 2px; border-radius: 999px; background: var(--stroke-neutral-hard, #b8a8ab52); }
.vu-step.is-done:not(:last-child)::after { background: var(--interactive-primary-background-default, #130c0c); }
.vu-step__body { display: inline-flex; align-items: center; gap: var(--spacing-extra-small, 8px); padding: 0; border: 0; background: none; font: inherit; color: var(--text-icon-neutral-medium, #170d0ecc); white-space: nowrap; }
button.vu-step__body { cursor: pointer; border-radius: var(--radius-large, 28px); }
button.vu-step__body:hover .vu-step__label { text-decoration: underline; }
button.vu-step__body:focus-visible, .vu-steps__back:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--shadow-focus-focus, #fff), 0 0 0 4px var(--shadow-focus-default, #0072d6); }
.vu-step__dot { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 999px; font-weight: 500; }
.is-done .vu-step__dot, .is-current .vu-step__dot { background: var(--interactive-primary-background-default, #130c0c); color: #fff; }
.vu-step__dot svg { fill: none; stroke: #fff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.is-current .vu-step__label { color: var(--text-icon-neutral-hard, #130c0c); font-weight: 600; }
.is-upcoming .vu-step__dot { border: 1px solid var(--stroke-neutral-hard, #b8a8ab52); color: var(--text-icon-neutral-light, #1f14159c); }
.is-upcoming .vu-step__label { color: var(--text-icon-neutral-light, #1f14159c); }
.vu-steps__compact { display: none; }

@media (max-width: 991.98px) {
  .vu-step__label { display: none; }
  .is-current .vu-step__label { display: inline; }
}
@media (max-width: 767.98px) {
  .vu-steps__list { gap: var(--spacing-extra-extra-small, 4px); }
  .vu-step { gap: var(--spacing-extra-extra-small, 4px); }
  .vu-step:last-child { flex: 1; }
  .vu-step__body { display: none; }
  .vu-step::after { content: ''; display: block; flex: 1; height: 4px; border-radius: 999px; background: var(--stroke-neutral-hard, #b8a8ab52); }
  .vu-step.is-done::after, .vu-step.is-current::after { background: var(--interactive-primary-background-default, #130c0c) !important; }
  .vu-steps__compact { display: flex; justify-content: space-between; align-items: center; margin-top: var(--spacing-extra-small, 8px); font-size: 12px; line-height: 16px; color: var(--text-icon-neutral-light, #1f14159c); }
  .vu-steps__back { display: inline-flex; align-items: center; gap: var(--spacing-extra-extra-small, 4px); min-height: 44px; padding: 0; border: 0; background: none; font: 500 14px/20px var(--font-family-base, 'Poppins', sans-serif); color: var(--text-icon-neutral-medium, #170d0ecc); cursor: pointer; border-radius: 4px; }
  .vu-steps__back svg { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
}
</style>
