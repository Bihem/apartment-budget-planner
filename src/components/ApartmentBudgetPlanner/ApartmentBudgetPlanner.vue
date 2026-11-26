<script setup lang="ts">
/**
 * ApartmentBudgetPlanner
 * Étape « Style, budget et priorités » du parcours « Mon premier chez-moi » (Vente-unique).
 * Autonome : reçoit tout par props, communique uniquement par événements, ne dépend d'aucune API.
 * Assemblage de quatre briques réutilisables : ProgressSteps, ChoiceCard, PriorityBadge, BudgetSummary.
 */
import { computed, nextTick, ref, watch } from 'vue'
import type {
  BudgetPlannerValue,
  BudgetPreset,
  PlannerContext,
  PlannerError,
  PlannerRoom,
  PlannerStep,
} from './types'
import {
  DEFAULT_PRESETS,
  DEFAULT_WEIGHTS,
  computeAllocation,
  parseAmount,
  presetForAmount,
  referenceAmount,
  togglePriority,
  validate,
} from './budget-logic'
import ChoiceCard from './parts/ChoiceCard.vue'
import PriorityBadge from './parts/PriorityBadge.vue'
import ProgressSteps from './parts/ProgressSteps.vue'
import BudgetSummary, { type SummaryRow } from './parts/BudgetSummary.vue'

const props = withDefaults(
  defineProps<{
    /** Valeur du v-model : tranche, montant exact, priorités ordonnées. */
    modelValue: BudgetPlannerValue
    /** Pièces choisies à l'étape précédente. Vide = état vide. */
    rooms: PlannerRoom[]
    /** Tranches de budget proposées. */
    presets?: BudgetPreset[]
    /** Bornes du montant exact (€). */
    minAmount?: number
    maxAmount?: number
    /** Nombre maximum et minimum de pièces prioritaires. */
    maxPriorities?: number
    minPriorities?: number
    /** Étapes du parcours et index (1-based) de l'étape affichée. */
    steps?: PlannerStep[]
    currentStep?: number
    /** Rappel des étapes précédentes (lecture seule). */
    context?: PlannerContext
    /** Répartition indicative : priorité 1, priorité 2, reste (en %). */
    allocationWeights?: number[]
    title?: string
    intro?: string
    submitLabel?: string
    previousLabel?: string
    /** Désactive les actions pendant un traitement du parent. */
    loading?: boolean
    locale?: string
    currency?: string
  }>(),
  {
    presets: () => DEFAULT_PRESETS,
    minAmount: 300,
    maxAmount: 10000,
    maxPriorities: 3,
    minPriorities: 1,
    steps: () => [
      { id: 'housing', label: 'Mon logement' },
      { id: 'rooms', label: 'Mes pièces' },
      { id: 'budget', label: 'Style & budget' },
      { id: 'selection', label: 'Ma sélection' },
    ],
    currentStep: 3,
    context: () => ({}),
    allocationWeights: () => DEFAULT_WEIGHTS,
    title: 'Votre budget et vos priorités',
    intro:
      'Indiquez ce que vous souhaitez dépenser au total et les pièces à équiper en premier. Nous préparerons une sélection adaptée : vous pourrez remplacer ou retirer chaque produit.',
    submitLabel: 'Voir ma sélection',
    previousLabel: 'Étape précédente',
    loading: false,
    locale: 'fr-FR',
    currency: 'EUR',
  },
)

const emit = defineEmits<{
  /** Chaque modification (tranche, montant, priorités). */
  (e: 'update:modelValue', value: BudgetPlannerValue): void
  /** Clic sur « Étape précédente ». */
  (e: 'previous'): void
  /** Clic sur une étape terminée ou un lien « Modifier » (index 1-based). */
  (e: 'edit-step', step: number): void
  /** Clic sur « Modifier » du style choisi. */
  (e: 'edit-style'): void
  /** Validation réussie : valeur finale + montant de référence. */
  (e: 'submit', payload: { value: BudgetPlannerValue; referenceAmount: number }): void
  /** Validation échouée. */
  (e: 'invalid', errors: PlannerError[]): void
}>()

const uid = `abp-${Math.random().toString(36).slice(2, 8)}`
const ids = {
  budget: `${uid}-budget`,
  amount: `${uid}-amount`,
  amountHelp: `${uid}-amount-help`,
  priorities: `${uid}-priorities`,
  prioritiesHelp: `${uid}-priorities-help`,
  summary: `${uid}-summary`,
}

/* ---------- formatage ---------- */
const moneyFmt = computed(
  () => new Intl.NumberFormat(props.locale, { style: 'currency', currency: props.currency, maximumFractionDigits: 0 }),
)
// U+202F (espace fine insécable) n'existe pas dans Poppins : remplacée par une espace insécable.
const money = (n: number) => moneyFmt.value.format(n).replace(/ /g, ' ')

/* ---------- état local ---------- */
const rawAmount = ref(props.modelValue.amount !== null ? String(props.modelValue.amount) : '')
const touched = ref({ amount: false })
const submitted = ref(false)
const announcement = ref('')

// Si le parent remplace la valeur (retour à l'étape, réinitialisation), on resynchronise le champ.
watch(
  () => props.modelValue.amount,
  (amount) => {
    const parsed = parseAmount(rawAmount.value)
    if (amount === null && parsed !== null && !Number.isNaN(parsed) && parsed >= props.minAmount && parsed <= props.maxAmount) rawAmount.value = ''
    if (amount !== null && parsed !== amount) rawAmount.value = String(amount)
  },
)

function update(patch: Partial<BudgetPlannerValue>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

/* ---------- budget ---------- */
function selectPreset(preset: BudgetPreset) {
  const amount = props.modelValue.amount
  const keepAmount = amount !== null && amount >= preset.min && (preset.max === null || amount < preset.max)
  if (!keepAmount) rawAmount.value = ''
  update({ presetId: preset.id, amount: keepAmount ? amount : null })
}

function onAmountInput(event: Event) {
  rawAmount.value = (event.target as HTMLInputElement).value
  const parsed = parseAmount(rawAmount.value)
  if (parsed === null) return update({ amount: null })
  if (Number.isNaN(parsed) || parsed < props.minAmount || parsed > props.maxAmount) return update({ amount: null })
  const preset = presetForAmount(parsed, props.presets)
  update({ amount: parsed, presetId: preset ? preset.id : props.modelValue.presetId })
}

/* ---------- priorités ---------- */
const limitReached = computed(() => props.modelValue.priorities.length >= props.maxPriorities)
const rank = (roomId: string) => props.modelValue.priorities.indexOf(roomId) + 1

function onToggleRoom(room: PlannerRoom) {
  const next = togglePriority(props.modelValue.priorities, room.id, props.maxPriorities)
  update({ priorities: next })
  const added = next.includes(room.id)
  announcement.value = added
    ? `${room.label} ajouté en priorité ${next.indexOf(room.id) + 1}.`
    : `${room.label} retiré des priorités.`
  if (next.length >= props.maxPriorities) announcement.value += ` Limite de ${props.maxPriorities} priorités atteinte.`
}

/* ---------- validation ---------- */
const errors = computed(() =>
  validate(props.modelValue, {
    rooms: props.rooms,
    presets: props.presets,
    min: props.minAmount,
    max: props.maxAmount,
    minPriorities: props.minPriorities,
    formatMoney: money,
    rawAmount: rawAmount.value,
  }),
)
const errorFor = (field: PlannerError['field']) => {
  const visible = submitted.value || (field === 'amount' && touched.value.amount)
  return visible ? errors.value.find((e) => e.field === field)?.message ?? null : null
}
const canSubmit = computed(() => !props.loading && props.rooms.length > 0)
const hasBudget = computed(() => referenceAmount(props.modelValue, props.presets) !== null)
/** Bouton principal présenté comme indisponible tant que l'étape est incomplète.
 *  Il reste focusable et cliquable (aria-disabled) : un clic affiche les erreurs et place le focus. */
const ctaHelp = computed(() => {
  if (!hasBudget.value) return 'Choisissez un budget pour continuer.'
  if (errors.value.some((e) => e.field === 'priorities')) return 'Cochez au moins une pièce pour continuer.'
  if (errors.value.length) return 'Corrigez le montant pour continuer.'
  return null
})

async function onSubmit() {
  submitted.value = true
  if (errors.value.length) {
    emit('invalid', errors.value)
    announcement.value = `${errors.value.length} information${errors.value.length > 1 ? 's' : ''} à compléter.`
    await nextTick()
    const first = errors.value[0].field
    const target =
      first === 'amount'
        ? document.getElementById(ids.amount)
        : first === 'budget'
          ? (document.querySelector(`#${ids.budget} input`) as HTMLElement | null)
          : (document.querySelector(`#${ids.priorities} input:not(:disabled)`) as HTMLElement | null)
    target?.focus()
    return
  }
  emit('submit', { value: props.modelValue, referenceAmount: referenceAmount(props.modelValue, props.presets) as number })
}

/* ---------- récapitulatif ---------- */
const budgetLabel = computed(() => {
  if (props.modelValue.amount !== null) return money(props.modelValue.amount)
  return props.presets.find((p) => p.id === props.modelValue.presetId)?.label ?? 'À définir'
})
const allocation = computed(() =>
  computeAllocation(
    referenceAmount(props.modelValue, props.presets),
    props.modelValue.priorities,
    props.rooms,
    props.allocationWeights,
  ),
)
const roomsLabel = computed(() => (props.rooms.length ? props.rooms.map((r) => r.label).join(', ') : 'Aucune'))
const nextSelectionLine = computed(() => {
  const names = props.modelValue.priorities
    .map((id) => props.rooms.find((r) => r.id === id)?.label)
    .filter(Boolean) as string[]
  if (!names.length) return 'Une sélection de produits pour chaque pièce.'
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`
  return `Une sélection de produits par pièce, ${list.toLowerCase()} en premier.`
})
const summaryRows = computed<SummaryRow[]>(() => [
  { label: 'Logement', value: props.context.housing ?? 'À définir', editStep: 1 },
  { label: 'Pièces à meubler', value: roomsLabel.value, editStep: 2 },
  ...(props.context.style ? [{ label: 'Style', value: props.context.style }] : []),
  { label: 'Budget', value: budgetLabel.value },
])
const nextSteps = computed(() => [
  nextSelectionLine.value,
  'Le budget consommé et restant, mis à jour à chaque ajout.',
  'Chaque produit remplaçable ou supprimable.',
])
const mobileSummaryOpen = ref(false)
</script>

<template>
  <div class="abp">
    <ProgressSteps
      class="abp-steps"
      :steps="steps"
      :current-step="currentStep"
      :back-label="steps[currentStep - 2]?.label ?? previousLabel"
      :back-disabled="loading"
      @edit-step="(n) => emit('edit-step', n)"
      @back="emit('previous')"
    />

    <div class="abp-layout">
      <div class="abp-main">
        <header class="abp-intro">
          <h1 class="abp-title">{{ title }}</h1>
          <p class="abp-text">{{ intro }}</p>
        </header>

        <div v-if="context.style" class="abp-recall">
          <span>
            <span class="abp-caption">Style choisi</span>
            <span class="abp-strong">{{ context.style }}</span>
          </span>
          <button type="button" class="abp-link" @click="emit('edit-style')">
            Modifier<span class="abp-sr"> le style</span>
          </button>
        </div>

        <!-- 1. Budget -->
        <fieldset :id="ids.budget" class="abp-section" :aria-describedby="errorFor('budget') ? `${ids.budget}-err` : undefined">
          <legend class="abp-section__title">1. Votre budget mobilier global</legend>
          <p class="abp-help">Montant total pour l’ensemble du logement, hors frais de livraison.</p>

          <div v-if="presets.length" class="abp-grid" role="radiogroup" aria-label="Tranches de budget">
            <ChoiceCard
              v-for="preset in presets"
              :key="preset.id"
              type="radio"
              :name="`${uid}-preset`"
              :value="preset.id"
              :checked="modelValue.presetId === preset.id"
              :disabled="loading"
              :title="preset.label"
              :subtitle="preset.description"
              @change="selectPreset(preset)"
            />
          </div>

          <div class="abp-field">
            <label :for="ids.amount" class="abp-field__label">
              {{ presets.length ? 'Ou indiquez un montant exact (facultatif)' : 'Montant de votre budget' }}
            </label>
            <div class="abp-field__box" :class="{ 'is-error': errorFor('amount') }">
              <input
                :id="ids.amount"
                class="abp-field__input"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                :value="rawAmount"
                :disabled="loading"
                :aria-invalid="!!errorFor('amount')"
                :aria-describedby="ids.amountHelp"
                placeholder="Ex. : 1 500"
                @input="onAmountInput"
                @blur="touched.amount = true"
              />
              <span class="abp-field__suffix" aria-hidden="true">€</span>
            </div>
            <p :id="ids.amountHelp" class="abp-field__help" :class="{ 'is-error': errorFor('amount') }">
              {{ errorFor('amount') ?? `Entre ${money(minAmount)} et ${money(maxAmount)}. La tranche correspondante est sélectionnée automatiquement.` }}
            </p>
          </div>
          <p v-if="errorFor('budget')" :id="`${ids.budget}-err`" class="abp-error">{{ errorFor('budget') }}</p>
        </fieldset>

        <!-- 2. Priorités -->
        <fieldset :id="ids.priorities" class="abp-section" :aria-describedby="ids.prioritiesHelp">
          <legend class="abp-section__title">2. Vos pièces prioritaires</legend>
          <div class="abp-section__meta">
            <p :id="ids.prioritiesHelp" class="abp-help">
              Cochez jusqu’à {{ maxPriorities }} pièces : la première cochée devient la priorité 1. Les autres pièces restent dans votre sélection.
            </p>
            <span class="abp-chip">Plusieurs choix possibles</span>
            <span class="abp-counter" :class="{ 'is-full': limitReached }">
              {{ modelValue.priorities.length }} sur {{ maxPriorities }} sélectionnée{{ modelValue.priorities.length > 1 ? 's' : '' }}
            </span>
          </div>

          <div v-if="rooms.length" class="abp-grid">
            <ChoiceCard
              v-for="room in rooms"
              :key="room.id"
              type="checkbox"
              :value="room.id"
              :checked="rank(room.id) > 0"
              :disabled="loading || (limitReached && rank(room.id) === 0)"
              :title="room.label"
              :subtitle="room.description"
              @change="onToggleRoom(room)"
            >
              <template #aside>
                <PriorityBadge v-if="rank(room.id) > 0" :rank="rank(room.id)" />
              </template>
            </ChoiceCard>
          </div>

          <!-- État vide -->
          <div v-else class="abp-empty">
            <p class="abp-strong">Aucune pièce sélectionnée</p>
            <p class="abp-help">Choisissez d’abord les pièces à meubler pour définir vos priorités.</p>
            <button type="button" class="abp-btn abp-btn--secondary" @click="emit('edit-step', 2)">Choisir mes pièces</button>
          </div>

          <p v-if="limitReached" class="abp-notice" role="note">
            Vous avez choisi {{ maxPriorities }} priorités. Décochez une pièce pour en choisir une autre.
          </p>
          <p v-if="errorFor('priorities')" class="abp-error">{{ errorFor('priorities') }}</p>
        </fieldset>
      </div>

      <!-- Récapitulatif -->
      <aside class="abp-summary" :class="{ 'is-open': mobileSummaryOpen }" :aria-labelledby="ids.summary">
        <BudgetSummary
          class="abp-summary__panel"
          :title-id="ids.summary"
          :rows="summaryRows"
          :allocation="allocation"
          :allocation-note="`Calculée selon vos priorités (${allocationWeights.join(' / ')} %). Vous l’ajusterez à l’étape suivante.`"
          empty-allocation-note="Choisissez un budget pour voir la répartition indicative."
          :next-steps="nextSteps"
          :format-money="money"
          @edit-step="(n) => emit('edit-step', n)"
        />

        <!-- Barre fixe (mobile) -->
        <div class="abp-summary__bar">
          <span class="abp-strong">Budget {{ budgetLabel }} · {{ modelValue.priorities.length }} priorité{{ modelValue.priorities.length > 1 ? 's' : '' }}</span>
          <button
            type="button"
            class="abp-link"
            :aria-expanded="mobileSummaryOpen"
            :aria-controls="ids.summary"
            @click="mobileSummaryOpen = !mobileSummaryOpen"
          >
            {{ mobileSummaryOpen ? 'Masquer' : 'Récapitulatif' }}
          </button>
        </div>

        <div class="abp-actions">
          <button
            type="button"
            class="abp-btn abp-btn--primary"
            :class="{ 'is-unavailable': !!ctaHelp }"
            :disabled="!canSubmit"
            :aria-disabled="ctaHelp ? 'true' : undefined"
            :aria-describedby="ctaHelp ? `${uid}-cta-help` : undefined"
            @click="onSubmit"
          >
            <span v-if="loading" class="abp-spinner" aria-hidden="true" />
            {{ submitLabel }}
          </button>
          <p v-if="ctaHelp" :id="`${uid}-cta-help`" class="abp-caption abp-actions__help">{{ ctaHelp }}</p>
          <button type="button" class="abp-btn abp-btn--secondary" :disabled="loading" @click="emit('previous')">
            {{ previousLabel }}
          </button>
        </div>
        <!-- Contenu libre sous les actions (ex. réassurance du site) -->
        <div v-if="$slots['summary-footer']" class="abp-summary__footer"><slot name="summary-footer" /></div>
      </aside>
    </div>

    <p class="abp-sr" aria-live="polite">{{ announcement }}</p>
  </div>
</template>
<style scoped>
/*
 * Mise en page de l'étape. Les briques (ChoiceCard, PriorityBadge, ProgressSteps, BudgetSummary)
 * portent leurs propres styles. Toutes les valeurs passent par les variables CSS de vente-unique.com
 * (noms identiques), avec en repli la valeur relevée le 25/11/2026.
 */
.abp {
  font-family: var(--font-family-base, 'Poppins', 'Poppins Fallback', system-ui, sans-serif);
  color: var(--text-icon-neutral-hard, #130c0c);
  font-size: 14px;
  line-height: 20px;
}
.abp *, .abp *::before, .abp *::after { box-sizing: border-box; }
.abp-steps { margin-bottom: var(--spacing-extra-large, 32px); }

.abp-layout { display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: var(--spacing-extra-extra-large, 64px); align-items: start; }
.abp-main { display: grid; gap: var(--spacing-extra-large, 32px); min-width: 0; }
.abp-title { margin: 0 0 var(--spacing-small, 12px); font-family: var(--font-family-heading, 'Recoleta', 'Poppins', system-ui, sans-serif); font-weight: 600; font-size: 40px; line-height: 48px; }
.abp-text { margin: 0; max-width: 720px; font-size: 16px; line-height: 24px; color: var(--text-icon-neutral-medium, #170d0ecc); }
.abp-recall { display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-small, 12px); padding: var(--spacing-small, 12px) var(--spacing-medium, 16px); border-radius: var(--radius-small, 14px); background: var(--surface-neutral, #c5b9bb24); }
.abp-recall > span { display: grid; gap: 2px; }

.abp-section { border: 0; margin: 0; padding: 0; min-width: 0; display: grid; gap: var(--spacing-medium, 16px); }
.abp-section__title { float: left; width: 100%; padding: 0; font-size: 24px; line-height: 32px; font-weight: 600; }
.abp-section__title + * { clear: both; }
.abp-help { margin: 0; color: var(--text-icon-neutral-light, #1f14159c); }
.abp-section > .abp-help:first-of-type, .abp-section__meta { margin-top: calc(var(--spacing-medium, 16px) * -1 + 4px); }
.abp-section__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--spacing-extra-small, 8px) var(--spacing-small, 12px); }
.abp-section__meta .abp-help { flex: 1 1 100%; }
.abp-chip { padding: var(--spacing-extra-extra-small, 4px) var(--spacing-small, 12px); border-radius: 999px; background: var(--surface-neutral, #c5b9bb24); color: var(--text-icon-neutral-medium, #170d0ecc); font-size: 12px; line-height: 16px; font-weight: 500; }
.abp-counter { font-size: 12px; line-height: 16px; font-weight: 500; }
.abp-counter.is-full { color: var(--text-icon-attention-medium, #bd4800); }
.abp-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--spacing-medium, 16px); }

/* Champ (.input du site) */
.abp-field { display: grid; gap: var(--spacing-extra-small, 8px); max-width: 408px; }
.abp-field__label { font-weight: 500; }
.abp-field__box { display: flex; align-items: center; gap: var(--spacing-extra-small, 8px); height: 48px; padding: 0 var(--spacing-small, 12px); border: 1px solid var(--interactive-input-stroke-default, #1f14159c); border-radius: var(--radius-small, 14px); background: var(--interactive-input-background-default, #c5b9bb24); }
.abp-field__box:focus-within { background: var(--interactive-input-background-active, #fff); border: 2px solid var(--interactive-secondary-stroke-active, #170d0ecc); padding: 0 11px; box-shadow: 0 0 0 2px var(--shadow-focus-focus, #fff), 0 0 0 4px var(--shadow-focus-default, #0072d6); }
.abp-field__box.is-error { border: 2px solid var(--text-icon-negative-light, #e5002d); padding: 0 11px; }
.abp-field__input { flex: 1; min-width: 0; border: 0; background: transparent; font: inherit; color: inherit; outline: none; }
.abp-field__suffix { color: var(--text-icon-neutral-light, #1f14159c); font-weight: 500; }
.abp-field__help { margin: 0; font-size: 12px; line-height: 16px; color: var(--text-icon-neutral-light, #1f14159c); }
.abp-field__help.is-error, .abp-error { color: var(--text-icon-negative-light, #e5002d); }
.abp-error { margin: 0; font-size: 12px; line-height: 16px; }
.abp-error::before, .abp-field__help.is-error::before { content: '⚠ '; }
.abp-notice { margin: 0; padding: var(--spacing-extra-small, 8px) var(--spacing-small, 12px); border-radius: var(--radius-small, 14px); background: var(--surface-attention, #fff1eb); color: var(--text-icon-attention-medium, #bd4800); font-size: 12px; line-height: 16px; }
.abp-empty { display: grid; gap: var(--spacing-extra-small, 8px); justify-items: start; padding: var(--spacing-large, 24px); border: 1px dashed var(--stroke-neutral-hard, #b8a8ab52); border-radius: var(--radius-small, 14px); }

/* Récapitulatif (conteneur sticky) */
.abp-summary { position: sticky; top: var(--var-sticky-offset, 24px); display: grid; gap: var(--spacing-large, 24px); padding: var(--spacing-large, 24px); border-radius: var(--radius-medium, 20px); background: var(--surface-neutral, #c5b9bb24); }
.abp-summary__bar { display: none; }

/* Boutons (.button-container primary / secondary du site) */
.abp-actions { display: grid; gap: var(--spacing-small, 12px); }
.abp-summary__footer { margin-top: var(--spacing-large, 24px); }
.abp-actions__help { margin: -8px 0 0; text-align: center; }
.abp-btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--spacing-extra-small, 8px); min-height: 48px; padding: var(--spacing-small, 12px) var(--spacing-large, 24px); border-radius: var(--radius-large, 28px); font: 500 14px/20px var(--font-family-base, 'Poppins', sans-serif); cursor: pointer; transition: background .15s ease, border-color .15s ease; }
.abp-btn--primary { border: 0; background: var(--interactive-primary-background-default, #130c0c); color: var(--text-icon-neutral-on-dark, #fff); }
.abp-btn--primary:hover:not(:disabled):not(.is-unavailable) { background: var(--interactive-primary-background-rollover, #170d0ecc); }
.abp-btn--primary:disabled, .abp-btn--primary.is-unavailable { background: var(--interactive-primary-background-disabled, #56434580); cursor: not-allowed; }
.abp-btn--secondary { border: 1px solid var(--interactive-secondary-stroke-default, #56434580); background: var(--surface-background, #fff); color: var(--interactive-text-icon-background-default, #170d0ecc); }
.abp-btn--secondary:hover:not(:disabled) { border-color: var(--interactive-secondary-stroke-rollover, #170d0ecc); color: var(--interactive-text-icon-background-rollover, #130c0c); }
.abp-btn--secondary:disabled { border-color: var(--interactive-secondary-stroke-disabled, #b8a8ab52); color: var(--interactive-text-icon-background-disabled, #56434580); cursor: not-allowed; }
.abp-btn:focus-visible, .abp-link:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--shadow-focus-focus, #fff), 0 0 0 4px var(--shadow-focus-default, #0072d6); }
.abp-link { padding: 0; border: 0; background: none; font: inherit; font-weight: 500; color: var(--text-icon-neutral-medium, #170d0ecc); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; border-radius: 4px; }
.abp-caption { display: block; font-size: 12px; line-height: 16px; color: var(--text-icon-neutral-light, #1f14159c); }
.abp-strong { display: block; font-weight: 500; }
.abp-spinner { width: 14px; height: 14px; border: 2px solid #ffffff66; border-top-color: #fff; border-radius: 50%; animation: abp-spin .8s linear infinite; }
@keyframes abp-spin { to { transform: rotate(360deg); } }
.abp-sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

/* < 992 px : une colonne (comme le header du site) */
@media (max-width: 991.98px) {
  .abp-layout { grid-template-columns: minmax(0, 1fr); gap: var(--spacing-extra-large, 32px); }
  .abp-summary { position: static; }
}
/* < 768 px : mobile, récapitulatif replié dans une barre fixe */
@media (max-width: 767.98px) {
  .abp-title { font-family: var(--font-family-base, 'Poppins', sans-serif); font-weight: 600; font-size: 24px; line-height: 32px; }
  .abp-section__title { font-size: 20px; line-height: 24px; }
  .abp-grid { grid-template-columns: minmax(0, 1fr); gap: var(--spacing-small, 12px); }
  .abp-field { max-width: none; }
  .abp-steps { margin-bottom: var(--spacing-large, 24px); }
  .abp-summary { position: sticky; bottom: 0; top: auto; margin: 0 -16px; padding: var(--spacing-small, 12px) var(--spacing-medium, 16px) var(--spacing-medium, 16px); border-radius: var(--radius-medium, 20px) var(--radius-medium, 20px) 0 0; background: var(--surface-background, #fff); box-shadow: 0 -4px 12px var(--shadow-neutral, #c5b9bb24), 0 -1px 0 var(--stroke-neutral-hard, #b8a8ab52); gap: var(--spacing-small, 12px); }
  .abp-summary__panel { display: none; }
  .abp-summary.is-open .abp-summary__panel { display: grid; max-height: 60vh; overflow: auto; }
  .abp-summary__bar { display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-small, 12px); }
  .abp-actions .abp-btn--secondary { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .abp-btn { transition: none; }
  .abp-spinner { animation-duration: 2s; }
}
@media (max-width: 767.98px) { .abp-summary__footer { display: none; } }
</style>
