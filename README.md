# maintenance

Crée une application de gestion de matériel/engins (parc matériel) pour une entreprise de charpente métallique.

## Objectif

Suivre tous les engins de l'entreprise (grues, camions-grues, chariots élévateurs, nacelles, générateurs, véhicules) avec leur état et leur emplacement actuel.

## Catégories d'engins (Types)

Liste de catégories prédéfinies (extensible par l'admin) :

- Grue

- Camion Grue

- Chariot élévateur

- Nacelle à ciseaux

- Générateur

- Voiture double cabine

## Modèle de données — table "materiel"

- id

- nom (ex: "Sany", "Volvo", "Hyster", "Wecan")

- categorie (relation vers la table des catégories ci-dessus)

- capacite (texte libre, ex: "50t", "25t", "06t", "20m", "18m" — tonnage pour grues/chariots, hauteur pour nacelles)

- annee (nombre, ex: 2013, 2020 — optionnel car certains engins n'ont pas d'année connue)

- identifiant_complementaire (texte libre optionnel, pour différencier des doublons — ex: "vieux"/"nouveau", "Bleu"/"Blanc"/"orange"/"jaune", numéro comme "n°14", "n°93")

- etat (enum : "Bon état", "État moyen", "Mauvais état")

- emplacement (texte libre — l'utilisateur écrit où se trouve l'engin actuellement, ex: "Chantier X", "Atelier", "En réparation")

- date_derniere_maj (auto, date de dernière modification)

- notes (texte libre optionnel)

## Fonctionnalités

1. **Liste des engins** : tableau/grille groupé par catégorie, avec filtres par catégorie, état, et recherche par nom.

2. **Ajouter un engin** : formulaire avec tous les champs ci-dessus. La catégorie est un menu déroulant, l'état est un menu déroulant avec badges colorés (vert = Bon état, orange = État moyen, rouge = Mauvais état).

3. **Modifier un engin** : notamment mise à jour rapide de l'état et de l'emplacement (ces deux champs changent le plus souvent).

4. **Supprimer un engin** (avec confirmation).

5. **Vue par catégorie** : chaque catégorie affichée comme une section/carte avec le nombre d'engins et un résumé des états (ex: "8 en bon état, 2 moyen, 1 mauvais").

6. **Historique simple** (optionnel) : quand l'état ou l'emplacement change, garder une trace de l'ancienne valeur et la date du changement.

## Design

Interface claire et professionnelle, adaptée à un usage terrain (tablette/mobile aussi bien que desktop). Badges colorés pour l'état. Icônes différentes par catégorie (grue, camion, chariot, nacelle, générateur, voiture).

## Données initiales à importer

[Colle ici la liste complète de tes engins, catégorie par catégorie — je peux te préparer le fichier CSV/JSON d'import si tu veux]

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://maintenance-ercm.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d1116abe-f0e1-43fd-8853-9ec94e7be57d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
