// Report Analytics and Data Management

const Report = {
    // Report data
    reportData: null,
    
    // Storage key
    STORAGE_KEY: "pomodoroReportData",
    
    // Initialize
    init() {
        this.loadReportState();
        this.updateStreaks();
        Heatmap.updateHeader();
        this.saveReportState();
    },
    
    // Load report data from localStorage
    loadReportState() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this.reportData = {
                    totalFocusMinutes: parsed.totalFocusMinutes || 0,
                    totalPomodoros: parsed.totalPomodoros || 0,
                    focusDays: parsed.focusDays || [],
                    weeklyFocus: parsed.weeklyFocus || [0, 0, 0, 0, 0, 0, 0],
                    monthlyHeatmap: parsed.monthlyHeatmap || Array.from({ length: 31 }, () => 0),
                    sessionHistory: parsed.sessionHistory || [],
                    currentStreak: parsed.currentStreak || 0,
                    longestStreak: parsed.longestStreak || 0,
                    totalCompletedTasks: parsed.totalCompletedTasks || 0,
                };
                return;
            } catch (error) {
                console.error("Failed to load report:", error);
            }
        }
        
        this.reportData = {
            totalFocusMinutes: 0,
            totalPomodoros: 0,
            focusDays: [],
            weeklyFocus: [0, 0, 0, 0, 0, 0, 0],
            monthlyHeatmap: Array.from({ length: 31 }, () => 0),
            sessionHistory: [],
            currentStreak: 0,
            longestStreak: 0,
            totalCompletedTasks: 0,
        };
    },
    
    // Save report data to localStorage
    saveReportState() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.reportData));
        } catch (error) {
            console.error("Failed to save report:", error);
        }
    },
    
    // Add focus session
    addFocusSession(minutes) {
        const validMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 0;
        if (validMinutes <= 0) return;
        
        const now = new Date();
        const dateKey = this.getDateKey(now);
        
        this.reportData.totalFocusMinutes += validMinutes;
        this.reportData.totalPomodoros += 1;
        
        const weekdayIndex = this.getDayIndex(now);
        this.reportData.weeklyFocus[weekdayIndex] += validMinutes;
        
        const dayOfMonth = now.getDate() - 1;
        if (dayOfMonth < this.reportData.monthlyHeatmap.length) {
            this.reportData.monthlyHeatmap[dayOfMonth] += validMinutes;
        }
        
        if (!this.reportData.focusDays.includes(dateKey)) {
            this.reportData.focusDays.push(dateKey);
        }
        
        this.reportData.sessionHistory.unshift({
            label: "Focus Session",
            description: `${validMinutes}m focus`,
            time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            type: "focus",
        });
        
        if (this.reportData.sessionHistory.length > 14) {
            this.reportData.sessionHistory.pop();
        }
        
        this.updateStreaks();
        this.saveReportState();
    },
    
    // Add break session
    addBreakSession(mode) {
        const now = new Date();
        const duration = mode === "long" ? 15 : 5;
        
        this.reportData.sessionHistory.unshift({
            label: mode === "long" ? "Long Break" : "Short Break",
            description: `${duration}m break`,
            time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            type: "break",
        });
        
        if (this.reportData.sessionHistory.length > 14) {
            this.reportData.sessionHistory.pop();
        }
        
        this.saveReportState();
    },
    
    // Update streak calculations
    updateStreaks() {
        const uniqueDates = Array.from(new Set(this.reportData.focusDays)).sort();
        this.reportData.focusDays = uniqueDates;
        this.reportData.longestStreak = 0;
        this.reportData.currentStreak = 0;
        
        let lastDate = null;
        let streak = 0;
        
        uniqueDates.forEach((dateString) => {
            const currentDate = new Date(dateString);
            if (!lastDate) {
                streak = 1;
            } else {
                const diff = (currentDate - lastDate) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    streak += 1;
                } else if (diff > 1) {
                    this.reportData.longestStreak = Math.max(this.reportData.longestStreak, streak);
                    streak = 1;
                }
            }
            lastDate = currentDate;
        });
        
        this.reportData.longestStreak = Math.max(this.reportData.longestStreak, streak);
        
        if (uniqueDates.length > 0) {
            const lastFocusDate = new Date(uniqueDates[uniqueDates.length - 1]);
            const today = new Date();
            const dateDiff = Math.floor((today - lastFocusDate) / (1000 * 60 * 60 * 24));
            this.reportData.currentStreak = dateDiff === 0 ? streak : dateDiff === 1 ? streak : 0;
        } else {
            this.reportData.currentStreak = 0;
        }
    },
    
    // Utility functions
    getDayIndex(date) {
        const day = date.getDay();
        return day === 0 ? 6 : day - 1;
    },
    
    getDateKey(date) {
        return date.toISOString().split("T")[0];
    },
    
    // Analytics helpers
    getMostProductiveDay() {
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const maxMinutes = Math.max(...this.reportData.weeklyFocus);
        const index = this.reportData.weeklyFocus.indexOf(maxMinutes);
        return days[index] || "N/A";
    },
    
    getAverageSession() {
        if (this.reportData.totalPomodoros === 0) return 0;
        return Math.round(this.reportData.totalFocusMinutes / this.reportData.totalPomodoros);
    },
    
    getCompletionPercentage() {
        const analytics = Tasks.getAnalytics();
        if (analytics.estimated === 0) return 0;
        return Math.round((analytics.completedPomodoros / analytics.estimated) * 100);
    },
    
    getWeeklyConsistency() {
        const activeDays = this.reportData.weeklyFocus.filter((minutes) => minutes > 0).length;
        return Math.round((activeDays / 7) * 100);
    },
    
    // Sync task metrics
    syncTaskMetrics() {
        this.reportData.totalCompletedTasks = Tasks.tasks.filter((task) => task.completed).length;
        this.saveReportState();
    },
    
    // Clear report
    clearReport() {
        if (!confirm("Are you sure you want to clear all report data?")) return;
        
        this.reportData.totalFocusMinutes = 0;
        this.reportData.totalPomodoros = 0;
        this.reportData.focusDays = [];
        this.reportData.weeklyFocus = [0, 0, 0, 0, 0, 0, 0];
        this.reportData.monthlyHeatmap = Array.from({ length: 31 }, () => 0);
        this.reportData.sessionHistory = [];
        this.reportData.currentStreak = 0;
        this.reportData.longestStreak = 0;
        this.reportData.totalCompletedTasks = 0;
        
        this.saveReportState();
        return true;
    }
};
