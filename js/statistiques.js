/* =========================================================
   Page Statistiques : résumé, histogramme dessiné sur un
   <canvas> et historique des parties
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  afficherTout();
  document.getElementById('effacer').addEventListener('click', function () {
    if (confirm('Effacer tout l’historique des parties ?')) {
      effacerScores();
      afficherTout();
    }
  });
  window.addEventListener('resize', () => dessinerHistogramme(lireScores()));
});

function afficherTout() {
  const scores = lireScores();
  const vide = scores.length === 0;
  document.getElementById('vide').hidden = !vide;
  document.getElementById('contenu').hidden = vide;
  if (vide) return;

  // chiffres clés (en pourcentage, car le total peut varier selon la partie)
  const pourcents = scores.map(s => Math.round(s.score / s.total * 100));
  const meilleur = Math.max(...pourcents);
  const moyenne = Math.round(pourcents.reduce((a, b) => a + b, 0) / pourcents.length);
  document.getElementById('kpi-parties').textContent = scores.length;
  document.getElementById('kpi-meilleur').textContent = meilleur + ' %';
  document.getElementById('kpi-moyenne').textContent = moyenne + ' %';

  // tableau, de la partie la plus récente à la plus ancienne
  const format = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  document.getElementById('historique').replaceChildren(
    ...scores.map((s, i) => el('tr', {},
      el('td', {}, String(i + 1)),
      el('td', {}, format.format(new Date(s.date))),
      el('td', {}, s.mode),
      el('td', {}, s.joueur),
      el('td', { class: 'num' }, s.score + ' / ' + s.total))).reverse()
  );

  dessinerHistogramme(scores);
}

function dessinerHistogramme(scores) {
  const canvas = document.getElementById('graphique');
  if (!canvas || scores.length === 0) return;

  // on adapte la résolution à l'écran pour un dessin net
  const largeur = canvas.clientWidth;
  const hauteur = canvas.clientHeight;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = largeur * ratio;
  canvas.height = hauteur * ratio;
  const ctx = canvas.getContext('2d');
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, largeur, hauteur);

  const derniers = scores.slice(-15);      // les 15 dernières parties
  const marge = { haut: 16, droite: 8, bas: 28, gauche: 40 };
  const zoneL = largeur - marge.gauche - marge.droite;
  const zoneH = hauteur - marge.haut - marge.bas;

  // lignes horizontales : 0 %, 25 %, 50 %, 75 %, 100 %
  ctx.font = '12px Atkinson Hyperlegible, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let p = 0; p <= 100; p += 25) {
    const y = marge.haut + zoneH - (p / 100) * zoneH;
    ctx.strokeStyle = p === 0 ? '#12202f' : '#dfe4ea';
    ctx.beginPath();
    ctx.moveTo(marge.gauche, y);
    ctx.lineTo(largeur - marge.droite, y);
    ctx.stroke();
    ctx.fillStyle = '#566476';
    ctx.fillText(p + ' %', marge.gauche - 6, y);
  }

  // une barre par partie, colorée selon le résultat
  const pas = zoneL / derniers.length;
  const largeurBarre = Math.min(40, pas * 0.6);
  ctx.textAlign = 'center';
  derniers.forEach(function (s, i) {
    const pourcent = s.score / s.total * 100;
    const h = (pourcent / 100) * zoneH;
    const x = marge.gauche + pas * i + (pas - largeurBarre) / 2;
    const y = marge.haut + zoneH - h;
    ctx.fillStyle = pourcent >= 80 ? '#1a7f37' : pourcent >= 50 ? '#0b6e69' : '#c62828';
    ctx.fillRect(x, y, largeurBarre, Math.max(h, 2));
    ctx.fillStyle = '#566476';
    ctx.textBaseline = 'top';
    ctx.fillText(String(scores.length - derniers.length + i + 1), x + largeurBarre / 2, marge.haut + zoneH + 8);
  });
}
