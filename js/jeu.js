/* =========================================================
   Page Jeu : une question à la fois, avec un minuteur
   Adresse : jeu.html?lot=1  ou  jeu.html?niveau=facile
   ========================================================= */

const DUREE_QUESTION = 20; // secondes par question

let questions = [];
let index = 0;
let score = 0;
let total = 0;
let resultats = [];        // true / false pour chaque question
let tempsRestant = DUREE_QUESTION;
let minuteur = null;
let modeTexte = '';

document.addEventListener('DOMContentLoaded', async function () {
  const params = new URLSearchParams(location.search);
  const lot = params.get('lot');
  const niveau = params.get('niveau');
  const zone = document.getElementById('jeu');

  try {
    const toutes = await chargerQuestions();
    if (lot) {
      questions = toutes.filter(q => q.lot === Number(lot));
      modeTexte = 'Lot ' + lot;
    } else if (niveau) {
      questions = toutes.filter(q => q.niveau === niveau);
      modeTexte = 'Niveau ' + (NIVEAUX[niveau] || niveau).toLowerCase();
    }
  } catch (e) {
    zone.replaceChildren(el('p', { class: 'empty' }, 'Les questions n’ont pas pu être chargées. Ouvrez le site depuis un serveur (voir README).'));
    return;
  }

  if (questions.length === 0) {
    zone.replaceChildren(el('div', { class: 'empty' },
      el('p', {}, 'Choisissez d’abord un lot ou un niveau.'),
      el('a', { class: 'btn', href: lienPage('index.html') }, 'Choisir une partie')));
    return;
  }

  total = questions.reduce((somme, q) => somme + q.points, 0);
  afficherQuestion();
});

function afficherQuestion() {
  const q = questions[index];
  const zone = document.getElementById('jeu');

  // barre de progression : une case par question
  const progression = el('div', { class: 'progress', 'aria-hidden': 'true' },
    questions.map((_, i) => el('i', { class: i < index ? (resultats[i] ? 'good' : 'bad') : (i === index ? 'now' : '') })));

  const reponses = el('ul', { class: 'answers' },
    q.reponses.map((texte, i) => el('li', {},
      el('button', { type: 'button', class: 'answer', 'data-n': i + 1, onclick: () => repondre(i + 1) },
        el('span', { class: 'letter' }, 'ABCD'[i]), texte))));

  zone.replaceChildren(
    el('div', { class: 'game-top' },
      el('span', { class: 'game-mode' }, modeTexte),
      el('span', { class: 'game-count' }, 'Question ' + (index + 1) + ' sur ' + questions.length + ' · Score : ' + score + ' pts')),
    progression,
    el('div', { class: 'timer', role: 'progressbar', 'aria-label': 'Temps restant', 'aria-valuemin': 0, 'aria-valuemax': DUREE_QUESTION },
      el('div', { class: 'timer-bar', id: 'timer-bar' })),
    el('p', { class: 'timer-text', id: 'timer-text', 'aria-live': 'off' }, DUREE_QUESTION + ' s'),
    el('article', { class: 'question-card' },
      el('img', { src: q.image, alt: '' }),
      el('div', { class: 'question-body' },
        el('h1', { class: 'question-text' }, q.texte),
        reponses,
        el('div', { id: 'feedback', 'aria-live': 'polite' }),
        el('div', { class: 'game-actions', id: 'actions' })))
  );

  demarrerMinuteur();
  zone.querySelector('.answer').focus({ preventScroll: true });
}

function demarrerMinuteur() {
  clearInterval(minuteur);
  tempsRestant = DUREE_QUESTION;
  const barre = document.getElementById('timer-bar');
  const texte = document.getElementById('timer-text');
  minuteur = setInterval(function () {
    tempsRestant--;
    barre.style.width = (tempsRestant / DUREE_QUESTION * 100) + '%';
    texte.textContent = tempsRestant + ' s';
    if (tempsRestant <= 0) repondre(0); // temps écoulé = pas de réponse
  }, 1000);
}

function repondre(choix) {
  clearInterval(minuteur);
  const q = questions[index];
  const juste = choix === q.bonne;
  if (juste) score += q.points;
  resultats[index] = juste;

  // on montre la bonne réponse (et la mauvaise si besoin), puis on bloque les boutons
  document.querySelectorAll('.answer').forEach(function (bouton) {
    const n = Number(bouton.dataset.n);
    bouton.disabled = true;
    if (n === q.bonne) bouton.classList.add('correct');
    else if (n === choix) bouton.classList.add('wrong');
  });

  const message = juste
    ? 'Bonne réponse ! +' + q.points + ' points'
    : (choix === 0 ? 'Temps écoulé. ' : 'Mauvaise réponse. ') + 'La bonne réponse était : ' + q.reponses[q.bonne - 1] + '.';
  document.getElementById('feedback').replaceChildren(
    el('div', { class: 'feedback ' + (juste ? 'good' : 'bad') }, message, ' ',
      el('a', { href: 'question.html?id=' + q.id, target: '_blank' }, 'Lire l’explication')));

  const derniere = index === questions.length - 1;
  const suivant = el('button', { type: 'button', class: 'btn', onclick: derniere ? terminer : questionSuivante },
    derniere ? 'Voir mon résultat' : 'Question suivante');
  document.getElementById('actions').replaceChildren(suivant);
  suivant.focus();
}

function questionSuivante() {
  index++;
  afficherQuestion();
  window.scrollTo({ top: 0 });
}

function terminer() {
  ajouterScore({
    date: new Date().toISOString(),
    score: score,
    total: total,
    mode: modeTexte,
    joueur: joueurConnecte() || 'Invité'
  });

  const bonnes = resultats.filter(Boolean).length;
  const pourcent = Math.round(score / total * 100);
  const appreciation = pourcent >= 80 ? 'Excellent !' : pourcent >= 50 ? 'Bien joué !' : 'Continuez à réviser !';

  document.getElementById('jeu').replaceChildren(
    el('section', { class: 'result' },
      el('h1', {}, appreciation),
      el('p', { class: 'muted' }, modeTexte + ' · ' + bonnes + ' bonne' + (bonnes > 1 ? 's' : '') + ' réponse' + (bonnes > 1 ? 's' : '') + ' sur ' + questions.length),
      el('p', { class: 'result-score' }, String(score), el('small', {}, ' / ' + total)),
      el('div', { class: 'result-actions' },
        el('a', { class: 'btn', href: location.href }, 'Rejouer'),
        el('a', { class: 'btn ghost', href: 'statistiques.html' }, 'Voir mes statistiques'),
        el('a', { class: 'btn ghost', href: 'reviser.html' }, 'Réviser les questions')))
  );
}
