// Game Server Support Timer Application
class TimerApp {
    constructor() {
        // Application data
        this.achievements = [
            {"time": 60, "title": "First Minute", "message": "Thanks for your first minute of support!"},
            {"time": 300, "title": "5 Minute Hero", "message": "You've reached the daily goal! Amazing!"},
            {"time": 600, "title": "10 Minute Legend", "message": "You're a true server supporter!"},
            {"time": 900, "title": "15 Minute Champion", "message": "Incredible dedication to the community!"},
            {"time": 1800, "title": "30 Minute Elite", "message": "You're keeping the server alive!"}
        ];
        
        this.settings = {
            dailyGoal: 300, // 5 minutes in seconds
            particleCount: 50,
            timerInterval: 1000,
            achievementDuration: 4000
        };

        // Timer state
        this.isRunning = false;
        this.currentTime = 0;
        this.timerInterval = null;
        this.unlockedAchievements = new Set();
        
        // DOM elements
        this.timerDisplay = document.getElementById('timerDisplay');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.achievementPopup = document.getElementById('achievementPopup');
        this.achievementText = document.getElementById('achievementText');
        
        // Stat elements
        this.todayTimeEl = document.getElementById('todayTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.sessionsCountEl = document.getElementById('sessionsCount');
        this.targetGoalEl = document.getElementById('targetGoal');

        this.init();
    }

    init() {
        this.loadData();
        this.updateDisplay();
        this.updateStats();
        this.createParticles();
        this.hideLoadingBar();
        
        // Update daily goal display
        this.targetGoalEl.textContent = this.formatTime(this.settings.dailyGoal);
        
        // Set initial button states
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }

    // Data persistence methods
    loadData() {
        const saved = JSON.parse(localStorage.getItem('serverSupportData') || '{}');
        const today = new Date().toDateString();
        
        // Reset daily data if it's a new day
        if (saved.lastDate !== today) {
            saved.todayTime = 0;
            saved.todayAchievements = [];
            saved.currentSessionTime = 0;
            saved.lastDate = today;
        }
        
        this.data = {
            todayTime: saved.todayTime || 0,
            totalTime: saved.totalTime || 0,
            sessionsCount: saved.sessionsCount || 0,
            todayAchievements: saved.todayAchievements || [],
            currentSessionTime: saved.currentSessionTime || 0,
            lastDate: saved.lastDate || today,
            ...saved
        };
        
        // Restore current session time
        this.currentTime = this.data.currentSessionTime;
        this.unlockedAchievements = new Set(this.data.todayAchievements);
    }

    saveData() {
        this.data.currentSessionTime = this.currentTime;
        localStorage.setItem('serverSupportData', JSON.stringify(this.data));
        console.log('Data saved:', this.data); // Debug log
    }

    // Timer methods
    startTimer() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.startBtn.textContent = '▶️ Running...';
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        
        // Increment sessions count if starting fresh session
        if (this.currentTime === 0) {
            this.data.sessionsCount++;
            this.saveData();
            this.updateStats();
        }
        
        this.timerInterval = setInterval(() => {
            this.currentTime++;
            this.data.todayTime++;
            this.data.totalTime++;
            
            this.updateDisplay();
            this.checkAchievements();
            
            // Save every 10 seconds
            if (this.currentTime % 10 === 0) {
                this.saveData();
                this.updateStats();
            }
        }, this.settings.timerInterval);
    }

    pauseTimer() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        clearInterval(this.timerInterval);
        
        this.startBtn.textContent = '▶️ Resume';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        this.saveData();
        this.updateStats();
    }

    resetTimer() {
        this.pauseTimer();
        
        // Only reset current session, not daily totals
        this.currentTime = 0;
        this.data.currentSessionTime = 0;
        
        this.startBtn.textContent = '▶️ Start Supporting';
        this.updateDisplay();
        this.saveData();
    }

    // Display methods
    updateDisplay() {
        // Update timer display
        this.timerDisplay.textContent = this.formatTimeDisplay(this.currentTime);
        
        // Update progress bar
        const progress = Math.min((this.data.todayTime / this.settings.dailyGoal) * 100, 100);
        this.progressBar.style.width = progress + '%';
        this.progressText.textContent = Math.round(progress) + '% Complete';
        
        // Change progress bar color based on completion
        if (progress >= 100) {
            this.progressBar.style.background = 'linear-gradient(90deg, #4ecdc4, #00d4ff)';
        } else if (progress >= 50) {
            this.progressBar.style.background = 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #00d4ff)';
        } else {
            this.progressBar.style.background = 'linear-gradient(90deg, #ff6b6b, #4ecdc4, #00d4ff)';
        }
    }

    updateStats() {
        this.todayTimeEl.textContent = this.formatTime(this.data.todayTime);
        this.totalTimeEl.textContent = this.formatTime(this.data.totalTime);
        this.sessionsCountEl.textContent = this.data.sessionsCount.toString();
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        if (minutes === 0) {
            return secs + 's';
        } else if (minutes < 60) {
            return minutes + 'm';
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return hours + 'h ' + mins + 'm';
        }
    }

    formatTimeDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    // Achievement system
    checkAchievements() {
        for (const achievement of this.achievements) {
            const achievementKey = achievement.time;
            
            // Check if we've reached this achievement time and haven't unlocked it yet
            if (this.data.todayTime >= achievement.time && !this.unlockedAchievements.has(achievementKey)) {
                console.log(`Unlocking achievement: ${achievement.title} at ${this.data.todayTime}s`); // Debug log
                this.unlockAchievement(achievement);
                this.unlockedAchievements.add(achievementKey);
                
                // Save to persistent storage
                if (!this.data.todayAchievements.includes(achievementKey)) {
                    this.data.todayAchievements.push(achievementKey);
                    this.saveData();
                }
            }
        }
    }

    unlockAchievement(achievement) {
        const popup = this.achievementPopup;
        const titleEl = popup.querySelector('h4');
        const textEl = this.achievementText;
        
        titleEl.textContent = `🏆 ${achievement.title}`;
        textEl.textContent = achievement.message;
        
        // Show popup
        popup.classList.add('show');
        console.log(`Achievement popup shown: ${achievement.title}`); // Debug log
        
        // Hide popup after delay
        setTimeout(() => {
            popup.classList.remove('show');
        }, this.settings.achievementDuration);
    }

    // Background particles
    createParticles() {
        const particlesContainer = document.getElementById('particles');
        
        for (let i = 0; i < this.settings.particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (Math.random() * 4 + 4) + 's';
            particlesContainer.appendChild(particle);
        }
    }

    // Loading bar
    hideLoadingBar() {
        setTimeout(() => {
            const loadingBar = document.querySelector('.loading-bar');
            if (loadingBar) {
                loadingBar.style.opacity = '0';
                setTimeout(() => {
                    loadingBar.style.display = 'none';
                }, 500);
            }
        }, 2000);
    }
}

// Global functions for button handlers
let timerApp;

function startTimer() {
    if (timerApp) {
        timerApp.startTimer();
    }
}

function pauseTimer() {
    if (timerApp) {
        timerApp.pauseTimer();
    }
}

function resetTimer() {
    if (timerApp) {
        timerApp.resetTimer();
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    timerApp = new TimerApp();
    console.log('Timer app initialized:', timerApp); // Debug log
});

// Handle visibility changes (pause when tab not visible)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && timerApp && timerApp.isRunning) {
        // Optional: pause timer when tab is not visible
        // timerApp.pauseTimer();
    }
});

// Handle beforeunload to save data
window.addEventListener('beforeunload', () => {
    if (timerApp) {
        timerApp.saveData();
    }
});