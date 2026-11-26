<script setup lang="ts">
/**
 * En-tête du site reconstitué pour la démo, aux mesures relevées sur vente-unique.com
 * (bandeau promo, logo, recherche 664 × 48, boutons, navigation 14/20).
 * Démo uniquement : ce n'est pas un composant du design system proposé.
 */
import { LOGO_URL } from './demo-data'
const NAV = ['Black Friday', 'Promotions', 'Nouveautés', 'Inspirations & conseils', 'Corner Prestige']
</script>

<template>
  <header class="sh">
    <p class="sh__promo">-9% dès 500€ sur les produits Vente-unique. Code BFDAYS9</p>
    <div class="sh__bar">
      <button type="button" class="sh__icon sh__burger" aria-label="Menu" tabindex="-1">
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
      <a class="sh__logo" href="https://www.vente-unique.com" target="_blank" rel="noopener" aria-label="Vente-unique (site officiel, nouvel onglet)">
        <img :src="LOGO_URL" alt="Vente-unique" width="167" height="32" />
      </a>
      <div class="sh__search" role="presentation">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
        <span>Rechercher un produit</span>
        <svg class="sh__cam" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 8h3l2-2h6l2 2h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
      </div>
      <div class="sh__actions" aria-hidden="true">
        <span class="sh__act"><span class="sh__lbl">Aide &amp; Contact</span><svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" /></svg></span>
        <span class="sh__act"><span class="sh__lbl">Se connecter</span><svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg></span>
        <span class="sh__act"><span class="sh__lbl">Panier</span><svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 8h12l-1 13H7zM9 8V6a3 3 0 0 1 6 0v2" /></svg></span>
      </div>
    </div>
    <nav class="sh__nav" aria-hidden="true">
      <span class="sh__all"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M4 7h16M4 12h16M4 17h16" /></svg>Tous nos produits</span>
      <span class="sh__sep" />
      <span v-for="n in NAV" :key="n">{{ n }}</span>
    </nav>
  </header>
</template>

<style scoped>
.sh { font-family: var(--font-family-base, 'Poppins', sans-serif); color: #130c0c; border-bottom: 1px solid #c5b9bb24; }
.sh svg { fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.sh__promo { margin: 0; padding: 6px 16px; background: #000; color: #fff; font-size: 12px; line-height: 16px; text-align: center; }
.sh__bar { display: flex; align-items: center; gap: 24px; max-width: 1296px; margin: 0 auto; padding: 12px 16px; }
.sh__logo { display: flex; flex: none; }
.sh__logo img { display: block; height: 32px; width: auto; }
.sh__search { box-sizing: border-box; flex: 0 1 664px; display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 14px; border: 1px solid #1f14159c; border-radius: 14px; background: #c5b9bb24; color: #1f14159c; font-size: 14px; }
.sh__search span { flex: 1; }
.sh__cam { color: #130c0c; }
.sh__actions { margin-left: auto; display: flex; gap: 28px; }
.sh__act { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; white-space: nowrap; }
.sh__icon { display: none; padding: 0; border: 0; background: none; color: inherit; }
.sh__nav { display: flex; align-items: center; gap: 24px; max-width: 1296px; margin: 0 auto; padding: 4px 16px 12px; font-size: 14px; line-height: 20px; white-space: nowrap; overflow: hidden; }
.sh__all { display: inline-flex; align-items: center; gap: 8px; }
.sh__sep { width: 1px; height: 24px; background: #b8a8ab52; }
@media (max-width: 991.98px) {
  .sh__bar { flex-wrap: wrap; gap: 12px; }
  .sh__icon { display: inline-flex; }
  .sh__lbl { display: none; }
  .sh__actions { gap: 16px; }
  .sh__search { order: 5; flex: 1 1 100%; min-width: 0; box-sizing: border-box; }
  .sh__search span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sh__nav { display: none; }
  .sh__logo img { height: 28px; }
}
</style>
