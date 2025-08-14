# CLAUDE.md

Ce fichier fournit des conseils à Claude Code (claude.ai/code) lors du travail avec le code de ce dépôt.

## Vue d'ensemble du projet

Fold Craft Launcher (FCL) est un lanceur Minecraft Java Edition pour les plateformes Android. Construit sur les fonctionnalités principales d'HMCL et intégrant les backends PojavLauncher et Boat, il permet de jouer à Minecraft Java Edition sur les appareils mobiles avec le support des mods pour toutes les versions.

## Système de compilation

Le projet utilise Gradle avec Kotlin DSL pour la configuration de compilation :
- `./gradlew assembleDebug` - Compiler l'APK de débogage
- `./gradlew assembleRelease` - Compiler l'APK de release (nécessite la configuration de signature)
- `./gradlew assembleFordebug` - Compiler la variante de débogage avec suffixe debug
- `./gradlew clean` - Nettoyer les artefacts de compilation
- `./gradlew updateMap` - Mettre à jour le fichier de mapping des versions

Le projet supporte les compilations spécifiques à l'architecture en utilisant la propriété système `arch` :
- `./gradlew assembleDebug -Darch=arm64` - Compiler uniquement pour arm64
- `./gradlew assembleDebug -Darch=arm` - Compiler uniquement pour armeabi-v7a
- `./gradlew assembleDebug -Darch=x86_64` - Compiler uniquement pour x86_64

## Architecture des modules

Le projet est organisé en plusieurs modules :

### FCL (Module d'application principal)
- **Objectif** : Application de lanceur principal avec UI et fonctionnalités principales
- **Emplacement** : `FCL/`
- **Composants clés** :
  - Activities : `SplashActivity`, `MainActivity`, `JVMActivity` (exécute Minecraft dans un processus séparé)
  - Gestion UI : `UIManager` gère la navigation entre les différents écrans UI
  - Modules UI : `MainUI`, `AccountUI`, `VersionUI`, `ManageUI`, `DownloadUI`, `ControllerUI`, `SettingUI`

### FCLCore
- **Objectif** : Logique principale du lanceur Minecraft (basée sur HMCL)
- **Emplacement** : `FCLCore/`
- **Fonctionnalités clés** : Gestion des versions, chargement des mods, authentification, services de téléchargement

### FCLLibrary  
- **Objectif** : Composants UI partagés et utilitaires
- **Emplacement** : `FCLLibrary/`
- **Fonctionnalités clés** : Composants UI communs, navigateur de fichiers, rapport de crash

### FCLauncher
- **Objectif** : Backend de lanceur natif avec intégration JNI
- **Emplacement** : `FCLauncher/`
- **Fonctionnalités clés** : Code C/C++ natif pour le rendu OpenGL/Vulkan, intégration GLFW
- **Compilation native** : Utilise NDK avec le système de compilation `Android.mk`

### Modules LWJGL
- **LWJGL-Boat** : Implémentation LWJGL pour le rendu Boat
- **LWJGL-Pojav** : Implémentation LWJGL pour le backend PojavLauncher

### ZipFileSystem
- **Objectif** : Fournisseur de système de fichiers ZIP personnalisé pour le runtime Java

## Modèles d'architecture clés

### Gestion de l'interface utilisateur
L'application utilise une architecture à activité unique avec gestion UI personnalisée :
- Le singleton `UIManager` gère tous les écrans UI
- Chaque UI étend `FCLBaseUI` avec initialisation paresseuse
- Navigation gérée via `UIManager.switchUI()`

### Architecture multi-processus  
- Le lanceur principal s'exécute dans le processus par défaut
- L'exécution de Minecraft s'exécute dans le processus `:jvm` via `JVMActivity`
- Le rapport de crash isolé dans le processus `:crash`
- Le service de téléchargement s'exécute dans le processus `:processService`

### Intégration native
- Pont JNI dans le module `FCLauncher` pour le rendu OpenGL/Vulkan
- Bibliothèques natives pour différentes architectures (arm, arm64, x86, x86_64)
- Multiples backends de rendu : gl4es, VirGL, Zink, ANGLE

## Configuration de compilation

### Gestion des versions
- Info de version définie dans `FCL/build.gradle.kts`
- Actuel : versionCode 1245, versionName "1.2.4.5"
- `version_map.json` suit l'historique des versions pour les mises à jour

### Signature
- Les compilations release utilisent `key-store.jks` (nécessite FCL_KEYSTORE_PASSWORD)
- Les compilations debug utilisent `debug-key.jks` avec identifiants codés en dur
- Clés API configurées via variables d'environnement ou `local.properties`

### Plateforme cible
- compileSdk : 35
- minSdk : 26 (Android 8.0)
- targetSdk : 34
- Kotlin : 2.0.21, Java : 11

## Notes de développement

### Développement natif
- Version NDK 27.0.12077973 requise pour le module FCLauncher
- Code natif situé dans `FCLauncher/src/main/jni/`
- Multiples implémentations de rendu dans des sous-répertoires séparés

### Assets d'exécution
- Runtimes Java (JRE 8/11/17/21) inclus dans `FCL/src/main/assets/app_runtime/`
- Bibliothèques LWJGL et graphiques incluses pour différentes architectures
- Assets et configurations spécifiques au jeu dans `assets/game/`

### Internationalisation
- Support multi-langue avec ressources de chaînes dans les répertoires `values-*`
- Langues supportées : Anglais, Chinois (Simplifié/Traditionnel), Allemand, Russe, Ukrainien, Portugais (Brésil), Persan

## Intégration Haiko Launcher

### Interface Web Hybride
Le projet inclut une intégration de l'interface web de Haiko-Launcher via WebView Android :
- **HaikoWebActivity** : Activity dédiée hébergeant l'interface web dans une WebView
- **Assets Haiko** : Interface web complète copiée dans `FCL/src/main/assets/haiko/`
- **Bridge JavaScript-Android** : `HaikoJavaScriptInterface` remplace les fonctionnalités Electron

### Architecture de Bridge
- **Remplacement modules Node.js** : Les modules `electron`, `fs`, `minecraft-java-core` sont simulés
- **Communication IPC** : Messages Electron convertis en appels de méthodes Android
- **Stockage local** : LocalStorage WebView utilisé pour la persistance des données
- **Mode hors ligne** : Interface fonctionnelle sans connexion internet

### Lancement de Haiko
- Méthode `MainActivity.launchHaikoInterface()` pour démarrer l'interface web
- L'interface Haiko offre une expérience launcher moderne avec panneaux (Login, Home, Settings)
- Compatible avec l'architecture multi-processus existante de FCL