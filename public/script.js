/* ========================================
   VESASTAR GAMES LAUNCHER
   Pure JavaScript - No frameworks
   ======================================== */

(function() {
    'use strict';

    // ========================================
    // CONFIGURATION
    // ========================================
    const CONFIG = {
        API_BASE: '/api',
        GAMES_JSON: 'games.json',
        PLAYTIME_INTERVAL: 10000, // 10 seconds
        XP_PER_LEVEL: 1000
    };

    // ========================================
    // STATE
    // ========================================
    const state = {
        user: null,
        games: [],
        quests: {
            daily: [],
            weekly: [],
            achievements: []
        },
        currentGame: null,
        playtimeTimer: null,
        sessionPlaytime: 0
    };

    // ========================================
    // DOM ELEMENTS
    // ========================================
    const elements = {
        // Header
        authBtn: document.getElementById('authBtn'),
        userSection: document.getElementById('userSection'),
        userInfo: document.getElementById('userInfo'),
        userAvatar: document.getElementById('userAvatar'),
        usernameDisplay: document.getElementById('usernameDisplay'),
        xpFill: document.getElementById('xpFill'),
        xpText: document.getElementById('xpText'),
        logoutBtn: document.getElementById('logoutBtn'),

        // Navigation
        navBtns: document.querySelectorAll('.nav-btn'),
        gamesTab: document.getElementById('gamesTab'),
        questsTab: document.getElementById('questsTab'),

        // Games
        gameList: document.getElementById('gameList'),
        gameFrame: document.getElementById('gameFrame'),
        gameLoading: document.getElementById('gameLoading'),
        gamePlaceholder: document.getElementById('gamePlaceholder'),
        currentGameTitle: document.getElementById('currentGameTitle'),
        currentGameDesc: document.getElementById('currentGameDesc'),
        playtimeText: document.getElementById('playtimeText'),
        iframeContainer: document.getElementById('iframeContainer'),

        // Quests
        dailyQuests: document.getElementById('dailyQuests'),
        weeklyQuests: document.getElementById('weeklyQuests'),
        achievements: document.getElementById('achievements'),

        // Auth Modal
        authModal: document.getElementById('authModal'),
        modalClose: document.getElementById('modalClose'),
        modalTabs: document.querySelectorAll('.modal-tab'),
        signinForm: document.getElementById('signinForm'),
        signupForm: document.getElementById('signupForm'),
        signinError: document.getElementById('signinError'),
        signupError: document.getElementById('signupError')
    };

    // ========================================
    // API ABSTRACTION
    // ========================================
    const API = {
        async signup(username, password) {
            // Replace with actual backend call
            try {
                const response = await fetch(CONFIG.API_BASE + '/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                if (!response.ok) throw new Error('Signup failed');
                return await response.json();
            } catch (error) {
                // Fallback for demo - create local user
                console.warn('API not available, using local storage');
                const users = JSON.parse(localStorage.getItem('vs_users') || '{}');
                if (users[username]) {
                    throw new Error('Username already exists');
                }
                users[username] = {
                    password: btoa(password), // Simple encoding for demo
                    xp: 0,
                    level: 1,
                    playtime: {},
                    createdAt: Date.now()
                };
                localStorage.setItem('vs_users', JSON.stringify(users));
                return { success: true, username };
            }
        },

        async login(username, password) {
            try {
                const response = await fetch(CONFIG.API_BASE + '/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                if (!response.ok) throw new Error('Login failed');
                return await response.json();
            } catch (error) {
                // Fallback for demo
                console.warn('API not available, using local storage');
                const users = JSON.parse(localStorage.getItem('vs_users') || '{}');
                const user = users[username];
                if (!user || user.password !== btoa(password)) {
                    throw new Error('Invalid credentials');
                }
                const token = 'demo_' + btoa(username + ':' + Date.now());
                return { 
                    success: true, 
                    token, 
                    user: {
                        username,
                        xp: user.xp || 0,
                        level: user.level || 1,
                        playtime: user.playtime || {}
                    }
                };
            }
        },

        async logout() {
            try {
                await fetch(CONFIG.API_BASE + '/logout', { method: 'POST' });
            } catch (error) {
                console.warn('API not available');
            }
            localStorage.removeItem('vs_session');
        },

        async getQuests() {
            try {
                const response = await fetch(CONFIG.API_BASE + '/quests');
                if (!response.ok) throw new Error('Failed to fetch quests');
                return await response.json();
            } catch (error) {
                // Return generated quests for demo
                return generateQuests();
            }
        },

        async updatePlaytime(gameId, seconds) {
            const data = {
                username: state.user?.username,
                gameId,
                secondsPlayed: seconds
            };
            try {
                await fetch(CONFIG.API_BASE + '/update-playtime', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } catch (error) {
                // Update locally for demo
                console.warn('API not available, storing locally');
                if (state.user) {
                    const users = JSON.parse(localStorage.getItem('vs_users') || '{}');
                    if (users[state.user.username]) {
                        users[state.user.username].playtime = users[state.user.username].playtime || {};
                        users[state.user.username].playtime[gameId] = 
                            (users[state.user.username].playtime[gameId] || 0) + seconds;
                        
                        // Add XP for playtime
                        users[state.user.username].xp = (users[state.user.username].xp || 0) + Math.floor(seconds / 60);
                        users[state.user.username].level = Math.floor(users[state.user.username].xp / CONFIG.XP_PER_LEVEL) + 1;
                        
                        localStorage.setItem('vs_users', JSON.stringify(users));
                        
                        // Update state
                        state.user.xp = users[state.user.username].xp;
                        state.user.level = users[state.user.username].level;
                        state.user.playtime = users[state.user.username].playtime;
                        
                        updateUserUI();
                        updateQuestProgress();
                    }
                }
            }
        }
    };

    // ========================================
    // QUEST GENERATION
    // ========================================
    function generateQuests() {
        const totalPlaytime = state.user ? 
            Object.values(state.user.playtime || {}).reduce((a, b) => a + b, 0) : 0;
        
        return {
            daily: [
                {
                    id: 'd1',
                    title: 'FIRST BOOT',
                    description: 'Launch any game today',
                    progress: state.currentGame ? 100 : 0,
                    reward: '50 XP',
                    completed: state.currentGame !== null
                },
                {
                    id: 'd2',
                    title: 'POWER SESSION',
                    description: 'Play for 30 minutes today',
                    progress: Math.min(100, Math.floor((state.sessionPlaytime / 1800) * 100)),
                    reward: '100 XP',
                    completed: state.sessionPlaytime >= 1800
                },
                {
                    id: 'd3',
                    title: 'EXPLORER',
                    description: 'Try 3 different games',
                    progress: Math.min(100, Math.floor((Object.keys(state.user?.playtime || {}).length / 3) * 100)),
                    reward: '150 XP',
                    completed: Object.keys(state.user?.playtime || {}).length >= 3
                }
            ],
            weekly: [
                {
                    id: 'w1',
                    title: 'DEDICATED GAMER',
                    description: 'Accumulate 5 hours of playtime this week',
                    progress: Math.min(100, Math.floor((totalPlaytime / 18000) * 100)),
                    reward: '500 XP',
                    completed: totalPlaytime >= 18000
                },
                {
                    id: 'w2',
                    title: 'VARIETY PACK',
                    description: 'Play every game in the library',
                    progress: Math.min(100, Math.floor((Object.keys(state.user?.playtime || {}).length / Math.max(1, state.games.length)) * 100)),
                    reward: '750 XP',
                    completed: Object.keys(state.user?.playtime || {}).length >= state.games.length
                }
            ],
            achievements: [
                {
                    id: 'a1',
                    title: 'ROOKIE',
                    description: 'Reach Level 5',
                    progress: Math.min(100, Math.floor(((state.user?.level || 1) / 5) * 100)),
                    reward: 'Rookie Badge',
                    completed: (state.user?.level || 1) >= 5
                },
                {
                    id: 'a2',
                    title: 'VETERAN',
                    description: 'Reach Level 10',
                    progress: Math.min(100, Math.floor(((state.user?.level || 1) / 10) * 100)),
                    reward: 'Veteran Badge',
                    completed: (state.user?.level || 1) >= 10
                },
                {
                    id: 'a3',
                    title: 'MARATHON RUNNER',
                    description: 'Play for 24 hours total',
                    progress: Math.min(100, Math.floor((totalPlaytime / 86400) * 100)),
                    reward: 'Marathon Badge',
                    completed: totalPlaytime >= 86400
                }
            ]
        };
    }

    // ========================================
    // INITIALIZATION
    // ========================================
    async function init() {
        // Hide intro after animation completes
        const introOverlay = document.getElementById('introOverlay');
        setTimeout(() => {
            introOverlay.classList.add('hidden');
        }, 3500); // Matches animation duration

        // Check for existing session
        checkSession();
        
        // Load games
        await loadGames();
        
        // Load quests
        await loadQuests();
        
        // Setup event listeners
        setupEventListeners();
        
        // Don't auto-load a game - show placeholder instead
        // User must click a game to load it
    }

    function checkSession() {
        const session = localStorage.getItem('vs_session');
        if (session) {
            try {
                const data = JSON.parse(session);
                state.user = data.user;
                updateUserUI();
            } catch (e) {
                localStorage.removeItem('vs_session');
            }
        }
    }

    async function loadGames() {
        try {
            const response = await fetch(CONFIG.GAMES_JSON);
            if (!response.ok) throw new Error('Failed to load games');
            state.games = await response.json();
        } catch (error) {
            console.error('Error loading games:', error);
            // Fallback demo games
            state.games = [
                {
                    id: 'starfall-survivor',
                    name: 'Starfall Survivor',
                    description: 'Dual-mode auto shooter with roguelike elements.',
                    thumbnail: 'assets/thumbnails/starfall.png',
                    path: '/starfall-survivor/'
                },
                {
                    id: 'neon-racer',
                    name: 'Neon Racer',
                    description: 'High-speed cyberpunk racing game.',
                    thumbnail: 'assets/thumbnails/neon-racer.png',
                    path: '/neon-racer/'
                },
                {
                    id: 'pixel-dungeon',
                    name: 'Pixel Dungeon',
                    description: 'Classic dungeon crawler adventure.',
                    thumbnail: 'assets/thumbnails/pixel-dungeon.png',
                    path: '/pixel-dungeon/'
                }
            ];
        }
        renderGameList();
    }

    async function loadQuests() {
        const quests = await API.getQuests();
        state.quests = quests;
        renderQuests();
    }

    // ========================================
    // RENDERING
    // ========================================
    function renderGameList() {
        elements.gameList.innerHTML = '';
        
        state.games.forEach((game, index) => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.style.animationDelay = (index * 0.1) + 's';
            card.dataset.gameId = game.id;
            
            card.innerHTML = `
                <img class="game-thumbnail" src="${game.thumbnail}" alt="${game.name}" onerror="this.style.display='none'">
                <h4 class="game-card-title">${game.name}</h4>
                <p class="game-card-desc">${game.description}</p>
            `;
            
            card.addEventListener('click', () => selectGame(game));
            elements.gameList.appendChild(card);
        });
    }

    function renderQuests() {
        renderQuestList(elements.dailyQuests, state.quests.daily);
        renderQuestList(elements.weeklyQuests, state.quests.weekly);
        renderQuestList(elements.achievements, state.quests.achievements);
    }

    function renderQuestList(container, quests) {
        container.innerHTML = '';
        
        quests.forEach(quest => {
            const item = document.createElement('div');
            item.className = 'quest-item' + (quest.completed ? ' completed' : '');
            
            item.innerHTML = `
                <h4 class="quest-title">${quest.title}</h4>
                <p class="quest-desc">${quest.description}</p>
                <div class="quest-progress-container">
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width: ${quest.progress}%"></div>
                    </div>
                    <span class="quest-progress-text">${quest.progress}%</span>
                </div>
                <div class="quest-reward">🎁 ${quest.reward}</div>
            `;
            
            container.appendChild(item);
        });
    }

    function updateUserUI() {
        if (state.user) {
            elements.authBtn.classList.add('hidden');
            elements.userInfo.classList.remove('hidden');
            elements.userAvatar.textContent = state.user.username.charAt(0).toUpperCase();
            elements.usernameDisplay.textContent = state.user.username;
            
            const xpInLevel = state.user.xp % CONFIG.XP_PER_LEVEL;
            const xpPercent = (xpInLevel / CONFIG.XP_PER_LEVEL) * 100;
            elements.xpFill.style.width = xpPercent + '%';
            elements.xpText.textContent = `LVL ${state.user.level} • ${state.user.xp} XP`;
        } else {
            elements.authBtn.classList.remove('hidden');
            elements.userInfo.classList.add('hidden');
        }
    }

    function updateQuestProgress() {
        state.quests = generateQuests();
        renderQuests();
    }

    // ========================================
    // GAME SELECTION & PLAYBACK
    // ========================================
    function selectGame(game) {
        // Stop current playtime tracking
        if (state.playtimeTimer) {
            clearInterval(state.playtimeTimer);
            state.playtimeTimer = null;
        }

        // Validate game path exists and isn't the current page
        if (!game.path || game.path === '/' || game.path === '/index.html') {
            console.error('Invalid game path:', game.path);
            return;
        }

        // Update active state
        document.querySelectorAll('.game-card').forEach(card => {
            card.classList.remove('active');
            if (card.dataset.gameId === game.id) {
                card.classList.add('active');
            }
        });

        // Hide placeholder, show loading state
        elements.gamePlaceholder.classList.add('hidden');
        elements.gameLoading.classList.add('visible');
        elements.gameFrame.classList.add('loading');
        
        // Add glitch effect
        elements.gameFrame.classList.add('glitch');
        setTimeout(() => elements.gameFrame.classList.remove('glitch'), 300);

        // Update game info
        elements.currentGameTitle.textContent = game.name;
        elements.currentGameDesc.textContent = game.description;
        
        // Calculate playtime display
        const totalSeconds = state.user?.playtime?.[game.id] || 0;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        elements.playtimeText.textContent = `${hours}h ${minutes}m played`;

        // Load game
        state.currentGame = game;
        elements.gameFrame.src = game.path;
        
        // Handle iframe load
        elements.gameFrame.onload = () => {
            elements.gameLoading.classList.remove('visible');
            elements.gameFrame.classList.remove('loading');
            
            // Start playtime tracking
            startPlaytimeTracking();
        };

        // Handle iframe error (game not found)
        elements.gameFrame.onerror = () => {
            elements.gameLoading.classList.remove('visible');
            elements.gameFrame.classList.remove('loading');
            console.error('Failed to load game:', game.path);
        };
    }

    function startPlaytimeTracking() {
        if (!state.currentGame || !state.user) return;
        
        state.playtimeTimer = setInterval(() => {
            state.sessionPlaytime += 10;
            API.updatePlaytime(state.currentGame.id, 10);
            
            // Update display
            const totalSeconds = (state.user?.playtime?.[state.currentGame.id] || 0);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            elements.playtimeText.textContent = `${hours}h ${minutes}m played`;
        }, CONFIG.PLAYTIME_INTERVAL);
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================
    function setupEventListeners() {
        // Navigation tabs
        elements.navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                elements.navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const tab = btn.dataset.tab;
                elements.gamesTab.classList.toggle('active', tab === 'games');
                elements.questsTab.classList.toggle('active', tab === 'quests');
            });
        });

        // Auth button
        elements.authBtn.addEventListener('click', () => {
            elements.authModal.classList.remove('hidden');
        });

        // Modal close
        elements.modalClose.addEventListener('click', () => {
            elements.authModal.classList.add('hidden');
        });

        // Click outside modal
        elements.authModal.addEventListener('click', (e) => {
            if (e.target === elements.authModal) {
                elements.authModal.classList.add('hidden');
            }
        });

        // Modal tabs
        elements.modalTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                elements.modalTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const authType = tab.dataset.auth;
                elements.signinForm.classList.toggle('hidden', authType !== 'signin');
                elements.signupForm.classList.toggle('hidden', authType !== 'signup');
            });
        });

        // Sign in form
        elements.signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signinUsername').value.trim();
            const password = document.getElementById('signinPassword').value;
            
            try {
                elements.signinError.classList.add('hidden');
                const result = await API.login(username, password);
                
                state.user = result.user;
                localStorage.setItem('vs_session', JSON.stringify({ 
                    token: result.token, 
                    user: result.user 
                }));
                
                updateUserUI();
                elements.authModal.classList.add('hidden');
                elements.signinForm.reset();
                
                // Reload quests with user data
                await loadQuests();
                
                // Start tracking if game is loaded
                if (state.currentGame) {
                    startPlaytimeTracking();
                }
            } catch (error) {
                elements.signinError.textContent = error.message || 'Login failed';
                elements.signinError.classList.remove('hidden');
            }
        });

        // Sign up form
        elements.signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signupUsername').value.trim();
            const password = document.getElementById('signupPassword').value;
            const confirm = document.getElementById('signupConfirm').value;
            
            if (password !== confirm) {
                elements.signupError.textContent = 'Passwords do not match';
                elements.signupError.classList.remove('hidden');
                return;
            }
            
            try {
                elements.signupError.classList.add('hidden');
                await API.signup(username, password);
                
                // Auto login after signup
                const result = await API.login(username, password);
                state.user = result.user;
                localStorage.setItem('vs_session', JSON.stringify({ 
                    token: result.token, 
                    user: result.user 
                }));
                
                updateUserUI();
                elements.authModal.classList.add('hidden');
                elements.signupForm.reset();
                
                await loadQuests();
            } catch (error) {
                elements.signupError.textContent = error.message || 'Signup failed';
                elements.signupError.classList.remove('hidden');
            }
        });

        // Logout
        elements.logoutBtn.addEventListener('click', async () => {
            await API.logout();
            state.user = null;
            
            if (state.playtimeTimer) {
                clearInterval(state.playtimeTimer);
                state.playtimeTimer = null;
            }
            
            updateUserUI();
            await loadQuests();
        });
    }

    // ========================================
    // START
    // ========================================
    document.addEventListener('DOMContentLoaded', init);

})();
