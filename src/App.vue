<script setup lang="ts">
/**
 * Démo du parcours « Mon premier chez-moi » : le parent garde l'état des 4 étapes,
 * ApartmentBudgetPlanner gère l'étape 3. Revenir en arrière ne perd aucune donnée.
 */
import { computed, reactive, ref } from 'vue'
import {
  ApartmentBudgetPlanner,
  BudgetSummary,
  PriorityBadge,
  ProgressSteps,
  type BudgetPlannerValue,
  type PlannerError,
} from './components/ApartmentBudgetPlanner'
import { ALL_ROOMS, DEMO_PRODUCTS, HOUSING_TYPES, STYLES } from './demo/demo-data'

const STEPS = [
  { id: 'housing', label: 'Mon logement' },
  { id: 'rooms', label: 'Mes pièces' },
  { id: 'budget', label: 'Style & budget' },
  { id: 'selection', label: 'Ma sélection' },
]

const step = ref(3)
const housing = reactive({ type: 'studio', surface: 32, rooms: 1 })
const selectedRooms = ref<string[]>(['salon', 'chambre', 'bureau', 'cuisine'])
const style = ref('Contemporain')
const editingStyle = ref(false)
const planner = ref<BudgetPlannerValue>({ presetId: null, amount: null, priorities: [] })
const result = ref<{ value: BudgetPlannerValue; referenceAmount: number } | null>(null)
const lastErrors = ref<PlannerError[]>([])
const loading = ref(false)

const rooms = computed(() => ALL_ROOMS.filter((r) => selectedRooms.value.includes(r.id)))
const housingLabel = computed(
  () => `${HOUSING_TYPES.find((h) => h.id === housing.type)?.label} · ${housing.surface} m²`,
)
const housingValid = computed(() => housing.surface >= 9 && housing.surface <= 300 && housing.rooms >= 1)

// Si une pièce est retirée à l'étape 2, on la retire aussi des priorités.
function setRooms(ids: string[]) {
  selectedRooms.value = ids
  planner.value = { ...planner.value, priorities: planner.value.priorities.filter((id) => ids.includes(id)) }
}
function toggleRoom(id: string) {
  setRooms(selectedRooms.value.includes(id) ? selectedRooms.value.filter((r) => r !== id) : [...selectedRooms.value, id])
}

function onSubmit(payload: { value: BudgetPlannerValue; referenceAmount: number }) {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    result.value = payload
    removed.value = []
    step.value = 4
  }, 600)
}
const nbsp = (t: string) => t.replace(/[\u202f ]/g, '\u00a0')
const money = (n: number) => nbsp(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n))
const price = (n: number) => nbsp(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n))

/* ---------- Étape 4 : sélection de démonstration ---------- */
const removed = ref<string[]>([])
const announce = ref('')
const products = computed(() => DEMO_PRODUCTS.filter((p) => !removed.value.includes(p.id)))
// Pièces dans l'ordre des priorités, puis les autres pièces choisies à l'étape 2
const orderedRooms = computed(() => {
  const prio = planner.value.priorities
  const r = (id: string) => (prio.includes(id) ? prio.indexOf(id) : 99)
  return [...rooms.value].sort((a, b) => r(a.id) - r(b.id))
})
const productsFor = (roomId: string) => products.value.filter((p) => p.room === roomId)
const rankOf = (roomId: string) => planner.value.priorities.indexOf(roomId) + 1
const roomTotal = (roomId: string) => productsFor(roomId).reduce((s, p) => s + p.price, 0)
const total = computed(() => orderedRooms.value.reduce((sum, r) => sum + roomTotal(r.id), 0))
const count = computed(() => orderedRooms.value.reduce((n, r) => n + productsFor(r.id).length, 0))
const budget = computed(() => result.value?.referenceAmount ?? 0)
const remaining = computed(() => budget.value - total.value)
const consumption = computed(() =>
  orderedRooms.value
    .map((r) => ({
      label: rankOf(r.id) ? `${r.label} · priorité ${rankOf(r.id)}` : r.label,
      amount: Math.round(roomTotal(r.id)),
      percent: budget.value ? Math.min(100, (roomTotal(r.id) / budget.value) * 100) : 0,
    }))
    .filter((l) => l.amount > 0),
)
function removeProduct(id: string, name: string) {
  removed.value = [...removed.value, id]
  announce.value = `${name} retiré de la sélection. Total : ${price(total.value)}.`
}
function restore() {
  removed.value = []
  announce.value = 'Sélection d’origine rétablie.'
}
const summaryRows = computed(() => [
  { label: 'Budget', value: money(budget.value), editStep: 3 },
  { label: 'Sélection', value: `${count.value} produit${count.value > 1 ? 's' : ''} · ${price(total.value)}` },
])
</script>

<template>
  <div class="demo">
    <p class="demo__banner" role="note">
      Démo du composant <code>ApartmentBudgetPlanner</code> · données de démonstration, sans connexion au catalogue Vente-unique.
    </p>

    <main class="demo__page">
      <!-- Étape 1 -->
      <ProgressSteps
        v-if="step !== 3"
        class="demo__progress"
        :steps="STEPS"
        :current-step="step"
        :back-label="step > 1 ? STEPS[step - 2].label : undefined"
        @edit-step="(n) => (step = n)"
        @back="step = step - 1"
      />
      <section v-if="step === 1" class="demo__step" aria-labelledby="s1">
        <h1 id="s1" class="demo__title">Votre logement</h1>
        <p class="demo__text">Quelques informations pour vous proposer des meubles aux bonnes dimensions.</p>
        <fieldset class="demo__fieldset">
          <legend>Type de logement</legend>
          <div class="demo__chips">
            <label v-for="h in HOUSING_TYPES" :key="h.id" class="demo__chip" :class="{ on: housing.type === h.id }">
              <input v-model="housing.type" type="radio" name="housing" :value="h.id" /> {{ h.label }}
            </label>
          </div>
        </fieldset>
        <div class="demo__row">
          <label class="demo__field">Surface (m²)<input v-model.number="housing.surface" type="number" min="9" max="300" /></label>
          <label class="demo__field">Nombre de pièces<input v-model.number="housing.rooms" type="number" min="1" max="8" /></label>
        </div>
        <p v-if="!housingValid" class="demo__error">Surface entre 9 et 300 m², au moins 1 pièce.</p>
        <div class="demo__actions"><button class="demo__btn" :disabled="!housingValid" @click="step = 2">Continuer</button></div>
      </section>

      <!-- Étape 2 -->
      <section v-else-if="step === 2" class="demo__step" aria-labelledby="s2">
        <h1 id="s2" class="demo__title">Les pièces à meubler</h1>
        <p class="demo__text">Cochez toutes les pièces à équiper. Vous choisirez les prioritaires à l’étape suivante.</p>
        <fieldset class="demo__fieldset">
          <legend>Pièces à meubler</legend>
          <div class="demo__chips">
            <label v-for="r in ALL_ROOMS" :key="r.id" class="demo__chip" :class="{ on: selectedRooms.includes(r.id) }">
              <input type="checkbox" :checked="selectedRooms.includes(r.id)" @change="toggleRoom(r.id)" /> {{ r.label }}
            </label>
          </div>
        </fieldset>
        <div class="demo__actions">
          <button class="demo__btn demo__btn--ghost" @click="step = 1">Étape précédente</button>
          <button class="demo__btn" @click="step = 3">Continuer</button>
        </div>
        <p class="demo__hint">Pour tester : décochez toutes les pièces puis continuez pour voir l’état vide de l’étape 3.</p>
      </section>

      <!-- Étape 3 : le composant -->
      <section v-else-if="step === 3" aria-label="Style, budget et priorités">
        <div v-if="editingStyle" class="demo__style">
          <fieldset class="demo__fieldset">
            <legend>Votre style</legend>
            <div class="demo__chips">
              <label v-for="s in STYLES" :key="s" class="demo__chip" :class="{ on: style === s }">
                <input v-model="style" type="radio" name="style" :value="s" /> {{ s }}
              </label>
            </div>
          </fieldset>
          <button class="demo__btn demo__btn--ghost" @click="editingStyle = false">Valider le style</button>
        </div>
        <ApartmentBudgetPlanner
          v-model="planner"
          :rooms="rooms"
          :context="{ housing: housingLabel, style }"
          :current-step="3"
          :loading="loading"
          @previous="step = 2"
          @edit-step="(n) => (step = n)"
          @edit-style="editingStyle = true"
          @invalid="(e) => (lastErrors = e)"
          @submit="onSubmit"
        />
      </section>

      <!-- Étape 4 : résultat (démo) -->
      <section v-else class="demo__result" aria-labelledby="s4">
        <div class="demo__result-main">
          <h1 id="s4" class="demo__title">Votre sélection pour votre {{ housingLabel.split(' · ')[0].toLowerCase() }}</h1>
          <p class="demo__text">Des produits de la gamme Les Essentiels, rangés selon vos pièces prioritaires. Retirez ce que vous voulez : le budget se met à jour.</p>
          <div class="demo__chips demo__chips--criteria">
            <span class="demo__tag">{{ housingLabel }}</span>
            <span class="demo__tag">{{ style }}</span>
            <span class="demo__tag">Budget {{ money(budget) }}</span>
            <button class="demo__link" type="button" @click="step = 3">Modifier mes critères</button>
          </div>

          <section v-for="room in orderedRooms" :key="room.id" class="demo__room" :aria-labelledby="`room-${room.id}`">
            <header class="demo__room-head">
              <h2 :id="`room-${room.id}`">{{ room.label }}</h2>
              <PriorityBadge v-if="rankOf(room.id)" :rank="rankOf(room.id)" />
            </header>
            <ul v-if="productsFor(room.id).length" class="demo__cards">
              <li v-for="p in productsFor(room.id)" :key="p.id" class="demo__card">
                <span class="demo__card-brand">{{ p.brand }}</span>
                <h3 class="demo__card-name">{{ p.name }}</h3>
                <p class="demo__card-price">
                  <strong>{{ price(p.price) }}</strong>
                  <s v-if="p.oldPrice" class="demo__card-old"><span class="demo__sr">au lieu de </span>{{ price(p.oldPrice) }}</s>
                </p>
                <span class="demo__card-stock">En stock</span>
                <span class="demo__card-dim">Dimensions : {{ p.dimensions }}</span>
                <button type="button" class="demo__btn demo__btn--ghost demo__btn--small" @click="removeProduct(p.id, p.name)">
                  Retirer<span class="demo__sr"> {{ p.name }}</span>
                </button>
              </li>
            </ul>
            <p v-else class="demo__hint">Aucun produit dans cette pièce pour l’instant.</p>
          </section>
          <p class="demo__hint">Produits réels de vente-unique.com (relevé du 26/11/2026), sans images ni connexion au catalogue. En production, la sélection viendrait d’un moteur de recommandation.</p>
        </div>

        <aside class="demo__result-side" aria-labelledby="sel-summary">
          <BudgetSummary
            title-id="sel-summary"
            title="Votre budget"
            :rows="summaryRows"
            allocation-title="Consommé par pièce"
            :allocation="consumption"
            :format-money="money"
            @edit-step="(n) => (step = n)"
          />
          <p class="demo__status" :class="remaining >= 0 ? 'is-ok' : 'is-over'">
            {{ remaining >= 0 ? `Il vous reste ${price(remaining)} : vous êtes dans votre budget.` : `Vous dépassez votre budget de ${price(-remaining)}.` }}
          </p>
          <button class="demo__btn" type="button" disabled title="Hors du périmètre de la démo">Ajouter au panier</button>
          <button v-if="removed.length" class="demo__btn demo__btn--ghost" type="button" @click="restore">Rétablir la sélection</button>
          <p class="demo__hint">Le panier n’est pas relié dans cette démo.</p>
        </aside>
        <p class="demo__sr" aria-live="polite">{{ announce }}</p>
      </section>
    </main>

    <details class="demo__debug">
      <summary>Pour les développeurs : données transmises (v-model)</summary>
      <pre class="demo__pre">{{ JSON.stringify({ step, housing, selectedRooms, style, planner, submit: result, lastErrors }, null, 2) }}</pre>
    </details>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
body { margin: 0; font-family: 'Poppins', system-ui, sans-serif; color: #130c0c; background: #fff; }
.demo__banner { margin: 0; padding: 8px 16px; background: #000; color: #fff; font-size: 13px; text-align: center; }
.demo__banner code { color: #fff; }
.demo__page { max-width: 1296px; margin: 0 auto; padding: 32px 16px 64px; }
.demo__step { display: grid; gap: 24px; max-width: 720px; }
.demo__title { margin: 0; font-size: 32px; line-height: 40px; font-weight: 600; }
.demo__text { margin: 0; color: #170d0ecc; }
.demo__fieldset { border: 0; margin: 0; padding: 0; display: grid; gap: 12px; }
.demo__fieldset legend { font-weight: 600; font-size: 16px; margin-bottom: 12px; }
.demo__chips { display: flex; flex-wrap: wrap; gap: 8px; }
.demo__chip { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border: 1px solid #b8a8ab52; border-radius: 14px; cursor: pointer; }
.demo__chip.on { border: 2px solid #170d0ecc; }
.demo__chip:has(input:focus-visible) { box-shadow: 0 0 0 2px #fff, 0 0 0 4px #0072d6; }
.demo__chip input { accent-color: #130c0c; }
.demo__row { display: flex; gap: 16px; flex-wrap: wrap; }
.demo__field { display: grid; gap: 8px; font-weight: 500; font-size: 14px; }
.demo__field input { height: 48px; padding: 0 12px; border: 1px solid #1f14159c; border-radius: 14px; background: #c5b9bb24; font: inherit; width: 200px; }
.demo__field input:focus-visible { outline: none; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #0072d6; background: #fff; }
.demo__actions { display: flex; gap: 12px; flex-wrap: wrap; }
.demo__btn { min-height: 48px; padding: 12px 24px; border: 0; border-radius: 28px; background: #130c0c; color: #fff; font: 500 14px/20px 'Poppins', sans-serif; cursor: pointer; }
.demo__btn:disabled { background: #56434580; cursor: not-allowed; }
.demo__btn--ghost { background: #fff; color: #170d0ecc; border: 1px solid #56434580; }
.demo__btn:focus-visible { outline: none; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #0072d6; }
.demo__error { margin: 0; color: #e5002d; font-size: 12px; }
.demo__hint { margin: 0; color: #1f14159c; font-size: 12px; }
.demo__style { display: grid; gap: 16px; justify-items: start; margin-bottom: 32px; padding: 24px; border-radius: 20px; background: #c5b9bb24; }
.demo__pre { margin: 0; padding: 16px; border-radius: 14px; background: #130c0c; color: #f5f5f5; font-size: 12px; overflow: auto; }
.demo__debug { max-width: 1296px; margin: 0 auto 48px; padding: 0 16px; font-size: 13px; }
.demo__debug summary { cursor: pointer; margin-bottom: 8px; }
.demo__progress { margin-bottom: 32px; }
.demo__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.demo__result { display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 64px; align-items: start; }
.demo__result-main { display: grid; gap: 24px; }
.demo__result-side { position: sticky; top: 24px; display: grid; gap: 16px; padding: 24px; border-radius: 20px; background: #c5b9bb24; }
.demo__chips--criteria { align-items: center; }
.demo__tag { display: inline-flex; align-items: center; min-height: 36px; padding: 0 12px; border: 1px solid #56434580; border-radius: 10px; font-size: 14px; }
.demo__link { padding: 0; border: 0; background: none; font: 400 14px/20px 'Poppins', sans-serif; color: #130c0c; text-decoration: underline; cursor: pointer; }
.demo__link:focus-visible { outline: none; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #0072d6; border-radius: 4px; }
.demo__room { display: grid; gap: 16px; }
.demo__room-head { display: flex; align-items: center; gap: 12px; }
.demo__room-head h2 { margin: 0; font-size: 24px; line-height: 32px; font-weight: 600; }
.demo__cards { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
.demo__card { display: flex; flex-direction: column; gap: 6px; padding: 16px; border: 1px solid #b8a8ab52; border-radius: 20px; }
.demo__card-brand { font-size: 12px; color: #1f14159c; }
.demo__card-name { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; flex: 1; }
.demo__card-price { margin: 0; display: flex; gap: 8px; align-items: baseline; font-size: 16px; }
.demo__card-old { font-size: 12px; color: #1f14159c; }
.demo__card-stock { font-size: 12px; color: #008554; }
.demo__card-dim { align-self: flex-start; padding: 2px 8px; border-radius: 8px; background: #c5b9bb24; font-size: 12px; }
.demo__btn--small { min-height: 40px; padding: 8px 16px; margin-top: 8px; align-self: flex-start; }
.demo__status { margin: 0; padding: 8px 12px; border-radius: 10px; font-size: 13px; }
.demo__status.is-ok { background: #e1fef5; color: #008554; }
.demo__status.is-over { background: #fff1eb; color: #bd4800; }
@media (max-width: 991.98px) { .demo__result { grid-template-columns: 1fr; } .demo__result-side { position: static; } }
</style>
