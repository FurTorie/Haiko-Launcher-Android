/**
 * @author Luuxis - Adapté pour Android par Claude
 * Haiko Home Panel - Version exacte du PC adaptée pour Android WebView
 */

const { shell, ipcRenderer } = require('electron');
const { Launch } = require('minecraft-java-core');

class Home {
    static id = "home";
    
    constructor() {
        this.currentInstance = null;
        this.instancesList = null;
        this.config = null;
        this.db = new MockDatabase();
    }

    async init(config) {
        this.config = config || {};
        await this.news();
        this.socialLick();
        this.instancesSelect();
        
        const settingsBtn = document.querySelector('.settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.changePanel('settings'));
        }
    }

    async news() {
        let newsElement = document.querySelector('.news-list');
        let allNews = await this.getNews().then(res => res).catch(err => false);
        
        let news = this.filterNewsByInstance(allNews);
        
        if (news) {
            if (!news.length) {
                this.createDefaultNews(newsElement);
            } else {
                for (let News of news) {
                    let date = this.getdate(News.publish_date);
                    let blockNews = document.createElement('div');
                    blockNews.classList.add('news-block');
                    if (News.pinned) {
                        blockNews.classList.add('pinned-news');
                    }
                    let newsLogo = this.getNewsLogo(News);
                    blockNews.innerHTML = `
                        <div class="news-header">
                            ${News.pinned ? '<div class="pin-indicator"><div class="pin-icon">📌</div></div>' : ''}
                            <img class="server-status-icon" src="${newsLogo}" onerror="this.src='../assets/images/icon.png'">
                            <div class="header-text">
                                <div class="title">${News.title}</div>
                            </div>
                            <div class="date">
                                <div class="day">${date.day}</div>
                                <div class="month">${date.month}</div>
                                <div class="year">${date.year}</div>
                            </div>
                        </div>
                        <div class="news-content">
                            <div class="bbWrapper">
                                <p>${News.content.replace(/\n/g, '</br>')}</p>
                                <p class="news-author">Auteur - <span>${News.author}</span></p>
                            </div>
                        </div>`;
                    newsElement.appendChild(blockNews);
                }
            }
        } else {
            this.createErrorNews(newsElement);
        }
    }

    createDefaultNews(newsElement) {
        let blockNews = document.createElement('div');
        blockNews.classList.add('news-block');
        blockNews.innerHTML = `
            <div class="news-header">
                <img class="server-status-icon" src="../assets/images/icon.png">
                <div class="header-text">
                    <div class="title">Aucune news n'est actuellement disponible.</div>
                </div>
                <div class="date">
                    <div class="day">1</div>
                    <div class="month">Janvier</div>
                    <div class="year">2025</div>
                </div>
            </div>
            <div class="news-content">
                <div class="bbWrapper">
                    <p>Vous pourrez suivre ici toutes les news relatives au serveur.</p>
                </div>
            </div>`;
        newsElement.appendChild(blockNews);
    }

    createErrorNews(newsElement) {
        let blockNews = document.createElement('div');
        blockNews.classList.add('news-block');
        blockNews.innerHTML = `
            <div class="news-header">
                <img class="server-status-icon" src="../assets/images/icon.png">
                <div class="header-text">
                    <div class="title">Erreur.</div>
                </div>
                <div class="date">
                    <div class="day">1</div>
                    <div class="month">Janvier</div>
                    <div class="year">2025</div>
                </div>
            </div>
            <div class="news-content">
                <div class="bbWrapper">
                    <p>Impossible de contacter le serveur des news.</br>Merci de vérifier votre configuration.</p>
                </div>
            </div>`;
        newsElement.appendChild(blockNews);
    }

    async getNews() {
        try {
            return await HaikoAndroid.loadNews();
        } catch (error) {
            return false;
        }
    }

    socialLick() {
        let socials = document.querySelectorAll('.social-block');
        
        socials.forEach(social => {
            social.addEventListener('click', e => {
                const url = e.target.closest('.social-block').getAttribute('data-url');
                if (url) {
                    shell.openExternal(url);
                }
            });
        });
    }

    async instancesSelect() {
        let configClient = await this.db.readData('configClient');
        let auth = await this.db.readData('accounts', configClient.account_selected);
        this.instancesList = await this.getInstanceList();
        let instanceSelect = this.instancesList.find(i => i.name == configClient?.instance_selct) ? configClient?.instance_selct : null;

        let instanceBTN = document.querySelector('.play-instance');
        let instancePopup = document.querySelector('.instance-popup');
        let instancesListPopup = document.querySelector('.instances-List');
        let instanceCloseBTN = document.querySelector('.close-popup');

        if (this.instancesList.length === 1) {
            const selectBtn = document.querySelector('.instance-select');
            if (selectBtn) selectBtn.style.display = 'none';
            instanceBTN.style.paddingRight = '0';
        }

        let welcomeInstance = this.instancesList.find(i => i.isWelcome == true);
        if (welcomeInstance) {
            this.currentInstance = welcomeInstance.name;
            instanceSelect = welcomeInstance.name;
            configClient.instance_selct = welcomeInstance.name;
            await this.db.updateData('configClient', configClient);
        } else if (!instanceSelect) {
            let newInstanceSelect = this.instancesList.find(i => i.whitelistActive == false);
            configClient.instance_selct = newInstanceSelect.name;
            instanceSelect = newInstanceSelect.name;
            this.currentInstance = newInstanceSelect.name;
            await this.db.updateData('configClient', configClient);
        } else {
            this.currentInstance = instanceSelect;
        }

        for (let instance of this.instancesList) {
            if (instance.whitelistActive) {
                let whitelist = instance.whitelist.find(whitelist => whitelist == auth?.name);
                if (whitelist !== auth?.name) {
                    if (instance.name == instanceSelect) {
                        let newInstanceSelect = this.instancesList.find(i => i.whitelistActive == false);
                        configClient.instance_selct = newInstanceSelect.name;
                        instanceSelect = newInstanceSelect.name;
                        await this.db.updateData('configClient', configClient);
                    }
                }
            }
        }
        
        this.updatePlayButtonStateInstant(instanceSelect, this.instancesList);
        this.updateInstanceDisplayInstant(instanceSelect);

        instancePopup.addEventListener('click', async e => {
            let configClient = await this.db.readData('configClient');

            if (e.target.classList.contains('instance-elements')) {
                let newInstanceSelect = e.target.id;
                let activeInstanceSelect = document.querySelector('.active-instance');

                if (activeInstanceSelect) activeInstanceSelect.classList.toggle('active-instance');
                e.target.classList.add('active-instance');

                configClient.instance_selct = newInstanceSelect;
                this.currentInstance = newInstanceSelect;
                instanceSelect = newInstanceSelect;
                await this.db.updateData('configClient', configClient);
                
                this.updateInstanceDisplayInstant(newInstanceSelect);
                this.updatePlayButtonStateInstant(newInstanceSelect, this.instancesList);
                
                instancePopup.style.display = 'none';
                
                await this.refreshNews();
            }
        });

        instanceBTN.addEventListener('click', async e => {
            let configClient = await this.db.readData('configClient');
            let instanceSelect = configClient.instance_selct;
            let auth = await this.db.readData('accounts', configClient.account_selected);

            if (e.target.classList.contains('instance-select')) {
                instancesListPopup.innerHTML = '';
                let currentInstance = this.currentInstance || configClient.instance_selct;
                
                for (let instance of this.instancesList) {
                    if (instance.whitelistActive) {
                        instance.whitelist.map(whitelist => {
                            if (whitelist == auth?.name) {
                                if (instance.name == currentInstance) {
                                    instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements active-instance">${instance.name}</div>`;
                                } else {
                                    instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements">${instance.name}</div>`;
                                }
                            }
                        });
                    } else {
                        if (instance.name == currentInstance) {
                            instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements active-instance">${instance.name}</div>`;
                        } else {
                            instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements">${instance.name}</div>`;
                        }
                    }
                }

                instancePopup.style.display = 'flex';
            }

            if (!e.target.classList.contains('instance-select')) {
                let instance = this.instancesList.find(i => i.name == this.currentInstance);
                
                if (instance && instance.isWelcome) {
                    console.log('Instance d\'accueil sélectionnée - lancement désactivé');
                    return;
                }
                this.startGame();
            }
        });

        if (instanceCloseBTN) {
            instanceCloseBTN.addEventListener('click', () => instancePopup.style.display = 'none');
        }
    }

    async startGame() {
        let launch = new Launch();
        let configClient = await this.db.readData('configClient');
        let instance = await this.getInstanceList();
        let authenticator = await this.db.readData('accounts', configClient.account_selected);
        let options = instance.find(i => i.name == this.currentInstance);
        
        if (!options || options.isWelcome) {
            console.log('Instance invalide ou instance d\'accueil - lancement annulé');
            return;
        }

        let playInstanceBTN = document.querySelector('.play-instance');
        let infoStartingBOX = document.querySelector('.info-starting-game');
        let infoStarting = document.querySelector(".info-starting-game-text");
        let progressBar = document.querySelector('.progress-bar');

        let opt = {
            url: options.url,
            authenticator: authenticator,
            timeout: 10000,
            path: await this.getAppData(),
            instance: options.name,
            version: options.loadder.minecraft_version,
            detached: configClient.launcher_config?.closeLauncher == "close-all" ? false : true,
            downloadFileMultiple: configClient.launcher_config?.download_multi || 5,
            intelEnabledMac: configClient.launcher_config?.intelEnabledMac || false,

            loader: {
                type: options.loadder.loadder_type,
                build: options.loadder.loadder_version,
                enable: options.loadder.loadder_type == 'none' ? false : true
            },

            verify: options.verify,
            ignored: [...options.ignored],
            javaPath: configClient.java_config?.java_path || 'java',

            screen: {
                width: configClient.game_config?.screen_size?.width || 1280,
                height: configClient.game_config?.screen_size?.height || 720
            },

            memory: {
                min: `${(configClient.java_config?.java_memory?.min || 2) * 1024}M`,
                max: `${(configClient.java_config?.java_memory?.max || 4) * 1024}M`
            }
        };

        playInstanceBTN.style.display = "none";
        infoStartingBOX.style.display = "block";
        progressBar.style.display = "";

        launch.Launch(opt);

        launch.on('progress', (progress, size) => {
            infoStarting.innerHTML = `Téléchargement ${((progress / size) * 100).toFixed(0)}%`;
            progressBar.value = progress;
            progressBar.max = size;
        });

        launch.on('check', (progress, size) => {
            infoStarting.innerHTML = `Vérification ${((progress / size) * 100).toFixed(0)}%`;
            progressBar.value = progress;
            progressBar.max = size;
        });

        launch.on('data', (e) => {
            progressBar.style.display = "none";
            infoStarting.innerHTML = `Démarrage en cours...`;
            console.log(e);
        });

        launch.on('close', code => {
            infoStartingBOX.style.display = "none";
            playInstanceBTN.style.display = "flex";
            infoStarting.innerHTML = `Vérification`;
            console.log('Close');
        });

        launch.on('error', err => {
            console.error('Erreur lancement:', err);
            infoStartingBOX.style.display = "none";
            playInstanceBTN.style.display = "flex";
            infoStarting.innerHTML = `Vérification`;
        });
    }

    async getInstanceList() {
        return await AndroidInstances.getInstances();
    }

    async getAppData() {
        return '/android_data/haiko';
    }

    getdate(e) {
        let date = new Date(e);
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let allMonth = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        return { year: year, month: allMonth[month - 1], day: day };
    }

    updatePlayButtonStateInstant(instanceSelect, instancesList) {
        let playInstanceBTN = document.querySelector('.play-instance');
        let instance = instancesList.find(i => i.name == (instanceSelect || this.currentInstance));
        
        playInstanceBTN.classList.remove('welcome-disabled');
        
        if (instance && instance.isWelcome) {
            playInstanceBTN.classList.add('welcome-disabled');
            playInstanceBTN.title = 'Sélectionnez une instance pour jouer';
        } else {
            playInstanceBTN.title = 'Lancer le jeu';
        }
        
        playInstanceBTN.offsetHeight;
    }

    updateInstanceDisplayInstant(instanceSelect) {
        let instanceNameElement = document.querySelector('.instance-name');
        if (instanceNameElement) {
            instanceNameElement.textContent = instanceSelect || 'Accueil';
            instanceNameElement.offsetHeight;
        }
        this.updateServerStatusIcon(instanceSelect);
    }

    updateServerStatusIcon(instanceSelect) {
        let statusIcon = document.querySelector('.server-status-icon');
        if (statusIcon && this.instancesList) {
            let instance = this.instancesList.find(i => i.name == instanceSelect);
            if (instance && instance.logo) {
                statusIcon.src = instance.logo;
                statusIcon.onerror = function() {
                    this.src = "../assets/images/icon.png";
                };
            } else {
                statusIcon.src = "../assets/images/icon.png";
            }
        }
    }

    filterNewsByInstance(allNews) {
        if (!allNews || !Array.isArray(allNews)) return allNews;
        
        let currentInstance = this.currentInstance || 'Accueil';
        
        let filteredNews = allNews.filter(newsItem => {
            if (newsItem.instance) {
                if (newsItem.instance === 'global') return true;
                
                if (Array.isArray(newsItem.instance)) {
                    return newsItem.instance.includes(currentInstance);
                }
                
                return newsItem.instance.toLowerCase() === currentInstance.toLowerCase();
            }
            
            return currentInstance === 'Accueil';
        });

        return filteredNews.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            
            return new Date(b.publish_date) - new Date(a.publish_date);
        });
    }

    getNewsLogo(newsItem) {
        const houseLogo = "../assets/images/icon.png";
        
        if (!newsItem.instance || newsItem.instance === 'Accueil') {
            return houseLogo;
        }
        
        if (newsItem.instance === 'global') {
            return houseLogo;
        }
        
        if (Array.isArray(newsItem.instance)) {
            return houseLogo;
        }
        
        if (typeof newsItem.instance === 'string' && this.instancesList) {
            let instance = this.instancesList.find(i => 
                i.name.toLowerCase() === newsItem.instance.toLowerCase()
            );
            if (instance && instance.logo) {
                return instance.logo;
            }
        }
        
        return houseLogo;
    }

    async refreshNews() {
        let newsElement = document.querySelector('.news-list');
        newsElement.innerHTML = '';
        await this.news();
    }

    changePanel(panelName) {
        window.location.href = `${panelName}.html`;
    }
}

class MockDatabase {
    constructor() {
        this.data = {
            configClient: {
                account_selected: null,
                instance_selct: 'Accueil',
                launcher_config: {
                    closeLauncher: 'keep-launcher',
                    download_multi: 5,
                    intelEnabledMac: false
                },
                java_config: {
                    java_path: 'java',
                    java_memory: {
                        min: 2,
                        max: 4
                    }
                },
                game_config: {
                    screen_size: {
                        width: 1280,
                        height: 720
                    }
                }
            },
            accounts: []
        };
    }

    async readData(table, id = null) {
        if (id) {
            return this.data[table]?.find?.(item => item.id === id) || null;
        }
        return this.data[table] || {};
    }

    async updateData(table, data) {
        this.data[table] = data;
        return data;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const home = new Home();
    home.init({}).catch(error => {
        console.error('Erreur initialisation Home:', error);
    });
});

window.Home = Home;