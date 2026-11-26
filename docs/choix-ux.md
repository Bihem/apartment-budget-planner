# Choix UX / UI — écran « Étape 3 · Style, budget et priorités » (desktop 1440)

Persona de conception (hypothèse) : Lucas, 24 ans, studio 32 m², budget 1 500 €, style contemporain.

## Structure de l'écran
1. Bandeau promo + header Vente-unique (reconstruits à l'identique : logo, recherche 664×48, Aide & Contact, Se connecter, Panier, nav).
2. Fil d'Ariane « Accueil / Inspirations & conseils / Mon premier chez-moi » + lien « Étape précédente : Mes pièces ».
3. Indicateur de progression 4 étapes (1 Mon logement ✓, 2 Mes pièces ✓, 3 Style & budget = en cours, 4 Ma sélection). Nouveau composant, construit uniquement avec les tokens existants (pas d'équivalent sur le site).
4. Titre + texte explicatif.
5. Colonne principale :
   - Style (déjà choisi en haut de l'étape) : rappel compact « Contemporain · Modifier ».
   - Budget global : 4 tranches en choix encadrés (même logique que le filtre Prix du site, qui fonctionne par tranches) + champ « Montant exact » (composant input du site).
   - Pièces prioritaires : pièces sélectionnées à l'étape 2, en choix encadrés à cocher, 3 maximum, numérotées dans l'ordre de clic. Au-delà, les autres passent à l'état désactivé avec un message.
6. Colonne récapitulatif (sticky) : logement, pièces, style, budget, répartition indicative par priorité, bouton principal « Voir ma sélection », bouton secondaire « Étape précédente », réassurance du site.

## Décisions UX
- Tranches plutôt que slider : le site n'a pas de slider stylé ; les tranches reprennent le filtre Prix que l'utilisateur connaît déjà, et un débutant raisonne en ordre de grandeur. Le champ exact reste disponible.
- Priorités limitées à 3 : forcer un ordre aide à prioriser les achats (objectif UX) sans bloquer : les autres pièces restent dans la sélection.
- Récapitulatif toujours visible : rend le budget compréhensible et rassure (on voit ce qui a été saisi aux étapes 1-2, modifiable).
- Bouton principal désactivé tant qu'aucun budget n'est choisi, avec message explicite (pas de faux clic).
- Retour en arrière sans perte : toutes les valeurs restent dans l'état du parcours (v-model).
- Vouvoiement, comme le reste du site.

## Décisions UI
- Aucune nouvelle couleur : CTA noir squid-950 (le CTA du site n'est pas rouge), rouge réservé à la marque.
- Choix encadrés = composant `toggle-choice with-stroke` du site (rayon 14, bord 1 px, sélection 2 px squid-700).
- Focus = anneau officiel 2 px blanc + 4 px blue-600.
- Typo Poppins ; titre : Recoleta sur le site (font-family-heading) mais indisponible dans Figma → Poppins SemiBold 32/40 dans la maquette, à remplacer par Recoleta 40/48 en intégration (signalé).
- Grille : marges 72 px comme les listings (breakout 90 %), colonne principale 816 px, récap 400 px, gouttière 80 px.
