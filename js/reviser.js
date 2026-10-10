/* =========================================================
   Page Réviser : liste des questions avec filtre, tri,
   recherche et pagination (5 questions par page)
   ========================================================= */

const PAR_PAGE = 5;

let toutes = [];
let page = 1;

document.addEventListener('DOMContentLoaded', async function () {
  try {
    toutes = await chargerQuestions();
  } catch (e) {
    document.getElementById('liste').replaceChildren(
      el('li', { class: 'empty' }, 'Les questions n’ont pas pu être chargées. Ouvrez le site depuis un serveur (voir README).'));
    return;
  }

  // chaque changement de filtre relance l'affichage depuis la page 1
  ['recherche', 'theme', 'tri'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', function () { page = 1; afficher(); });
  });
  afficher();
});

function questionsFiltrees() {
  const recherche = normaliser(document.getElementById('recherche').value.trim());
  const theme = document.getElementById('theme').value;
  const tri = document.getElementById('tri').value;

  let liste = toutes.filter(function (q) {
    const bonTheme = theme === 'tout' || q.theme === theme;
    const bonTexte = recherche === '' || normaliser(q.texte).includes(recherche);
    return bonTheme && bonTexte;
  });

  // on trie une copie : la liste d'origine reste intacte
  liste = liste.slice();
  if (tri === 'theme') liste.sort((a, b) => a.theme.localeCompare(b.theme) || a.id - b.id);
  if (tri === 'niveau') {
    const ordre = { facile: 1, moyen: 2, difficile: 3 };
    liste.sort((a, b) => ordre[a.niveau] - ordre[b.niveau] || a.id - b.id);
  }
  return liste;
}

function afficher() {
  const liste = questionsFiltrees();
  const nbPages = Math.max(1, Math.ceil(liste.length / PAR_PAGE));
  page = Math.min(page, nbPages);
  const debut = (page - 1) * PAR_PAGE;
  const visibles = liste.slice(debut, debut + PAR_PAGE);

  document.getElementById('compteur').textContent =
    liste.length + ' question' + (liste.length > 1 ? 's' : '');

  const ul = document.getElementById('liste');
  if (visibles.length === 0) {
    ul.replaceChildren(el('li', { class: 'empty' }, 'Aucune question ne correspond à votre recherche.'));
  } else {
    ul.replaceChildren(...visibles.map(q => el('li', {},
      el('span', { class: 'q-num' }, '#' + q.id),
      el('div', {},
        el('div', { class: 'q-title' }, q.texte),
        el('div', { class: 'tags' },
          el('span', { class: 'tag ' + q.theme }, THEMES[q.theme] || q.theme),
          el('span', { class: 'tag' }, NIVEAUX[q.niveau] || q.niveau),
          el('span', { class: 'tag' }, 'Lot ' + q.lot))),
      el('a', { class: 'btn ghost', href: 'question.html?id=' + q.id }, 'Voir la réponse'))));
  }

  // pagination : Précédente, numéros, Suivante
  const pager = document.getElementById('pager');
  const bouton = (texte, cible, attrs) => el('button', { type: 'button', onclick: () => { page = cible; afficher(); }, ...attrs }, texte);
  const numeros = [];
  for (let i = 1; i <= nbPages; i++) {
    numeros.push(bouton(String(i), i, i === page ? { 'aria-current': 'page' } : {}));
  }
  pager.replaceChildren(
    bouton('‹', page - 1, page === 1 ? { disabled: '', 'aria-label': 'Page précédente' } : { 'aria-label': 'Page précédente' }),
    ...numeros,
    bouton('›', page + 1, page === nbPages ? { disabled: '', 'aria-label': 'Page suivante' } : { 'aria-label': 'Page suivante' })
  );
}
