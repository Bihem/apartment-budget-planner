/**
 * DONNÉES DE DÉMONSTRATION — aucune connexion au catalogue Vente-unique.
 * Persona de conception (hypothèse) : Lucas, 24 ans, studio de 32 m², 1 500 €, style contemporain.
 */
import type { PlannerRoom } from '../components/ApartmentBudgetPlanner'

export const HOUSING_TYPES = [
  { id: 'studio', label: 'Studio' },
  { id: 't1', label: 'T1' },
  { id: 't2', label: 'T2' },
  { id: 'coloc', label: 'Chambre en colocation' },
]

export const ALL_ROOMS: PlannerRoom[] = [
  { id: 'salon', label: 'Salon', description: 'Canapé, table basse, meuble TV' },
  { id: 'chambre', label: 'Chambre', description: 'Lit, matelas, rangement' },
  { id: 'cuisine', label: 'Cuisine', description: 'Table, chaises, rangements' },
  { id: 'salle-a-manger', label: 'Salle à manger', description: 'Table, chaises, buffet' },
  { id: 'bureau', label: 'Bureau', description: 'Bureau, chaise, étagère' },
  { id: 'salle-de-bain', label: 'Salle de bain', description: 'Meuble vasque, colonne, miroir' },
]

export const STYLES = ['Contemporain', 'Scandinave', 'Industriel', 'Bohème']

/**
 * Étape 4 — produits réels de la gamme Les Essentiels (prix et dimensions relevés sur vente-unique.com le 26/11/2026).
 * Sélection faite à la main pour la démo ; en production, elle viendrait d'un moteur de recommandation.
 */
export interface DemoProduct {
  id: string
  room: string
  brand: string
  name: string
  price: number
  oldPrice?: number
  dimensions: string
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 'ackley', room: 'salon', brand: 'Vente-unique', name: 'Canapé d’angle réversible en simili ACKLEY - Marron', price: 329.99, oldPrice: 349.99, dimensions: 'L196 × P133 × H77 cm' },
  { id: 'lotula', room: 'salon', brand: 'Vente-unique', name: 'Meuble TV avec 3 portes et 1 niche - Blanc et naturel - LOTULA', price: 169.99, oldPrice: 179.99, dimensions: 'L180 × P44,6 × H44,5 cm' },
  { id: 'prestige', room: 'chambre', brand: 'YSMÉE', name: 'Ensemble 140 × 190 cm sommier coffre + matelas ressorts ensachés - PRESTIGE', price: 519.99, dimensions: '140 × 190 cm' },
  { id: 'loavia', room: 'bureau', brand: 'Vente-unique', name: 'Bureau console extensible avec 2 tiroirs - Blanc et naturel - LOAVIA', price: 149.99, dimensions: 'L100 × P40/78 × H87 cm' },
  { id: 'travertin', room: 'cuisine', brand: 'Vente-unique', name: 'Table à manger ronde 6 personnes - Effet travertin beige', price: 179.99, dimensions: 'L138 × P138 × H75 cm' },
]
