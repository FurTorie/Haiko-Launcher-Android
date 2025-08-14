/**
 * @author Luuxis (adapté pour Android WebView)
 * Version Android du launcher Haiko
 */

// Simuler l'environnement Node.js pour Android
window.process = window.process || { platform: 'android' };

// Attendre que le bridge Android soit prêt
function waitForBridge() {
    return new Promise((resolve) => {
        if (window.AndroidBridge) {
            resolve();
        } else {
            setTimeout(() => waitForBridge().then(resolve), 100);
        }
    });
}

// Version simplifiée des modules pour Android
class AndroidLogger {
    constructor(name, color) {
        this.name = name;
        this.color = color;
    }
    
    log(level, message) {
        console.log(`[${this.name}] ${level}: ${message}`);
    }
}

class AndroidDatabase {
    constructor() {
        this.data = {};
        this.loadFromStorage();
    }
    
    loadFromStorage() {
        const stored = localStorage.getItem('haiko_launcher_db');
        if (stored) {
            try {
                this.data = JSON.parse(stored);
            } catch (e) {
                console.error('Erreur chargement DB:', e);
            }
        }
    }
    
    save() {
        localStorage.setItem('haiko_launcher_db', JSON.stringify(this.data));
    }
    
    get(key) {
        return this.data[key];
    }
    
    set(key, value) {
        this.data[key] = value;
        this.save();
    }
}

class AndroidConfig {
    static async GetConfig() {
        // Configuration locale pour le mode offline
        return {
            launcher: {
                name: "Haiko Launcher Mobile",
                version: "1.0.0"
            },
            game: {
                versions: []
            },
            error: false
        };
    }
}

// Utilitaires Android
const AndroidUtils = {
    logger: AndroidLogger,
    database: AndroidDatabase,
    config: AndroidConfig,
    
    changePanel: function(panelName) {
        console.log('Changement panneau:', panelName);
        const panels = document.querySelector('.panels');
        if (panels) {
            // Charger le panneau HTML correspondant
            AndroidUtils.loadPanel(panelName);
        }
    },
    
    loadPanel: function(panelName) {
        const panels = document.querySelector('.panels');
        if (!panels) return;
        
        // Créer un élément pour charger le HTML du panneau
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.backgroundColor = 'transparent';
        iframe.src = `panels/${panelName}.html`;
        
        // Vider et ajouter le nouveau panneau
        panels.innerHTML = '';
        panels.appendChild(iframe);
        
        console.log(`Panneau ${panelName} chargé`);
    },
    
    popup: function(title, content, options) {
        const popup = document.querySelector('.popup');
        if (popup) {
            popup.querySelector('.popup-title').textContent = title;
            popup.querySelector('.popup-content').textContent = content;
            popup.style.display = 'block';
        }
    },
    
    setBackground: async function() {
        // Définir un fond par défaut pour Android
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    },
    
    accountSelect: function() {
        console.log('Sélection compte Android');
    },
    
    addAccount: function() {
        console.log('Ajout compte Android');
    },
    
    pkg: {
        name: "haiko-launcher-android",
        version: "1.0.0"
    }
};

class AndroidLauncher {
    async init() {
        console.log('Initialisation Haiko Launcher Android...');
        
        // Attendre que le bridge soit prêt
        await waitForBridge();
        
        this.initLog();
        this.setupAndroidSpecific();
        await AndroidUtils.setBackground();
        
        this.db = new AndroidDatabase();
        
        // Configuration locale
        this.config = await AndroidConfig.GetConfig();
        
        this.initInterface();
        this.startLauncher();
    }
    
    initLog() {
        this.logger = new AndroidLogger('HaikoLauncher', '#7289da');
        console.log('Logger Android initialisé');
    }
    
    setupAndroidSpecific() {
        // Désactiver les raccourcis clavier desktop
        document.addEventListener('keydown', (e) => {
            // Les raccourcis clavier ne sont pas pertinents sur mobile
        });
        
        // Gérer le bouton retour Android via le bridge
        document.addEventListener('backbutton', () => {
            if (window.AndroidBridge) {
                window.AndroidBridge.sendIpcMessage('main-window-close', '{}');
            }
        });
    }
    
    initInterface() {
        console.log('Initialisation interface Haiko...');
        
        // Créer l'interface de base
        const panels = document.querySelector('.panels');
        if (panels) {
            panels.innerHTML = `
                <div class="android-launcher-panel">
                    <h1>Haiko Launcher Mobile</h1>
                    <p>Interface en cours de développement...</p>
                    <div class="panel-buttons">
                        <button onclick="androidLauncher.showLogin()">Connexion</button>
                        <button onclick="androidLauncher.showHome()">Accueil</button>
                        <button onclick="androidLauncher.showSettings()">Paramètres</button>
                    </div>
                </div>
            `;
        }
        
        // Masquer les boutons de fenêtre (non pertinents sur Android)
        const frame = document.querySelector('.frame');
        if (frame) {
            frame.style.display = 'none';
        }
        
        // Masquer la dragbar
        const dragbar = document.querySelector('.dragbar');
        if (dragbar) {
            dragbar.style.display = 'none';
        }
    }
    
    showLogin() {
        AndroidUtils.loadPanel('login');
        console.log('Affichage panneau connexion');
    }
    
    showHome() {
        AndroidUtils.loadPanel('home');
        console.log('Affichage panneau accueil');
    }
    
    showSettings() {
        AndroidUtils.loadPanel('settings');
        console.log('Affichage panneau paramètres');
    }
    
    startLauncher() {
        console.log('Haiko Launcher Android démarré avec succès!');
        this.logger.log('INFO', 'Launcher prêt pour Android');
    }
    
    errorConnect() {
        AndroidUtils.popup('Erreur', 'Erreur de connexion', ['OK']);
    }
}

// Initialiser le launcher Android
const androidLauncher = new AndroidLauncher();

// Démarrer quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    androidLauncher.init().catch(error => {
        console.error('Erreur initialisation launcher:', error);
    });
});

// Exporter pour accès global
window.androidLauncher = androidLauncher;