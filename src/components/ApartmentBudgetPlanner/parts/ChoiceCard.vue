<script setup lang="ts">
/**
 * ChoiceCard — choix encadré (équivalent du `.toggle-choice.with-stroke` de vente-unique.com).
 * Brique réutilisable : tranche de budget (radio), pièce prioritaire (checkbox),
 * mode de livraison, option de service… Un vrai <input> natif est rendu : clavier et lecteurs d'écran natifs.
 */
defineProps<{
  /** `radio` = choix unique, `checkbox` = choix multiple */
  type: 'radio' | 'checkbox'
  /** Nom du groupe (obligatoire pour les radios) */
  name?: string
  value: string
  checked: boolean
  disabled?: boolean
  title: string
  subtitle?: string
}>()

const emit = defineEmits<{ (e: 'change', value: string): void }>()
</script>

<template>
  <label class="vu-choice" :class="{ 'is-selected': checked, 'is-disabled': disabled }">
    <input
      class="vu-choice__input"
      :class="type === 'radio' ? 'vu-choice__radio' : 'vu-choice__checkbox'"
      :type="type"
      :name="name"
      :value="value"
      :checked="checked"
      :disabled="disabled"
      @change="emit('change', value)"
    />
    <span class="vu-choice__content">
      <span class="vu-choice__title">{{ title }}</span>
      <span v-if="subtitle" class="vu-choice__subtitle">{{ subtitle }}</span>
    </span>
    <!-- Emplacement à droite : badge de priorité, prix, délai… -->
    <slot name="aside" />
  </label>
</template>

<style scoped>
.vu-choice {
  position: relative; display: flex; align-items: center; gap: var(--spacing-small, 12px);
  min-height: 62px; padding: var(--spacing-small, 12px);
  border: 1px solid var(--stroke-neutral-hard, #b8a8ab52); border-radius: var(--radius-small, 14px);
  background: var(--surface-background, #fff); cursor: pointer; transition: border-color .2s ease;
  font-family: var(--font-family-base, 'Poppins', sans-serif); font-size: 14px; line-height: 20px;
}
.vu-choice:hover:not(.is-disabled) { border-color: var(--interactive-secondary-stroke-rollover, #170d0ecc); }
.vu-choice:hover:not(.is-disabled) .vu-choice__title { color: var(--interactive-text-icon-background-rollover, #130c0c); }
.vu-choice.is-selected { border: 2px solid var(--interactive-secondary-stroke-active, #170d0ecc); padding: calc(var(--spacing-small, 12px) - 1px); }
.vu-choice.is-selected .vu-choice__title { color: var(--text-icon-neutral-hard, #130c0c); font-weight: 500; }
.vu-choice:has(.vu-choice__input:focus-visible) { box-shadow: 0 0 0 2px var(--shadow-focus-focus, #fff), 0 0 0 4px var(--shadow-focus-default, #0072d6); }
.vu-choice.is-disabled { opacity: .5; cursor: not-allowed; }
.vu-choice__content { flex: 1; display: grid; gap: 2px; min-width: 0; }
.vu-choice__title { color: var(--interactive-text-icon-background-default, #170d0ecc); }
.vu-choice__subtitle { font-size: 12px; line-height: 16px; color: var(--text-icon-neutral-light, #1f14159c); }
.vu-choice__input { appearance: none; flex: none; width: 20px; height: 20px; margin: 0; background: var(--surface-background, #fff); cursor: inherit; }
.vu-choice__input:focus-visible { outline: none; }
.vu-choice__radio { border: 1px solid var(--text-icon-neutral-medium, #170d0ecc); border-radius: 999px; }
.vu-choice__radio:checked { border: 2px solid var(--text-icon-neutral-hard, #130c0c); background: radial-gradient(circle, var(--text-icon-neutral-hard, #130c0c) 0 4.5px, transparent 5px); }
.vu-choice__checkbox { border: 1px solid var(--text-icon-neutral-light, #1f14159c); border-radius: 6px; }
.vu-choice__checkbox:checked { border-color: var(--text-icon-neutral-hard, #130c0c); background: var(--text-icon-neutral-hard, #130c0c) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M5 12.5l4.5 4.5L19 7.5' fill='none' stroke='%23fff' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center / 16px no-repeat; }
@media (prefers-reduced-motion: reduce) { .vu-choice { transition: none; } }
</style>
