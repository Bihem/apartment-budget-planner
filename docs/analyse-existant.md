# Analyse de l'existant — vente-unique.com (relevé du 25/11/2026, viewport 1440 et 390)

Méthode : pages ouvertes dans Chrome à 1440 px et 390 px ; styles calculés (getComputedStyle) ;
lecture des 28 feuilles CSS publiques du site et de leurs variables CSS. Aucune valeur inventée.

## Tokens officiels trouvés dans le CSS du site (variables --*)
Racine : html { font-size: 10px } → 1rem = 10px.

### Primitives couleur
- white #FFFFFF
- squid-50 #C5B9BB24 · squid-100 #D1C7C933 · squid-200 #B8A8AB52 · squid-400 #56434580
- squid-500 #1F14159C · squid-700 #170D0ECC · squid-950 #130C0C
- red-50 #FFEBEF · red-200 #FFCCD6 · red-600 #E5002D · red-700 #D6002A
- orange-50 #FFF1EB · orange-600 #C74900 · orange-700 #BD4800
- green-50 #E1FEF5 · green-600 #008554 · green-700 #008051
- blue-50 #E1F8FE · blue-600 #0072D6 · blue-700 #006ADB
- marque : red-main #EC002E (logo, pastille panier)

### Sémantiques
- interactive-primary-background : default squid-950 · rollover squid-700 · disabled squid-400
- interactive-secondary-stroke : default squid-400 · rollover/active squid-700 · disabled squid-200 · negative red-600 · focus blue-600
- interactive-tertiary-background : default squid-100 · rollover squid-200
- interactive-ghost-background : default white · rollover squid-100
- interactive-input-background : default squid-50 · active white ; interactive-input-stroke-default squid-500
- interactive-text-icon : default squid-700 · rollover squid-950 · disabled squid-400
- interactive-switch : default squid-500 · rollover squid-700 · active squid-950
- stroke-neutral : light squid-50 · medium squid-100 · hard squid-200
- text-icon-neutral : light squid-500 · medium squid-700 · hard squid-950 · on-dark white
- text-icon positive green-600/700 · attention orange-600/700 · negative red-600/700 · information blue-600/700
- surface : background white · neutral squid-50 · positive green-50 · attention orange-50 · negative red-50 · information blue-50 · separator squid-200
- shadow-focus : focus white · default blue-600 → anneau `0 0 0 2px white, 0 0 0 4px blue-600`

### Typographie
- font-family-base "Poppins" · font-family-heading "Recoleta"
- tailles 100→1000 : 12 / 14 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 px
- interlignes 100→1000 : 16 / 20 / 24 / 24 / 32 / 40 / 48 / 56 / 80 / 96 px
- graisses 400 / 500 / 600 / 700 · letter-spacing 0 jusqu'à 500, -1 à 600-800

### Espacements (spacing-*)
2 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 128 px (minuscule → huge)

### Rayons (radius-*)
8 · 10 · 14 (small) · 20 (medium) · 28 (large) · 48 · 999 (round) ; stroke-passive 1px, stroke-active 2px

### Ombres
positions 4/12/16 · flous 12/20/24 · spread 2/4

### Breakpoints observés
540 · 768 · 992 · 1100 · 1500 px

## Composants observés (desktop 1440)
| Composant | Mesures réelles | Réutilisable pour |
|---|---|---|
| Bandeau promo (wf-ad) | fond #000, texte blanc 13 px, h 29 px | header de la maquette |
| Header | logo x48 ; recherche 664×48, fond squid-50, bord 1 px squid-500, rayon 14 ; boutons « Aide & Contact », « Se connecter », « Panier » rayon 999, h 48 | header de la maquette |
| Navigation | « Tous nos produits » + liens 14/20 w500 squid-700, rangée h 44 | header |
| Fil d'Ariane | 12 px, séparateur « / », icône maison | retour au parcours |
| Titre de page | Recoleta 40/48 (listing), 48/56 (Les Essentiels) | titre de l'écran |
| Bouton primary (button-container primary) | fond squid-950, texte blanc, rayon 28, padding 12, h 48 ; hover squid-700 ; disabled squid-400 ; focus anneau bleu | « Voir ma sélection » |
| Bouton secondary | bord 1 px squid-400, texte squid-700 ; hover bord squid-700 | « Étape précédente » |
| Bouton ghost / tertiary | ghost : hover squid-100 ; tertiary : fond squid-100 | actions secondaires |
| Filtre déroulant (facet-desktop) | h 48, rayon 14, bord 1 px squid-400, libellé 14/20 w500 | — |
| Case à cocher filtre (facet-check) | 20×20, rayon 6, bord 1 px squid-500 ; prix en tranches « de 600 € à 899,99 € (112) » | sélection de budget (précédent existant) |
| Choix encadré (toggle-choice with-stroke) | bord 1 px stroke-neutral-hard, rayon 14, padding 12 ; hover bord squid-700 ; actif/focus 2 px squid-700 ; checkbox cochée = carré plein #170D0E ; titre 14/20, sous-titre 12/16 squid-500 ; désactivé opacité .5 | cartes budget et pièces |
| Tuile catégorie (button-tactile) | fond surface-neutral, rayon 28, h 200 ; hover tertiary-rollover ; focus outline 2 px blue-600 | pièces avec visuel (non retenu : trop haut) |
| Carte produit | 318 px, rayon 28, padding 8, image rayon 20, grille 4 col gap 8 ; marque 12/16 w500 squid-500 ; titre 14/20 w500 ; prix 16/24 w600 ; prix barré 14 squid-500 ; badge -20 % (label attention fill) fond orange-50 texte orange-700 rayon 14 ; « En stock » 12 px green-600 ; cœur 40×40 | étape 4 |
| Label (label elevated fill) | fond blanc, texte squid-700, rayon 14, padding 4 | badges |
| Switch « Vendu par Vente-unique » | switch 32×20 | — |
| Champ texte (input) | h 48, fond squid-50, bord 1 px squid-500, rayon 14, padding 0 12, 14/20 | budget personnalisé |
| Radio (toggle-choice-input) | 20×20 rond, bord squid-500 | — |
| Panneau latéral « Filtrer » | titre 20/24 w600, accordéons 16/24 w500, fermeture ghost 48×48 | — |
| Fiche produit | « Ajouter au panier » primary 312×48 ; quantité 72×48 ; « Payez en 3x, 4x, 10x, 12x, 24x, 36x. » 14 px squid-500 ; « Livré sous 3 à 7 jours » | étape 4 |

## Réassurance (textes du site)
4 % en bon d'achat pour chaque commande · 30 jours satisfait ou remboursé (hors marketplace) · 3,7 millions de clients livrés depuis 20 ans · conseillers 5 j/7 · garantie 2 ans · livraison en retrait ou à domicile.

## Contenus utiles
- Gamme « Les Essentiels — Tout pour bien commencer » : 411 produits, texte « Parce qu'aménager son premier chez-soi doit rester simple et accessible… ». Filtres : Catégorie, Couleur, Matière, Taille, Marque, Places, Forme, Style, Rangement, Prix en tranches.
- Listing Canapé : 17 127 produits, sous-catégories en tuiles, 7 filtres déroulants + « Tous les filtres », « Trier par ».

## Inconnus (non vérifiables depuis le site public)
- Pas de composant « indicateur de progression / stepper » sur le site (le seul .step-indicator est une barre blanche de stories vidéo). → à créer à partir des tokens existants, signalé comme nouveau.
- Pas de slider de budget/prix stylé Vente-unique (seul un .custom-range Bootstrap non stylé). → choix : tranches de budget en toggle-choice, comme le filtre Prix existant.
- Pas d'accès au design system interne (Figma, Storybook) : noms de composants déduits des classes CSS.
- Police Recoleta : licence commerciale, disponibilité dans Figma non garantie.
