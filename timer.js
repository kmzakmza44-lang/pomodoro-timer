// Timer Logic and State Management

const Timer = {
    // Constants
    POMODORO_TIME: 25 * 60,
    SHORT_BREAK_TIME: 5 * 60,
    LONG_BREAK_TIME: 15 * 60,
    
    // State
    timeLeft: 0,
    timer: null,
    isRunning: false,
    currentMode: "pomodoro",
    
    // Initialize timer
    init() {
        this.timeLeft = this.POMODORO_TIME;
        this.updateDisplay();
    },
    
    // Get current time constants
    getTimeForMode(mode) {
        switch(mode) {
            case "pomodoro": return this.POMODORO_TIME;
            case "short": return this.SHORT_BREAK_TIME;
            case "long": return this.LONG_BREAK_TIME;
            default: return this.POMODORO_TIME;
        }
    },
    
    // Update display
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        updateTimerDisplay(minutes, seconds);
    },
    
    // Start or pause timer
    startTimer(onTick, onFinish) {
        if (!this.isRunning) {
            this.isRunning = true;
            updateStartButtonText("Pause");
            setNextButtonVisibility(true);
            
            this.timer = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();
                
                if (onTick) onTick();
                
                if (this.timeLeft <= 0) {
                    this.stop();
                    if (onFinish) onFinish();
                }
            }, 1000);
        } else {
            this.pause();
        }
    },
    
    // Pause timer
    pause() {
        clearInterval(this.timer);
        this.isRunning = false;
        updateStartButtonText("Resume");
        setNextButtonVisibility(false);
    },
    
    // Stop timer completely
    stop() {
        clearInterval(this.timer);
        this.isRunning = false;
        updateStartButtonText("Start");
        setNextButtonVisibility(false);
    },
    
    // Change mode
    changeMode(mode) {
        this.stop();
        this.currentMode = mode;
        this.timeLeft = this.getTimeForMode(mode);
        setActiveMode(mode);
        setBodyMode(mode);
        this.updateDisplay();
    },
    
    // Check if in break mode
    isBreakMode() {
        return this.currentMode !== "pomodoro";
    },
    
    // Get duration in minutes for current mode
    getDurationInMinutes() {
        return Math.round(this.getTimeForMode(this.currentMode) / 60);
    }
};
