/* =========================================================
   Fonctions communes à toutes les pages
   ========================================================= */

const THEMES = { climat: 'Climat', energie: 'Énergie', gaz: 'Gaz à effet de serre' };
const NIVEAUX = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };
const CLE_SCORES = 'climatquiz.scores';
const CLE_JOUEUR = 'climatquiz.joueur';

/* Les pages sont dans le dossier page/, sauf index.html à la racine.
   Ces deux fonctions donnent le bon chemin quel que soit l'endroit. */
const DANS_PAGE = location.pathname.includes('/page/');
function chemin(fichier) {            // fichier à la racine : data/…, images/…
  return (DANS_PAGE ? '../' : '') + fichier;
}
function lienPage(nom) {              // 'index.html' ou une page du dossier page/
  if (nom === 'index.html') return DANS_PAGE ? '../index.html' : 'index.html';
  return DANS_PAGE ? nom : 'page/' + nom;
}

/* Charge un fichier XML et renvoie le document */
async function chargerXML(cheminFichier) {
  const reponse = await fetch(cheminFichier);
  if (!reponse.ok) throw new Error('Impossible de charger ' + cheminFichier);
  const texte = await reponse.text();
  return new DOMParser().parseFromString(texte, 'application/xml');
}

/* Transforme data/questions.xml en tableau d'objets JavaScript */
async function chargerQuestions() {
  const xml = await chargerXML(chemin('data/questions.xml'));
  const lire = (q, balise) => (q.getElementsByTagName(balise)[0]?.textContent || '').trim();

  return Array.from(xml.getElementsByTagName('question')).map(function (q) {
    return {
      id: Number(lire(q, 'id')),
      image: chemin(lire(q, 'image')),
      texte: lire(q, 'contenu'),
      reponses: [lire(q, 'response1'), lire(q, 'response2'), lire(q, 'response3'), lire(q, 'response4')],
      bonne: Number(lire(q, 'bonne_reponse')),          // de 1 à 4
      points: Number(lire(q, 'point')),
      theme: lire(q, 'thematique'),
      niveau: lire(q, 'niveau'),
      lot: Number(lire(q, 'lot')),
      explication: lire(q, 'explication')
    };
  });
}

/* Crée un élément HTML (sans innerHTML, donc sans risque d'injection) */
function el(balise, attributs, ...enfants) {
  const e = document.createElement(balise);
  Object.entries(attributs || {}).forEach(function ([cle, valeur]) {
    if (cle === 'class') e.className = valeur;
    else if (cle.startsWith('on')) e.addEventListener(cle.slice(2), valeur);
    else e.setAttribute(cle, valeur);
  });
  enfants.flat().forEach(function (enfant) {
    if (enfant === null || enfant === undefined || enfant === false) return;
    e.append(enfant instanceof Node ? enfant : document.createTextNode(String(enfant)));
  });
  return e;
}

/* Recherche sans tenir compte des majuscules ni des accents */
function normaliser(texte) {
  return texte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/* ---------- Historique des scores (stocké dans le navigateur) ---------- */
function lireScores() {
  try { return JSON.parse(localStorage.getItem(CLE_SCORES)) || []; }
  catch (e) { return []; }
}
function ajouterScore(score) {
  const scores = lireScores();
  scores.push(score);
  try { localStorage.setItem(CLE_SCORES, JSON.stringify(scores)); } catch (e) { /* stockage indisponible */ }
}
function effacerScores() {
  try { localStorage.removeItem(CLE_SCORES); } catch (e) { /* rien */ }
}

/* ---------- Joueur connecté ---------- */
function joueurConnecte() {
  try { return localStorage.getItem(CLE_JOUEUR); } catch (e) { return null; }
}
function connecter(nom) {
  try { localStorage.setItem(CLE_JOUEUR, nom); } catch (e) { /* rien */ }
}
function deconnecter() {
  try { localStorage.removeItem(CLE_JOUEUR); } catch (e) { /* rien */ }
}

/* Affiche « Connecté : nom » dans l'en-tête */
function afficherJoueur() {
  const zone = document.getElementById('user-zone');
  if (!zone) return;
  const nom = joueurConnecte();
  zone.replaceChildren();
  if (nom) {
    zone.append(
      el('span', { class: 'user-chip' }, 'Connecté : ', el('strong', {}, nom),
        el('button', { type: 'button', onclick: function () { deconnecter(); location.reload(); } }, 'Se déconnecter'))
    );
  } else {
    const actuel = location.pathname.endsWith('connexion.html');
    zone.append(el('a', { href: lienPage('connexion.html'), ...(actuel ? { 'aria-current': 'page' } : {}) }, 'Connexion'));
  }
}

document.addEventListener('DOMContentLoaded', afficherJoueur);
