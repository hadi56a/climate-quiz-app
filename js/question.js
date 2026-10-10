/* =========================================================
   Page Question : réponse, informations et explication
   d'une question. Adresse : question.html?id=3
   L'affichage de l'explication est personnalisable et
   les réglages sont gardés dans le navigateur (localStorage).
   ========================================================= */

const CLE_REGLAGES = 'climatquiz.reglages';
const REGLAGES_DEFAUT = { taille: 18, fond: '#f2f5f7', texte: '#12202f' };

document.addEventListener('DOMContentLoaded', async function () {
  const id = Number(new URLSearchParams(location.search).get('id'));
  const zone = document.getElementById('detail');

  let questions;
  try {
    questions = await chargerQuestions();
  } catch (e) {
    zone.replaceChildren(el('p', { class: 'empty' }, 'Les questions n’ont pas pu être chargées. Ouvrez le site depuis un serveur (voir README).'));
    return;
  }

  const q = questions.find(x => x.id === id);
  if (!q) {
    zone.replaceChildren(el('div', { class: 'empty' },
      el('p', {}, 'Cette question n’existe pas.'),
      el('a', { class: 'btn', href: 'reviser.html' }, 'Retour à la liste')));
    return;
  }

  document.title = 'Question ' + q.id + ' – Quiz Climat';
  const position = questions.indexOf(q);
  const precedente = questions[position - 1];
  const suivante = questions[position + 1];

  zone.replaceChildren(
    el('p', {}, el('a', { href: 'reviser.html' }, '← Toutes les questions')),
    el('h1', {}, q.texte),
    el('div', { class: 'detail' },
      el('div', {},
        el('ul', { class: 'answers' },
          q.reponses.map((texte, i) => el('li', {},
            el('div', { class: 'answer' + (i + 1 === q.bonne ? ' correct' : '') },
              el('span', { class: 'letter' }, 'ABCD'[i]), texte,
              i + 1 === q.bonne ? el('strong', { style: 'margin-left:auto' }, 'Bonne réponse') : null)))),
        el('h2', { style: 'margin-top:28px' }, 'Explication'),
        el('div', { class: 'explanation', id: 'explication' }, el('p', {}, q.explication)),
        panneauReglages()),
      el('aside', {},
        el('img', { src: q.image, alt: '' }),
        el('dl', { class: 'facts' },
          el('dt', {}, 'Thème'), el('dd', {}, THEMES[q.theme] || q.theme),
          el('dt', {}, 'Niveau'), el('dd', {}, NIVEAUX[q.niveau] || q.niveau),
          el('dt', {}, 'Lot'), el('dd', {}, String(q.lot)),
          el('dt', {}, 'Points'), el('dd', {}, String(q.points))),
        el('div', { class: 'custom-actions' },
          precedente ? el('a', { class: 'btn ghost', href: 'question.html?id=' + precedente.id }, '← Précédente') : null,
          suivante ? el('a', { class: 'btn ghost', href: 'question.html?id=' + suivante.id }, 'Suivante →') : null)))
  );

  appliquerReglages(lireReglages());
});

/* ---------- Personnalisation de l'affichage ---------- */
function lireReglages() {
  try { return { ...REGLAGES_DEFAUT, ...JSON.parse(localStorage.getItem(CLE_REGLAGES)) }; }
  catch (e) { return { ...REGLAGES_DEFAUT }; }
}

function appliquerReglages(r) {
  const bloc = document.getElementById('explication');
  bloc.style.fontSize = r.taille + 'px';
  bloc.style.backgroundColor = r.fond;
  bloc.style.color = r.texte;
  document.getElementById('reg-taille').value = r.taille;
  document.getElementById('reg-taille-valeur').textContent = r.taille + ' px';
  document.getElementById('reg-fond').value = r.fond;
  document.getElementById('reg-texte').value = r.texte;
}

function panneauReglages() {
  function majDepuisFormulaire() {
    const r = {
      taille: Number(document.getElementById('reg-taille').value),
      fond: document.getElementById('reg-fond').value,
      texte: document.getElementById('reg-texte').value
    };
    appliquerReglages(r);
    return r;
  }

  return el('details', { class: 'custom' },
    el('summary', {}, 'Personnaliser l’affichage de l’explication'),
    el('div', { class: 'custom-grid' },
      el('div', { class: 'field', style: 'grid-column: 1 / -1' },
        el('label', { for: 'reg-taille' }, 'Taille du texte : ', el('span', { id: 'reg-taille-valeur' })),
        el('input', { type: 'range', id: 'reg-taille', min: 14, max: 30, step: 1, oninput: majDepuisFormulaire })),
      el('div', { class: 'field' },
        el('label', { for: 'reg-fond' }, 'Couleur du fond'),
        el('input', { type: 'color', id: 'reg-fond', oninput: majDepuisFormulaire })),
      el('div', { class: 'field' },
        el('label', { for: 'reg-texte' }, 'Couleur du texte'),
        el('input', { type: 'color', id: 'reg-texte', oninput: majDepuisFormulaire }))),
    el('div', { class: 'custom-actions' },
      el('button', { type: 'button', class: 'btn', onclick: function () {
        try { localStorage.setItem(CLE_REGLAGES, JSON.stringify(majDepuisFormulaire())); } catch (e) { /* rien */ }
        this.textContent = 'Enregistré ✓';
        setTimeout(() => { this.textContent = 'Enregistrer'; }, 1500);
      } }, 'Enregistrer'),
      el('button', { type: 'button', class: 'btn ghost', onclick: function () {
        try { localStorage.removeItem(CLE_REGLAGES); } catch (e) { /* rien */ }
        appliquerReglages(REGLAGES_DEFAUT);
      } }, 'Réinitialiser')));
}
