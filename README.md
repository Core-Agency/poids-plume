<div align="center">

<img src="img/core-mark-192.png" width="72" height="72" alt="Marque de Core">

# Core — Compression IMG

**Un outil [Core](https://core-agency.be), agence digitale à Charleroi**

**Alléger ses images pour le web, sans rien téléverser.**

Redimensionne et convertit vos images en WebP, JPEG ou PNG directement dans
le navigateur. Trois fichiers, aucune dépendance, aucune requête réseau.

[![Essayer](https://img.shields.io/badge/Essayer%20maintenant-6355E0?style=for-the-badge&logoColor=white)](https://core-agency.github.io/core-compression-img/)

![Licence](https://img.shields.io/badge/licence-MIT-1A1A1A?style=for-the-badge&labelColor=1A1A1A)
![Dépendances](https://img.shields.io/badge/dépendances-aucune-1A1A1A?style=for-the-badge&labelColor=1A1A1A)
![Hors ligne](https://img.shields.io/badge/fonctionne%20hors%20ligne-oui-1A1A1A?style=for-the-badge&labelColor=1A1A1A)

**[core-agency.github.io/core-compression-img](https://core-agency.github.io/core-compression-img/)**

</div>

---

## Pourquoi

Les photos qu'un client envoie pour son site pèsent 4 Mo pièce et font
3 000 pixels de large. Affichées dans une carte de 400 pixels, elles coûtent
des secondes de chargement pour rien.

Les convertisseurs en ligne demandent de téléverser ces photos sur un serveur
inconnu, en imposent dix par jour, et posent un filigrane. Pour une opération
que le navigateur sait faire seul, c'est absurde.

Celui-ci ne téléverse rien. `createImageBitmap` décode, un canevas redessine à
la bonne taille, `toBlob` réencode. **Ouvrez l'onglet « Réseau » de vos outils
de développement : il restera vide.**

## Ce qu'il fait

- Glisser-déposer, plusieurs images à la fois
- Sortie **WebP**, **JPEG** ou **PNG**
- Largeur maximale réglable — les images plus étroites ne sont jamais agrandies
- Qualité réglable, avec aperçu du poids obtenu
- Poids avant / après et pourcentage gagné, par image et sur le lot
- Téléchargement à l'unité ou en série

## Détails qui comptent

**L'orientation EXIF.** `createImageBitmap` est appelé avec
`imageOrientation: 'from-image'`. Sans ce réglage, une photo prise au
téléphone en mode portrait ressort couchée : l'orientation vit dans les
métadonnées, que le canevas ignore par défaut.

**Le fond des JPEG.** Un JPEG n'a pas de canal alpha. Sans fond blanc dessiné
avant l'image, les zones transparentes d'un PNG d'origine ressortent en noir.

**Le PNG et la qualité.** Le PNG est un format sans perte : `toBlob` ignore le
paramètre de qualité. Le curseur disparaît donc quand on choisit PNG, plutôt
que de laisser croire qu'il agit.

**Les gains négatifs.** Réencoder un PNG déjà optimisé en PNG l'alourdit
souvent. L'outil l'affiche en jaune et suggère le WebP, au lieu de présenter
une perte comme une victoire.

**Pas d'agrandissement.** Agrandir n'ajoute aucun détail et ne fait
qu'alourdir le fichier. L'échelle est plafonnée à 1.

**Pas d'archive ZIP.** « Tout télécharger » enchaîne les téléchargements avec
un délai. Produire un ZIP demanderait une bibliothèque, et la promesse « zéro
dépendance » vaut mieux qu'un bouton légèrement plus commode.

## Quel format choisir

| | |
|---|---|
| **WebP** | Le bon choix par défaut. 25 à 35 % plus léger qu'un JPEG à qualité comparable, reconnu par tous les navigateurs depuis 2020. |
| **JPEG** | Quand un très vieux logiciel doit lire le fichier. Pas de transparence. |
| **PNG** | Seulement s'il faut de la transparence sans perte : logos, captures d'écran à plat. Pour une photo, il sera toujours plus lourd. |

Pour la qualité : entre **75 et 85**, l'œil ne voit plus la différence sur une
photo. En dessous de 60, les aplats se marbrent.

## Utiliser

Téléchargez le dossier et ouvrez `index.html`. C'est tout.

Aucune compilation, aucun gestionnaire de paquets. Pour le mettre en ligne,
n'importe quel hébergement statique fait l'affaire.

## Limites

Le traitement se fait sur le fil principal : un lot de cinquante photos de
12 Mo fera patienter la page. C'est un outil d'appoint, pas une chaîne de
production. Les très grandes images peuvent aussi dépasser la mémoire
disponible du canevas — l'image est alors ignorée et les autres continuent.

Pas d'AVIF en sortie : `toBlob` ne l'encode pas dans les navigateurs actuels.

## Structure

```
index.html               la page
css/poids-plume.css      papier clair, un seul accent
js/poids-plume.js        décodage, redimensionnement, réencodage
```

## Licence

MIT — voir [LICENSE](LICENSE).

---

<div align="center">

Construit par [Core](https://core-agency.be), agence digitale à Charleroi.

</div>
