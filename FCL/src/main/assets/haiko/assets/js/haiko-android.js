/**
 * Haiko Launcher - Version Android
 * Scripts pour les fonctionnalités de base sur mobile
 */

// Configuration par défaut
const HaikoConfig = {
    server: {
        name: "Serveur Haiko",
        status: "En ligne",
        ping: "42",
        players: "12"
    },
    news: [
        {
            title: "Bienvenue sur Haiko Mobile !",
            content: "Le launcher Haiko est maintenant disponible sur Android avec toutes ses fonctionnalités.",
            date: "2024-08-10"
        },
        {
            title: "Nouvelles fonctionnalités",
            content: "Support complet des mods, instances automatiques et interface moderne.",
            date: "2024-08-09"
        },
        {
            title: "Version 1.0.0 Mobile",
            content: "Première version stable du launcher mobile avec intégration FCL.",
            date: "2024-08-08"
        }
    ]
};

// Utilitaires UI
class HaikoUI {
    static populateNews() {
        const newsList = document.querySelector('.news-list');
        if (!newsList) return;
        
        newsList.innerHTML = '';
        HaikoConfig.news.forEach(news => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            newsItem.innerHTML = `
                <div class="news-header">
                    <h3 class="news-title">${news.title}</h3>
                    <span class="news-date">${news.date}</span>
                </div>
                <p class="news-content">${news.content}</p>
            `;
            newsList.appendChild(newsItem);
        });
    }
    
    static updateServerStatus() {
        const serverName = document.querySelector('.server-status-name');
        const serverText = document.querySelector('.server-status-text');
        const playerCount = document.querySelector('.player-count');
        
        if (serverName) serverName.textContent = HaikoConfig.server.name;
        if (serverText) serverText.textContent = `${HaikoConfig.server.status} - ${HaikoConfig.server.ping} ms`;
        if (playerCount) playerCount.textContent = HaikoConfig.server.players;
    }
    
    static setupSocialLinks() {
        document.querySelectorAll('.social-block').forEach(block => {
            block.addEventListener('click', (e) => {
                const url = block.getAttribute('data-url');
                if (url && window.AndroidBridge) {
                    window.AndroidBridge.openUrl(url);
                } else if (url) {
                    console.log('Ouverture de:', url);
                }
            });
        });
    }
    
    static setupSettingsTabs() {
        const tabs = document.querySelectorAll('.nav-settings-btn');
        const contents = document.querySelectorAll('.settings-page');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Retirer active de tous les tabs
                tabs.forEach(t => t.classList.remove('active-settings-BTN'));
                // Ajouter active au tab cliqué
                tab.classList.add('active-settings-BTN');
                
                // Afficher la bonne section
                const tabId = tab.id;
                contents.forEach(content => {
                    content.style.display = content.classList.contains(tabId + '-settings') ? 'block' : 'none';
                });
                
                console.log('Onglet paramètre activé:', tabId);
            });
        });
    }
    
    static populateDefaultInstances() {
        const instancesList = document.querySelector('.instances-List');
        if (!instancesList) return;
        
        const defaultInstances = [
            { name: "Vanilla 1.20.4", version: "1.20.4", type: "Vanilla" },
            { name: "Forge 1.20.1", version: "1.20.1", type: "Forge" },
            { name: "Fabric 1.20.4", version: "1.20.4", type: "Fabric" }
        ];
        
        instancesList.innerHTML = '';
        defaultInstances.forEach(instance => {
            const instanceItem = document.createElement('div');
            instanceItem.className = 'instance-item';
            instanceItem.innerHTML = `
                <div class="instance-info">
                    <h4>${instance.name}</h4>
                    <span class="instance-version">${instance.version} - ${instance.type}</span>
                </div>
                <button class="instance-play-btn" onclick="HaikoUI.launchInstance('${instance.name}')">Jouer</button>
            `;
            instancesList.appendChild(instanceItem);
        });
    }
    
    static launchInstance(instanceName) {
        console.log('Lancement instance:', instanceName);
        if (window.AndroidBridge) {
            window.AndroidBridge.launchMinecraft(instanceName);
        } else {
            alert(`Lancement de ${instanceName} (fonctionnalité à implémenter)`);
        }
    }
    
    static showInstancePopup() {
        const popup = document.querySelector('.instance-popup');
        if (popup) {
            popup.style.display = 'flex';
            HaikoUI.populateDefaultInstances();
        }
    }
    
    static hideInstancePopup() {
        const popup = document.querySelector('.instance-popup');
        if (popup) {
            popup.style.display = 'none';
        }
    }
    
    static setupLoginMethods() {
        document.querySelectorAll('.method-card').forEach(card => {
            card.addEventListener('click', () => {
                const method = card.id.replace('choose-', '');
                console.log('Méthode de connexion choisie:', method);
                
                // Cacher le choix et afficher le formulaire correspondant
                document.querySelector('.login-choice').style.display = 'none';
                document.querySelector(`.login-${method}`).style.display = 'block';
            });
        });
        
        // Boutons retour
        document.querySelectorAll('.cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.login-tabs > div').forEach(tab => {
                    tab.style.display = 'none';
                });
                document.querySelector('.login-choice').style.display = 'block';
            });
        });
    }
}

// Extension du bridge Android
if (window.AndroidBridge) {
    window.AndroidBridge.openUrl = function(url) {
        console.log('Ouverture URL:', url);
        // Ici on pourra implémenter l'ouverture d'URL avec le bridge Android
    };
    
    window.AndroidBridge.launchMinecraft = function(instanceName) {
        console.log('Lancement Minecraft:', instanceName);
        // Ici on pourra intégrer avec le moteur FCL/PojavLauncher
    };
}

// Initialisation automatique selon la page
document.addEventListener('DOMContentLoaded', () => {
    // Page Home
    if (document.querySelector('.status-server')) {
        HaikoUI.updateServerStatus();
        HaikoUI.populateNews();
        HaikoUI.setupSocialLinks();
        
        // Bouton play principal
        const playBtn = document.querySelector('.play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', HaikoUI.showInstancePopup);
        }
        
        // Fermer popup instance
        const closePopup = document.querySelector('.close-popup');
        if (closePopup) {
            closePopup.addEventListener('click', HaikoUI.hideInstancePopup);
        }
    }
    
    // Page Settings
    if (document.querySelector('.nav-settings')) {
        HaikoUI.setupSettingsTabs();
        
        // Afficher par défaut l'onglet comptes
        const firstTab = document.querySelector('.nav-settings-btn');
        if (firstTab) firstTab.click();
    }
    
    // Page Login
    if (document.querySelector('.login-choice')) {
        HaikoUI.setupLoginMethods();
    }
    
    console.log('Haiko Android UI initialisée');
});