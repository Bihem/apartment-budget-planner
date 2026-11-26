<script setup lang="ts">
/**
 * Démo du parcours « Mon premier chez-moi » : le parent garde l'état des 4 étapes,
 * ApartmentBudgetPlanner gère l'étape 3. Revenir en arrière ne perd aucune donnée.
 */
import { computed, nextTick, reactive, ref, watch } from 'vue'
import {
  ApartmentBudgetPlanner,
  PriorityBadge,
  ProgressSteps,
  computeAllocation,
  joinLabels,
  type BudgetPlannerValue,
  type PlannerError,
} from './components/ApartmentBudgetPlanner'
import { ALL_ROOMS, DEMO_PRODUCTS, HOUSING_TYPES, STYLES } from './demo/demo-data'
import SiteHeader from './demo/SiteHeader.vue'

const STEPS = [
  { id: 'housing', label: 'Mon logement' },
  { id: 'rooms', label: 'Mes pièces' },
  { id: 'budget', label: 'Style & budget' },
  { id: 'selection', label: 'Ma sélection' },
]

const step = ref(1)
const housing = reactive({ type: 'studio', surface: 32, rooms: 1 })
const selectedRooms = ref<string[]>(['salon', 'chambre', 'bureau', 'cuisine'])
const style = ref('Contemporain')
const editingStyle = ref(false)

// À chaque changement d'étape : retour en haut de page et focus sur le titre (lecteurs d'écran, clavier).
watch(step, async () => {
  editingStyle.value = false
  await nextTick()
  window.scrollTo({ top: 0 })
  const h1 = document.querySelector('main h1') as HTMLElement | null
  if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }) }
})
const planner = ref<BudgetPlannerValue>({ presetId: null, amount: null, priorities: [] })
const result = ref<{ value: BudgetPlannerValue; referenceAmount: number } | null>(null)
const lastErrors = ref<PlannerError[]>([])
const loading = ref(false)

const rooms = computed(() => ALL_ROOMS.filter((r) => selectedRooms.value.includes(r.id)))
const housingLabel = computed(
  () => `${HOUSING_TYPES.find((h) => h.id === housing.type)?.label} · ${housing.surface} m²`,
)
const housingTitle = computed(() => ({ studio: 'votre studio', t1: 'votre T1', t2: 'votre T2', coloc: 'votre chambre en colocation' } as Record<string, string>)[housing.type] ?? 'votre logement')
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
const notice = ref('')
const products = computed(() => DEMO_PRODUCTS.filter((p) => !removed.value.includes(p.id)))
const budget = computed(() => result.value?.referenceAmount ?? 0)
const roomLabel = (id: string) => ALL_ROOMS.find((r) => r.id === id)?.label ?? id
// Mêmes groupes que la répartition de l'étape 3 : 2 pièces prioritaires, puis les autres pièces ensemble.
const groups = computed(() => {
  const prio = planner.value.priorities.filter((id) => rooms.value.some((r) => r.id === id))
  const alloc = computeAllocation(budget.value, prio, rooms.value)
  const named = prio.slice(0, 2)
  const rank = (id: string) => (prio.includes(id) ? prio.indexOf(id) : 99)
  const others = rooms.value.filter((r) => !named.includes(r.id)).sort((a, b) => rank(a.id) - rank(b.id))
  const gs = named.map((id, i) => ({ key: id, label: roomLabel(id), rank: i + 1, roomIds: [id], planned: alloc[i]?.amount ?? 0 }))
  if (others.length) gs.push({ key: 'autres', label: joinLabels(others.map((r) => r.label)), rank: 0, roomIds: others.map((r) => r.id), planned: alloc[named.length]?.amount ?? 0 })
  return gs.map((g) => {
    const list = products.value.filter((p) => g.roomIds.includes(p.room))
    return { ...g, products: list, spent: list.reduce((s, p) => s + p.price, 0) }
  })
})
const total = computed(() => groups.value.reduce((s, g) => s + g.spent, 0))
const count = computed(() => groups.value.reduce((n, g) => n + g.products.length, 0))
const remaining = computed(() => budget.value - total.value)
const pct = (a: number, b: number) => (b > 0 ? Math.min(100, (a / b) * 100) : 0)
const prioritiesLabel = computed(() => planner.value.priorities.map(roomLabel).join(', '))
function removeProduct(id: string, name: string) {
  removed.value = [...removed.value, id]
  notice.value = ''
  announce.value = `${name} retiré de la sélection. Total : ${price(total.value)}.`
}
function restore() {
  removed.value = []
  announce.value = 'Sélection d’origine rétablie.'
}
function demoOnly(what: string) {
  notice.value = `Démo : ${what} n’est pas relié au site Vente-unique.`
}
function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.visibility = 'hidden'
}
const REASSURANCE = [
  { icon: 'refund', text: '30 jours satisfait ou remboursé (hors marketplace)' },
  { icon: 'truck', text: 'Livraison en retrait ou à domicile' },
  { icon: 'shield', text: 'Garantie 2 ans sur les produits' },
]
const crumbs = computed(() => ['Accueil', 'Inspirations & conseils', 'Mon premier chez-moi', ...(step.value === 4 ? ['Ma sélection'] : [])])
</script>

<template>
  <div class="demo">
    <SiteHeader />

    <main class="demo__page">
      <nav class="demo__crumbs" aria-label="Fil d’Ariane">
        <ol>
          <li><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 11l8-7 8 7v9h-5v-6h-6v6H4z" /></svg></li>
          <li v-for="(c, i) in crumbs" :key="c" :aria-current="i === crumbs.length - 1 ? 'page' : undefined">{{ c }}</li>
        </ol>
      </nav>
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
        >
          <template #summary-footer>
            <ul class="demo__reassure">
              <li v-for="r in REASSURANCE" :key="r.icon"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path v-if="r.icon === 'refund'" d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" /><path v-else-if="r.icon === 'truck'" d="M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-.1M17 19a2 2 0 1 0 0-.1" /><path v-else d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /></svg>{{ r.text }}</li>
            </ul>
          </template>
        </ApartmentBudgetPlanner>
      </section>

      <!-- Étape 4 : résultat (démo) -->
      <section v-else class="demo__result" aria-labelledby="s4">
        <div class="demo__result-main">
          <h1 id="s4" class="demo__title">Votre sélection pour {{ housingTitle }}</h1>
          <p class="demo__text">{{ count }} produit{{ count > 1 ? 's' : '' }} de la gamme Les Essentiels, choisis selon votre budget, vos pièces prioritaires et votre style.<br />Remplacez ou retirez ce que vous voulez : le budget se met à jour.</p>
          <div class="demo__criteria">
            <span class="demo__tag">{{ housingLabel }}</span>
            <span class="demo__tag">{{ style }}</span>
            <span class="demo__tag">Budget {{ money(budget) }}</span>
            <span class="demo__tag">Priorités : {{ prioritiesLabel }}</span>
            <button class="demo__link" type="button" @click="step = 3">Modifier mes critères</button>
          </div>

          <section v-for="g in groups" :key="g.key" class="demo__room" :aria-labelledby="`room-${g.key}`">
            <header class="demo__room-head">
              <h2 :id="`room-${g.key}`">{{ g.label }}</h2>
              <PriorityBadge v-if="g.rank" :rank="g.rank" />
              <span class="demo__room-meta">{{ g.products.length }} produit{{ g.products.length > 1 ? 's' : '' }} · {{ price(g.spent) }} sur {{ money(g.planned) }} prévus</span>
            </header>
            <ul v-if="g.products.length" class="demo__cards">
              <li v-for="p in g.products" :key="p.id" class="pc">
                <a class="pc__img" :href="p.url" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
                  <img :src="p.image" alt="" loading="lazy" referrerpolicy="no-referrer" @error="onImgError" />
                </a>
                <div class="pc__body">
                  <span class="pc__brand">{{ p.brand }}</span>
                  <h3 class="pc__name"><a :href="p.url" target="_blank" rel="noopener">{{ p.name }}<span class="demo__sr"> (fiche produit, nouvel onglet)</span></a></h3>
                  <p class="pc__price">
                    <strong>{{ price(p.price) }}</strong>
                    <template v-if="p.oldPrice">
                      <s><span class="demo__sr">au lieu de </span>{{ price(p.oldPrice) }}</s>
                      <span class="pc__badge">-{{ money(p.oldPrice - p.price) }}</span>
                    </template>
                  </p>
                  <span class="pc__stock">En stock</span>
                  <span class="pc__dim"><b>Dimensions :</b> {{ p.dimensions }}</span>
                  <span class="pc__grow" />
                  <div class="pc__actions">
                    <a class="pc__btn pc__btn--secondary" :href="p.url" target="_blank" rel="noopener">Remplacer<span class="demo__sr"> {{ p.name }} : voir d’autres choix sur vente-unique.com (nouvel onglet)</span></a>
                    <button type="button" class="pc__btn pc__btn--tertiary" @click="removeProduct(p.id, p.name)">Retirer<span class="demo__sr"> {{ p.name }}</span></button>
                  </div>
                </div>
              </li>
            </ul>
            <p v-else class="demo__hint">Aucun produit dans cette pièce pour l’instant.</p>
          </section>
          <p class="demo__hint">Produits réels de la gamme Les Essentiels, prix et dimensions relevés sur vente-unique.com le 26/11/2026. Sélection faite à la main pour la démo : en production, elle viendrait d’un moteur de recommandation. Dans la démo, « Remplacer » ouvre la fiche du produit sur vente-unique.com pour choisir un autre coloris ou modèle.</p>
        </div>

        <aside class="demo__result-side" aria-labelledby="sel-summary">
          <h2 id="sel-summary" class="bs__title">Votre budget</h2>
          <p class="bs__total"><strong>{{ price(total) }}</strong> <span>sur {{ money(budget) }}</span></p>
          <span class="bs__track" aria-hidden="true"><span :style="{ width: `${pct(total, budget)}%` }" /></span>
          <p class="bs__status" :class="remaining >= 0 ? 'is-ok' : 'is-over'">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            {{ remaining >= 0 ? `Il vous reste ${price(remaining)} : vous êtes dans votre budget.` : `Vous dépassez votre budget de ${price(-remaining)}.` }}
          </p>
          <hr />
          <h3 class="bs__sub">Consommé par pièce</h3>
          <ul class="bs__lines">
            <li v-for="g in groups" :key="g.key">
              <span class="bs__row"><span>{{ g.label }}{{ g.rank ? ` · priorité ${g.rank}` : '' }}</span><strong>{{ price(g.spent) }} / {{ money(g.planned) }}</strong></span>
              <span class="bs__track bs__track--thin" aria-hidden="true"><span :style="{ width: `${pct(g.spent, g.planned)}%` }" /></span>
            </li>
          </ul>
          <hr />
          <button class="demo__btn demo__btn--block" type="button" @click="demoOnly('l’ajout au panier')">Ajouter les {{ count }} produits au panier</button>
          <button class="demo__btn demo__btn--ghost demo__btn--block" type="button" @click="demoOnly('l’enregistrement du projet')">Enregistrer mon projet</button>
          <button v-if="removed.length" class="demo__link" type="button" @click="restore">Rétablir la sélection d’origine</button>
          <p v-if="notice" class="demo__notice" role="status">{{ notice }}</p>
          <p class="bs__note">Délais et frais de livraison confirmés dans le panier, comme sur le reste du site.</p>
          <ul class="demo__reassure">
            <li v-for="r in REASSURANCE" :key="r.icon"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path v-if="r.icon === 'refund'" d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" /><path v-else-if="r.icon === 'truck'" d="M3 6h11v10H3zM14 9h4l3 3v4h-7M7 19a2 2 0 1 0 0-.1M17 19a2 2 0 1 0 0-.1" /><path v-else d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" /></svg>{{ r.text }}</li>
          </ul>
        </aside>
        <p class="demo__sr" aria-live="polite">{{ announce }}</p>
        <div class="demo__mbar" aria-hidden="true">
          <span><strong>{{ price(total) }}</strong> sur {{ money(budget) }}</span>
          <span :class="remaining >= 0 ? 'is-ok' : 'is-over'">{{ remaining >= 0 ? `Reste ${price(remaining)}` : `Dépassement ${price(-remaining)}` }}</span>
        </div>
      </section>
    </main>

    <p class="demo__foot">Démo du composant <code>ApartmentBudgetPlanner</code> — exercice de conception, non affilié à Vente-unique. Données de démonstration ; logo et photos chargés depuis vente-unique.com.</p>
    <details class="demo__debug">
      <summary>Pour les développeurs : données transmises (v-model)</summary>
      <pre class="demo__pre">{{ JSON.stringify({ step, housing, selectedRooms, style, planner, submit: result, lastErrors }, null, 2) }}</pre>
    </details>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
body { margin: 0; font-family: 'Poppins', system-ui, sans-serif; color: #130c0c; background: #fff; }
/* Démo sans Recoleta : titre en Poppins SemiBold 32/40, comme la maquette Figma (sur le site : Recoleta 400, 40/48). */
:root { --abp-title-weight: 600; --abp-title-size: 32px; --abp-title-line-height: 40px; }
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
main h1:focus { outline: none; }
.demo__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.demo__result { display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 64px; align-items: start; }
.demo__result-main { display: grid; gap: 24px; }
.demo__tag { display: inline-flex; align-items: center; min-height: 36px; padding: 0 12px; border: 1px solid #56434580; border-radius: 10px; font-size: 14px; }
.demo__link { display: inline-block; padding: 12px 0; margin: -12px 0; border: 0; background: none; font: 400 14px/20px 'Poppins', sans-serif; color: #130c0c; text-decoration: underline; cursor: pointer; }
.demo__link:focus-visible { outline: none; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #0072d6; border-radius: 4px; }
.demo__room { display: grid; gap: 16px; }
.demo__mbar { display: none; }
@media (max-width: 991.98px) {
  .demo__result { grid-template-columns: 1fr; padding-bottom: 72px; }
  .demo__result-side { position: static; }
  .demo__mbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; padding: 14px 16px; background: #fff; border-top: 1px solid #b8a8ab52; box-shadow: 0 -4px 16px #130c0c14; font-size: 14px; }
  .demo__mbar .is-ok { color: #008554; font-weight: 500; }
  .demo__mbar .is-over { color: #bd4800; font-weight: 500; }
}
.demo__crumbs ol { list-style: none; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 24px; padding: 0; font-size: 12px; line-height: 16px; color: #170d0ecc; }
.demo__crumbs li { display: inline-flex; align-items: center; gap: 8px; }
.demo__crumbs li + li::before { content: '/'; color: #1f14159c; }
.demo__crumbs li[aria-current] { color: #130c0c; font-weight: 500; }
.demo__crumbs svg { fill: none; stroke: #130c0c; stroke-width: 1.6; stroke-linejoin: round; }
.demo__criteria { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.demo__room-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.demo__room-head h2 { margin: 0; font-size: 24px; line-height: 32px; font-weight: 600; }
.demo__room-meta { margin-left: auto; font-size: 12px; color: #170d0ecc; }
.demo__cards { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 238px)); gap: 16px; }
.pc { display: flex; flex-direction: column; padding: 8px; border: 1px solid #c5b9bb24; border-radius: 28px; background: #fff; box-shadow: 0 0 0 1px #b8a8ab33; }
.pc__img { display: block; aspect-ratio: 4 / 3; border-radius: 20px; overflow: hidden; background: #f4f1f1; }
.pc__img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pc__body { flex: 1; display: flex; flex-direction: column; gap: 4px; padding: 12px 8px 8px; }
.pc__brand { font-size: 12px; line-height: 16px; color: #170d0ecc; }
.pc__name { margin: 0; font-size: 14px; line-height: 20px; font-weight: 500; }
.pc__name a { color: inherit; text-decoration: none; }
.pc__name a:hover { text-decoration: underline; }
.pc__name a:focus-visible { outline: none; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #0072d6; border-radius: 4px; }
.pc__price { margin: 4px 0 0; display: flex; align-items: center; gap: 8px; font-size: 16px; line-height: 24px; }
.pc__price s { font-size: 12px; color: #170d0ecc; }
.pc__badge { padding: 0 6px; border-radius: 8px; background: #fff1eb; color: #bd4800; font-size: 12px; line-height: 18px; }
.pc__stock { font-size: 12px; color: #008554; }
.pc__dim { align-self: flex-start; max-width: 100%; box-sizing: border-box; margin-top: 4px; padding: 2px 8px; border-radius: 8px; background: #c5b9bb24; font-size: 11px; line-height: 16px; padding-top: 3px; padding-bottom: 3px; }
.pc__dim b { font-weight: 500; }
.pc__grow { flex: 1; }
.pc__actions { display: flex; gap: 8px; margin-top: 12px; }
.pc__btn { flex: 1; display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 12px; border-radius: 28px; font: 500 12px/16px 'Poppins', sans-serif; color: #130c0c; text-decoration: none; cursor: pointer; }
.pc__btn--secondary { border: 1px solid #56434580; background: #fff; }
.pc__btn--secondary:hover { border-color: #170d0ecc; }
.pc__btn--tertiary { border: 0; background: #c5b9bb24; }
.pc__btn--tertiary:hover { background: #d1c7c933; }
.pc__btn:focus-visible { outline: none; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #0072d6; }
.demo__result-side { position: sticky; top: 24px; display: grid; gap: 14px; padding: 24px; border-radius: 20px; background: #c5b9bb24; }
.demo__result-side hr { width: 100%; margin: 4px 0; border: 0; border-top: 1px solid #b8a8ab52; }
.bs__title { margin: 0; font-size: 20px; line-height: 28px; font-weight: 600; }
.bs__total { margin: 0; display: flex; align-items: baseline; gap: 8px; }
.bs__total strong { font-size: 32px; line-height: 40px; font-weight: 600; }
.bs__total span { font-size: 14px; color: #170d0ecc; }
.bs__track { display: block; height: 8px; border-radius: 999px; background: #b8a8ab52; overflow: hidden; }
.bs__track span { display: block; height: 100%; border-radius: 999px; background: #130c0c; }
.bs__track--thin { height: 6px; margin-top: 4px; }
.bs__status { margin: 0; display: flex; gap: 8px; align-items: flex-start; padding: 8px 12px; border-radius: 10px; font-size: 14px; line-height: 20px; font-weight: 500; }
.bs__status svg { flex: none; margin-top: 2px; fill: none; stroke: currentColor; stroke-width: 2; }
.bs__status.is-ok { background: #e1fef5; color: #006b44; }
.bs__status.is-over { background: #fff1eb; color: #bd4800; }
.bs__sub { margin: 0; font-size: 14px; line-height: 20px; font-weight: 600; }
.bs__lines { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.bs__row { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; line-height: 16px; }
.bs__row strong { font-weight: 600; white-space: nowrap; }
.bs__note { margin: 0; font-size: 12px; line-height: 16px; color: #170d0ecc; }
.demo__btn--block { width: 100%; }
.demo__notice { margin: 0; padding: 8px 12px; border-radius: 10px; background: #fff1eb; color: #bd4800; font-size: 13px; }
.demo__reassure { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; font-size: 12px; line-height: 16px; color: #170d0ecc; }
.demo__reassure li { display: flex; align-items: center; gap: 8px; }
.demo__reassure svg { flex: none; fill: none; stroke: #130c0c; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.demo__foot { max-width: 1296px; margin: 0 auto; padding: 24px 16px 8px; font-size: 12px; color: #1f14159c; }
.demo__foot code { font-size: 12px; }
@media (max-width: 991.98px) { .demo__cards { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); } }
</style>
