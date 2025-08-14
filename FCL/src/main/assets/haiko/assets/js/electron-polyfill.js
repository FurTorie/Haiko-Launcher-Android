/**
 * Polyfill Electron APIs pour Android WebView
 * Permet d'utiliser les scripts Haiko originaux
 */

// Mock require() function
window.require = function(module) {
    switch(module) {
        case 'electron':
            return {
                shell: {
                    openExternal: (url) => {
                        if (window.AndroidBridge) {
                            window.AndroidBridge.openUrl(url);
                        } else {
                            window.open(url, '_blank');
                        }
                    }
                },
                ipcRenderer: {
                    invoke: async (channel, ...args) => {
                        switch(channel) {
                            case 'is-dark-theme':
                                return true; // Toujours dark mode
                            case 'get-instances':
                                return await AndroidInstances.getInstances();
                            case 'get-accounts':
                                return await AndroidAccounts.getAccounts();
                            default:
                                return null;
                        }
                    },
                    on: (channel, callback) => {
                        // Stocker les listeners pour plus tard
                        window.electronListeners = window.electronListeners || {};
                        window.electronListeners[channel] = callback;
                    }
                }
            };
            
        case 'minecraft-java-core':
            return {
                Launch: AndroidMinecraft,
                Status: AndroidStatus
            };
            
        case 'fs':
            return AndroidFS;
            
        default:
            return {};
    }
};

// Mock Android Instances Manager
class AndroidInstances {
    static instances = [
        {
            name: 'Accueil',
            uuid: 'home-instance',
            version: '1.20.1',
            loadder: {
                loadder_type: 'vanilla',
                loadder_version: '1.20.1',
                minecraft_version: '1.20.1'
            },
            url: 'https://launcher.mojang.com',
            verify: false,
            ignored: [],
            whitelistActive: false,
            whitelist: [],
            isWelcome: true,
            logo: '../assets/images/icon.png',
            status: {
                ip: 'localhost',
                port: 25565
            }
        },
        {
            name: 'Minecraft Vanilla',
            uuid: 'vanilla-instance',
            version: '1.20.1',
            loadder: {
                loadder_type: 'vanilla',
                loadder_version: '1.20.1',
                minecraft_version: '1.20.1'
            },
            url: 'https://launcher.mojang.com',
            verify: false,
            ignored: [],
            whitelistActive: false,
            whitelist: [],
            isWelcome: false,
            logo: '../assets/images/icon.png',
            status: {
                ip: 'minecraft.net',
                port: 25565
            }
        },
        {
            name: 'Modded 1.16.5',
            uuid: 'modded-instance',
            version: '1.16.5',
            loadder: {
                loadder_type: 'forge',
                loadder_version: '36.2.34',
                minecraft_version: '1.16.5'
            },
            url: 'https://launcher.mojang.com',
            verify: false,
            ignored: [],
            whitelistActive: false,
            whitelist: [],
            isWelcome: false,
            logo: '../assets/images/icon.png',
            status: {
                ip: 'modded.server.com',
                port: 25565
            }
        }
    ];
    
    static async getInstances() {
        return this.instances;
    }
    
    static async selectInstance(uuid) {
        this.instances.forEach(inst => inst.selected = false);
        const instance = this.instances.find(inst => inst.uuid === uuid);
        if (instance) {
            instance.selected = true;
        }
        return instance;
    }
}

// Mock Android Accounts Manager
class AndroidAccounts {
    static accounts = [];
    
    static async getAccounts() {
        return this.accounts;
    }
    
    static async addAccount(account) {
        this.accounts.push(account);
        return account;
    }
    
    static async removeAccount(uuid) {
        this.accounts = this.accounts.filter(acc => acc.uuid !== uuid);
    }
}

// Mock Android Minecraft Launcher
class AndroidMinecraft {
    constructor() {
        this.eventListeners = {};
    }
    
    async Launch(options) {
        console.log('Lancement Minecraft avec options:', options);
        
        // Émuler le processus de lancement avec événements
        this.emit('extract', { message: 'Extraction en cours...' });
        
        // Simulation du téléchargement
        setTimeout(() => {
            for (let i = 0; i <= 100; i += 10) {
                setTimeout(() => {
                    this.emit('progress', i, 100);
                }, i * 50);
            }
        }, 500);
        
        // Simulation de la vérification
        setTimeout(() => {
            for (let i = 0; i <= 100; i += 20) {
                setTimeout(() => {
                    this.emit('check', i, 100);
                }, i * 30);
            }
        }, 6000);
        
        // Simulation du patch
        setTimeout(() => {
            this.emit('patch', { message: 'Application des patchs...' });
        }, 9000);
        
        // Simulation du démarrage
        setTimeout(() => {
            this.emit('data', { message: 'Minecraft démarré' });
            
            if (window.AndroidBridge) {
                window.AndroidBridge.launchMinecraft(JSON.stringify(options));
            }
            
            // Simuler la fermeture après 30 secondes pour les tests
            setTimeout(() => {
                this.emit('close', 0);
            }, 30000);
        }, 10000);
    }
    
    on(event, callback) {
        if (!this.eventListeners[event]) {
            this.eventListeners[event] = [];
        }
        this.eventListeners[event].push(callback);
    }
    
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Erreur dans l\'événement', event, ':', error);
                }
            });
        }
    }
    
    static async launch(options) {
        if (window.AndroidBridge) {
            return window.AndroidBridge.launchMinecraft(JSON.stringify(options));
        }
        console.log('Lancement Minecraft:', options);
        return { success: true };
    }
}

// Mock Android Status Checker
class AndroidStatus {
    static async status(server, options = {}) {
        // Retourner un status par défaut
        return {
            status: 'online',
            players: { online: 12, max: 100 },
            ping: 42,
            version: '1.20.1'
        };
    }
}

// Mock Android File System
const AndroidFS = {
    existsSync: (path) => {
        return false; // Pas de système de fichiers sur Android WebView
    },
    readdirSync: (path) => {
        return [];
    },
    readFileSync: (path) => {
        return '';
    },
    writeFileSync: (path, data) => {
        // Utiliser localStorage comme alternative
        localStorage.setItem(path.replace(/[/\\]/g, '_'), data);
    }
};

// Mock process.env et __dirname
window.process = window.process || { env: {} };
window.__dirname = '/android_asset/haiko';

// Mock package.json
window.require.cache = {
    '../package.json': {
        name: 'haiko-launcher-mobile',
        version: '1.0.0'
    }
};

// Utilitaires Android spécifiques
window.HaikoAndroid = {
    // Fonction pour charger les news depuis l'API ou cache
    async loadNews() {
        try {
            // Essayer de charger depuis l'API
            const response = await fetch('https://api.haiko.fr/news');
            const news = await response.json();
            return news;
        } catch (error) {
            // Fallback vers des news statiques
            return [
                {
                    title: "Bienvenue sur Haiko Mobile !",
                    content: "Le launcher Haiko est maintenant disponible sur Android avec toutes ses fonctionnalités.",
                    date: new Date().toISOString(),
                    author: "Haiko Team",
                    thumbnail: "../assets/images/icon.png"
                }
            ];
        }
    },
    
    // Fonction pour charger le statut serveur
    async loadServerStatus() {
        try {
            if (window.AndroidBridge) {
                const status = await window.AndroidBridge.getServerStatus();
                return JSON.parse(status);
            }
        } catch (error) {
            console.log('Erreur status serveur:', error);
        }
        
        return {
            status: 'online',
            players: { online: 0, max: 100 },
            ping: 0,
            version: '1.20.1'
        };
    },
    
    // Fonction pour sauvegarder config
    async saveConfig(key, data) {
        localStorage.setItem(`haiko_${key}`, JSON.stringify(data));
    },
    
    // Fonction pour charger config
    async loadConfig(key) {
        const data = localStorage.getItem(`haiko_${key}`);
        return data ? JSON.parse(data) : null;
    }
};

console.log('Electron Polyfill chargé pour Android WebView');