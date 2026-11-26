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
  { id: 'bureau', label: 'Bureau', description: 'Bureau, chaise, étagère' },
  { id: 'cuisine', label: 'Cuisine', description: 'Table, chaises, rangements' },
  { id: 'salle-a-manger', label: 'Salle à manger', description: 'Table, chaises, buffet' },
  { id: 'salle-de-bain', label: 'Salle de bain', description: 'Meuble vasque, colonne, miroir' },
] = [
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
 * Les photos sont chargées depuis le serveur d'images de Vente-unique (aucune copie dans ce dépôt).
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
  image: string
  url: string
}

const CDN = 'https://cdn1.vente-unique.com/thumbnails/product'
const SITE = 'https://www.vente-unique.com/p'

export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: 'ackley', room: 'salon', brand: 'Vente-unique', name: 'Canapé d’angle réversible en simili ACKLEY - Marron', price: 329.99, oldPrice: 349.99, dimensions: 'L196 × P133 × H77 cm', image: `${CDN}/83/83010/large/0/28707447.webp`, url: `${SITE}/canape-d-angle-en-simili-ackley-chocolat-angle-gauche` },
  { id: 'lotula', room: 'salon', brand: 'Vente-unique', name: 'Meuble TV avec 3 portes et 1 niche - Blanc et naturel - LOTULA', price: 169.99, oldPrice: 179.99, dimensions: 'L180 × P44,6 × H44,5 cm', image: `${CDN}/624/624113/large/0/67135495.webp`, url: `${SITE}/meuble-tv-avec-3-portes-et-1-niche-blanc-et-naturel-lotula` },
  { id: 'prestige', room: 'chambre', brand: 'YSMÉE', name: 'Ensemble 140 × 190 cm sommier coffre + matelas ressorts ensachés - PRESTIGE', price: 519.99, dimensions: '140 × 190 cm', image: `${CDN}/710/710669/large/0/31226495.webp`, url: `${SITE}/ensemble-literie-140-x-190-cm-sommier-coffre-naturel-clair-matelas-ressorts-ensaches-prestige-de-dreamea` },
  { id: 'loavia', room: 'bureau', brand: 'Vente-unique', name: 'Bureau console extensible avec 2 tiroirs - Blanc et naturel - LOAVIA', price: 149.99, dimensions: 'L100 × P40/78 × H87 cm', image: `${CDN}/699/699785/large/0/22996807.webp`, url: `${SITE}/bureau-console-extensible-avec-2-tiroirs-blanc-et-naturel-loavia` },
  { id: 'travertin', room: 'cuisine', brand: 'Vente-unique', name: 'Table à manger ronde 6 personnes - Effet travertin beige', price: 179.99, dimensions: 'L138 × P138 × H75 cm', image: `${CDN}/4810/4810484/large/0/61049768.webp`, url: `${SITE}/topania-table-a-manger-ronde-6-personnes-effet-travertin-beige-topania` },
]

/** Logo officiel, chargé depuis le serveur de Vente-unique (non copié dans ce dépôt). */
export const LOGO_URL = 'https://cdn1.vente-unique.com/build/prod/default/logo/logo.1b5756c1.svg'
