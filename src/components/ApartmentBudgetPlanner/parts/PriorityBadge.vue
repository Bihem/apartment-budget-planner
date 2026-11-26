<script setup lang="ts">
/**
 * PriorityBadge — pastille de rang (« Priorité 1 »).
 * Brique réutilisable : rang d'une pièce, d'un produit dans une liste de souhaits, d'une étape.
 */
withDefaults(defineProps<{ rank: number; label?: string }>(), { label: 'Priorité' })
</script>

<template>
  <span class="vu-priority">{{ label }} {{ rank }}</span>
</template>

<style scoped>
.vu-priority {
  flex: none; padding: var(--spacing-extra-extra-small, 4px) var(--spacing-extra-small, 8px);
  border-radius: var(--radius-round, 999px);
  background: var(--text-icon-neutral-hard, #130c0c); color: var(--text-icon-neutral-on-dark, #fff);
  font-family: var(--font-family-base, 'Poppins', sans-serif); font-size: 12px; line-height: 16px; font-weight: 500;
  white-space: nowrap;
}
</style>
