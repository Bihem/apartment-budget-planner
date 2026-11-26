import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ApartmentBudgetPlanner from '../src/components/ApartmentBudgetPlanner/ApartmentBudgetPlanner.vue'
import {
  DEFAULT_PRESETS,
  computeAllocation,
  parseAmount,
  presetForAmount,
  togglePriority,
  joinLabels,
} from '../src/components/ApartmentBudgetPlanner/budget-logic'
import type { BudgetPlannerValue } from '../src/components/ApartmentBudgetPlanner'

const rooms = [
  { id: 'salon', label: 'Salon' },
  { id: 'chambre', label: 'Chambre' },
  { id: 'bureau', label: 'Bureau' },
  { id: 'cuisine', label: 'Cuisine' },
]
const empty: BudgetPlannerValue = { presetId: null, amount: null, priorities: [] }

/** Monte le composant avec un v-model fonctionnel. */
function setup(value: BudgetPlannerValue = empty, extra: Record<string, unknown> = {}) {
  const w = mount(ApartmentBudgetPlanner, {
    props: {
      modelValue: value,
      rooms,
      'onUpdate:modelValue': (v: BudgetPlannerValue) => w.setProps({ modelValue: v }),
      ...extra,
    },
    attachTo: document.body,
  })
  return w
}

describe('logique', () => {
  it('lit les montants saisis en français', () => {
    expect(parseAmount('1 500')).toBe(1500)
    expect(parseAmount('1500,50 €')).toBe(1500.5)
    expect(parseAmount('')).toBeNull()
    expect(Number.isNaN(parseAmount('abc'))).toBe(true)
  })
  it('trouve la tranche d’un montant', () => {
    expect(presetForAmount(1500, DEFAULT_PRESETS)?.id).toBe('1200-1800')
    expect(presetForAmount(1800, DEFAULT_PRESETS)?.id).toBe('gte-1800')
  })
  it('respecte le maximum de priorités et l’ordre de clic', () => {
    let p = togglePriority([], 'a', 2)
    p = togglePriority(p, 'b', 2)
    expect(togglePriority(p, 'c', 2)).toEqual(['a', 'b'])
    expect(togglePriority(p, 'a', 2)).toEqual(['b'])
  })
  it('répartit le budget sans perdre d’euro', () => {
    const lines = computeAllocation(1500, ['salon', 'chambre'], rooms)
    expect(lines.map((l) => l.amount)).toEqual([600, 525, 375])
    expect(lines.reduce((a, l) => a + l.amount, 0)).toBe(1500)
  })
})

describe('ApartmentBudgetPlanner', () => {
  it('sélectionne la tranche correspondant au montant saisi', async () => {
    const w = setup()
    await w.find('input[type=text]').setValue('1 500')
    expect(w.props('modelValue')).toMatchObject({ amount: 1500, presetId: '1200-1800' })
  })

  it('numérote les priorités et désactive les autres pièces à la limite', async () => {
    const w = setup()
    const boxes = () => w.findAll('input[type=checkbox]')
    for (const i of [0, 1, 2]) await boxes()[i].setValue(true)
    expect(w.props('modelValue').priorities).toEqual(['salon', 'chambre', 'bureau'])
    expect(w.text()).toContain('Priorité 3')
    expect((boxes()[3].element as HTMLInputElement).disabled).toBe(true)
    expect(w.text()).toContain('Vous avez choisi 3 priorités')
  })

  it('bloque la validation et émet invalid sans budget', async () => {
    const w = setup()
    await w.find('.abp-btn--primary').trigger('click')
    expect(w.emitted('submit')).toBeUndefined()
    const errs = w.emitted('invalid')![0][0] as { field: string }[]
    expect(errs.map((e) => e.field)).toEqual(['budget', 'priorities'])
    expect(w.text()).toContain('Choisissez une tranche de budget')
  })

  it('refuse un montant hors bornes', async () => {
    const w = setup({ presetId: null, amount: null, priorities: ['salon'] })
    const input = w.find('input[type=text]')
    await input.setValue('150')
    await input.trigger('blur')
    expect(w.text()).toContain('Indiquez un montant entre')
    expect(input.attributes('aria-invalid')).toBe('true')
  })

  it('émet submit avec le montant de référence quand tout est valide', async () => {
    const w = setup({ presetId: '1200-1800', amount: null, priorities: ['salon'] })
    await w.find('.abp-btn--primary').trigger('click')
    expect(w.emitted('submit')![0][0]).toMatchObject({ referenceAmount: 1500, value: { presetId: '1200-1800' } })
  })

  it('émet previous et edit-step pour la navigation', async () => {
    const w = setup()
    await w.find('.abp-btn--secondary').trigger('click')
    expect(w.emitted('previous')).toHaveLength(1)
    await w.find('button.vu-step__body').trigger('click')
    expect(w.emitted('edit-step')![0]).toEqual([1])
  })

  it('affiche un état vide sans pièces et désactive le bouton principal', () => {
    const w = setup(empty, { rooms: [] })
    expect(w.text()).toContain('Aucune pièce sélectionnée')
    expect((w.find('.abp-btn--primary').element as HTMLButtonElement).disabled).toBe(true)
  })

  it('marque l’étape en cours pour les lecteurs d’écran', () => {
    const w = setup()
    expect(w.find('[aria-current="step"]').text()).toContain('Style & budget')
  })
})

describe('lisibilité du choix', () => {
  it('affiche le compteur de priorités et le choix multiple', async () => {
    const w = setup()
    expect(w.text()).toContain('Plusieurs choix possibles')
    expect(w.text()).toContain('0 sur 3 sélectionnée')
    await w.findAll('input[type=checkbox]')[1].setValue(true)
    await w.findAll('input[type=checkbox]')[0].setValue(true)
    expect(w.text()).toContain('2 sur 3 sélectionnées')
  })
  it('annonce dans le récapitulatif l’effet des priorités sur l’étape suivante', async () => {
    const w = setup({ presetId: '1200-1800', amount: null, priorities: ['chambre', 'salon'] })
    expect(w.text()).toContain('Une sélection de produits par pièce, chambre et salon en premier.')
  })
})

describe('briques réutilisables', () => {
  it('ChoiceCard fonctionne seule et émet change', async () => {
    const { default: ChoiceCard } = await import('../src/components/ApartmentBudgetPlanner/parts/ChoiceCard.vue')
    const w = mount(ChoiceCard, { props: { type: 'radio', name: 'livraison', value: 'premium', checked: false, title: 'Livraison premium', subtitle: 'Dans la pièce de votre choix' } })
    await w.find('input').setValue(true)
    expect(w.emitted('change')![0]).toEqual(['premium'])
    expect(w.find('input').attributes('type')).toBe('radio')
  })
  it('BudgetSummary fonctionne seule avec ses lignes et liens Modifier', async () => {
    const { default: BudgetSummary } = await import('../src/components/ApartmentBudgetPlanner/parts/BudgetSummary.vue')
    const w = mount(BudgetSummary, { props: { titleId: 't', rows: [{ label: 'Budget', value: '1 500 €', editStep: 3 }], formatMoney: (n: number) => `${n} €` } })
    expect(w.text()).toContain('1 500 €')
    await w.find('button').trigger('click')
    expect(w.emitted('edit-step')![0]).toEqual([3])
  })
})

describe('corrections de l’audit', () => {
  it('joinLabels : « Bureau et cuisine »', () => {
    expect(joinLabels(['Bureau', 'Cuisine'])).toBe('Bureau et cuisine')
    expect(joinLabels(['Bureau', 'Cuisine', 'Salle de bain'])).toBe('Bureau, cuisine et salle de bain')
    expect(joinLabels(['Salon'])).toBe('Salon')
  })

  it('un montant invalide décoche la tranche', async () => {
    const w = setup()
    const input = w.find('input[inputmode]')
    await input.setValue('10000')
    expect(w.props('modelValue').presetId).toBe('gte-1800')
    await input.setValue('10001')
    expect(w.props('modelValue').presetId).toBeNull()
    expect(w.props('modelValue').amount).toBeNull()
  })

  it('deux clics dans le même cycle gardent les deux priorités', async () => {
    const w = setup()
    const boxes = w.findAll('input[type="checkbox"]')
    ;(boxes[0].element as HTMLInputElement).click()
    ;(boxes[1].element as HTMLInputElement).click()
    await w.vm.$nextTick()
    expect(w.props('modelValue').priorities).toEqual(['salon', 'chambre'])
  })

  it('affiche le contenu du slot summary-footer', () => {
    const w = mount(ApartmentBudgetPlanner, {
      props: { modelValue: empty, rooms },
      slots: { 'summary-footer': '<p class="reassure">30 jours satisfait ou remboursé</p>' },
    })
    expect(w.find('.abp-summary__footer .reassure').exists()).toBe(true)
  })

  it('le retour mobile porte le nom de l’étape précédente', () => {
    const w = setup()
    expect(w.find('.vu-steps__back').text()).toContain('Mes pièces')
  })
})
