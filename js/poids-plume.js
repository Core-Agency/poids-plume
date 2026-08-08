/* ==========================================================================
   POIDS PLUME
   --------------------------------------------------------------------------
   Redimensionne et réencode des images, entièrement dans le navigateur.
   Aucune dépendance, aucune requête réseau : `createImageBitmap` décode,
   un canevas redessine, `toBlob` réencode. Les fichiers ne sortent jamais
   de la machine.
   ========================================================================== */

(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const images = [];   // { fichier, source, resultat, url, dims }

  /* --------------------------------------------------------------------
     OUTILS
     -------------------------------------------------------------------- */

  function poids(octets) {
    if (octets < 1024) return octets + ' o';
    if (octets < 1024 * 1024) return (octets / 1024).toFixed(0) + ' Ko';
    return (octets / (1024 * 1024)).toFixed(2) + ' Mo';
  }

  function extension(type) {
    return { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' }[type] || 'img';
  }

  function renommer(nom, type) {
    return nom.replace(/\.[^.]+$/, '') + '.' + extension(type);
  }

  /* --------------------------------------------------------------------
     LE TRAITEMENT
     --------------------------------------------------------------------
     ⚠️ `imageOrientation: 'from-image'` n'est pas un détail : sans lui, une
     photo prise au téléphone en mode portrait ressort couchée. L'orientation
     vit dans les métadonnées EXIF, que le canevas ignore par défaut.
     -------------------------------------------------------------------- */

  async function traiter(entree) {
    const type = $('#format').value;
    const largeurMax = parseInt($('#largeur').value, 10);
    /* Le PNG est sans perte : `toBlob` ignore le paramètre de qualité.
       On ne le transmet donc pas, plutôt que de laisser croire qu'il agit. */
    const qualite = type === 'image/png' ? undefined : parseInt($('#qualite').value, 10) / 100;

    const bitmap = await createImageBitmap(entree.fichier, { imageOrientation: 'from-image' });

    /* On ne grandit JAMAIS une image : agrandir n'ajoute aucun détail et
       ne fait qu'alourdir le fichier. */
    const echelle = Math.min(1, largeurMax / bitmap.width);
    const l = Math.round(bitmap.width * echelle);
    const h = Math.round(bitmap.height * echelle);

    const canevas = document.createElement('canvas');
    canevas.width = l;
    canevas.height = h;
    const ctx = canevas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';

    /* Un JPEG n'a pas de canal alpha : sans fond blanc, les zones
       transparentes d'un PNG d'origine ressortent en noir. */
    if (type === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, l, h);
    }

    ctx.drawImage(bitmap, 0, 0, l, h);
    bitmap.close();

    const blob = await new Promise((res) => canevas.toBlob(res, type, qualite));

    if (entree.url) URL.revokeObjectURL(entree.url);
    entree.resultat = blob;
    entree.url = URL.createObjectURL(blob);
    entree.dims = { l, h };
    entree.type = type;
  }

  /* --------------------------------------------------------------------
     LE RENDU
     -------------------------------------------------------------------- */

  function dessiner() {
    const grille = $('#grille');
    grille.innerHTML = '';

    images.forEach((im, index) => {
      const avant = im.fichier.size;
      const apres = im.resultat ? im.resultat.size : 0;
      const gain = avant > 0 ? Math.round((1 - apres / avant) * 100) : 0;

      const carte = document.createElement('article');
      carte.className = 'carte';

      const vue = document.createElement('div');
      vue.className = 'carte__vue';
      const img = document.createElement('img');
      img.src = im.url;
      img.alt = 'Aperçu de ' + im.fichier.name;
      img.loading = 'lazy';
      vue.appendChild(img);

      const corps = document.createElement('div');
      corps.className = 'carte__corps';

      const nom = document.createElement('p');
      nom.className = 'carte__nom';
      nom.textContent = renommer(im.fichier.name, im.type);

      const mesures = document.createElement('p');
      mesures.className = 'carte__mesures';
      const del = document.createElement('del');
      del.textContent = poids(avant);
      const fleche = document.createElement('span');
      fleche.textContent = '→';
      const ins = document.createElement('ins');
      ins.textContent = poids(apres);
      mesures.append(del, fleche, ins);

      const etiquette = document.createElement('span');
      /* Un « gain » négatif arrive vraiment : réencoder un PNG déjà optimisé
         en PNG l'alourdit souvent. Le dire est plus utile que l'afficher
         en vert comme si c'était une victoire. */
      etiquette.className = 'carte__gain' + (gain <= 0 ? ' carte__gain--nul' : '');
      etiquette.textContent = gain > 0
        ? '− ' + gain + ' %'
        : 'aucun gain — essayez le WebP';

      const dim = document.createElement('p');
      dim.className = 'carte__dim';
      dim.textContent = im.dims ? im.dims.l + ' × ' + im.dims.h + ' px' : '';

      const actions = document.createElement('div');
      actions.className = 'carte__actions';

      const bTelecharger = document.createElement('button');
      bTelecharger.className = 'bouton bouton--plein';
      bTelecharger.type = 'button';
      bTelecharger.textContent = 'Télécharger';
      bTelecharger.addEventListener('click', () => telecharger(im));

      const bRetirer = document.createElement('button');
      bRetirer.className = 'bouton bouton--discret';
      bRetirer.type = 'button';
      bRetirer.textContent = 'Retirer';
      bRetirer.addEventListener('click', () => {
        URL.revokeObjectURL(im.url);
        images.splice(index, 1);
        dessiner();
      });

      actions.append(bTelecharger, bRetirer);
      corps.append(nom, mesures, etiquette, dim, actions);
      carte.append(vue, corps);
      grille.appendChild(carte);
    });

    /* Le bilan global */
    const avant = images.reduce((s, i) => s + i.fichier.size, 0);
    const apres = images.reduce((s, i) => s + (i.resultat ? i.resultat.size : 0), 0);
    const gain = avant > 0 ? Math.round((1 - apres / avant) * 100) : 0;

    $('#bilan').hidden = images.length === 0;
    $('#vide').hidden = images.length > 0;
    $('#bGain').textContent = gain > 0 ? gain + ' %' : '0 %';
    $('#bAvant').textContent = poids(avant);
    $('#bApres').textContent = poids(apres);
    $('#bNombre').textContent = String(images.length);
  }

  function telecharger(im) {
    const a = document.createElement('a');
    a.href = im.url;
    a.download = renommer(im.fichier.name, im.type);
    a.click();
  }

  /* --------------------------------------------------------------------
     LES ENTREES
     -------------------------------------------------------------------- */

  async function accueillir(liste) {
    const fichiers = [...liste].filter((f) => f.type.startsWith('image/'));
    if (!fichiers.length) return;

    for (const fichier of fichiers) {
      const entree = { fichier };
      try {
        await traiter(entree);
        images.push(entree);
      } catch (e) {
        /* Format exotique, fichier corrompu, image trop grande pour la
           mémoire : on saute celle-là et on continue les autres plutôt que
           d'interrompre tout le lot. */
        console.warn('Image ignorée :', fichier.name, e);
      }
      dessiner();
    }
  }

  async function retraiterTout() {
    for (const im of images) {
      try { await traiter(im); } catch (e) { /* déjà signalé au dépôt */ }
    }
    dessiner();
  }

  /* --------------------------------------------------------------------
     BRANCHEMENTS
     -------------------------------------------------------------------- */

  const depot = $('#depot');

  ['dragenter', 'dragover'].forEach((ev) =>
    depot.addEventListener(ev, (e) => { e.preventDefault(); depot.classList.add('survol'); }));

  ['dragleave', 'drop'].forEach((ev) =>
    depot.addEventListener(ev, (e) => { e.preventDefault(); depot.classList.remove('survol'); }));

  depot.addEventListener('drop', (e) => accueillir(e.dataTransfer.files));
  depot.addEventListener('click', () => $('#fichiers').click());
  $('#parcourir').addEventListener('click', (e) => { e.stopPropagation(); $('#fichiers').click(); });
  $('#fichiers').addEventListener('change', (e) => { accueillir(e.target.files); e.target.value = ''; });

  /* Les réglages : on affiche la valeur pendant le glissement, mais on ne
     réencode qu'au relâchement. Retraiter à chaque pixel de curseur ferait
     ramer la page sur un lot de photos. */
  $('#largeur').addEventListener('input', () => {
    $('#valLargeur').textContent = $('#largeur').value + ' px';
  });
  $('#qualite').addEventListener('input', () => {
    $('#valQualite').textContent = $('#qualite').value + ' %';
  });
  ['change'].forEach((ev) => {
    $('#largeur').addEventListener(ev, retraiterTout);
    $('#qualite').addEventListener(ev, retraiterTout);
  });

  $('#format').addEventListener('change', () => {
    const type = $('#format').value;
    $('#blocQualite').hidden = type === 'image/png';
    $('#aideFormat').textContent = {
      'image/webp': 'Reconnu par tous les navigateurs depuis 2020.',
      'image/jpeg': 'Aucune transparence : le fond devient blanc.',
      'image/png': 'Sans perte : la qualité ne s\'applique pas.',
    }[type];
    retraiterTout();
  });

  /* Sans bibliothèque d'archive, on enchaîne les téléchargements. Un délai
     est nécessaire : déclenchés d'un coup, les navigateurs n'en gardent
     qu'un seul. */
  $('#toutTelecharger').addEventListener('click', () => {
    images.forEach((im, i) => setTimeout(() => telecharger(im), i * 350));
  });

  dessiner();
})();
