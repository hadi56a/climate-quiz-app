/* =========================================================
   Page Connexion : vérifie l'identifiant et le mot de passe
   avec le fichier data/utilisateurs.xml.
   Le mot de passe saisi est transformé en empreinte SHA-1
   puis comparé à celle du fichier.
   ⚠️ Démonstration côté navigateur uniquement : une vraie
   application vérifierait le mot de passe sur un serveur.
   ========================================================= */

async function sha1(texte) {
  const octets = new TextEncoder().encode(texte);
  const empreinte = await crypto.subtle.digest('SHA-1', octets);
  return Array.from(new Uint8Array(empreinte)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('form-connexion');
  const message = document.getElementById('message');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const nom = document.getElementById('username').value.trim();
    const motDePasse = document.getElementById('password').value;
    message.className = 'message';

    if (!nom || !motDePasse) {
      message.textContent = 'Entrez votre identifiant et votre mot de passe.';
      message.classList.add('bad');
      return;
    }

    try {
      const xml = await chargerXML(chemin('data/utilisateurs.xml'));
      const empreinte = await sha1(motDePasse);
      const trouve = Array.from(xml.getElementsByTagName('utilisateur')).some(u =>
        u.getElementsByTagName('username')[0].textContent === nom &&
        u.getElementsByTagName('password')[0].textContent === empreinte);

      if (trouve) {
        connecter(nom);
        message.textContent = 'Connexion réussie. Bienvenue ' + nom + ' !';
        message.classList.add('good');
        setTimeout(() => { location.href = lienPage('index.html'); }, 900);
      } else {
        message.textContent = 'Identifiant ou mot de passe incorrect.';
        message.classList.add('bad');
      }
    } catch (err) {
      message.textContent = 'La connexion est impossible pour le moment. Ouvrez le site depuis un serveur (voir README).';
      message.classList.add('bad');
    }
  });
});
