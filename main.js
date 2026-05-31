// Main Initialization and Event Listeners

// State for pending task after break
let pendingTaskAfterBreak = false;
let pendingTaskId = null;

// Initialize everything
function initializeApp() {
    // Initialize modules
    Tasks.init();
    Report.init();
    Timer.init();
    
    // Render initial UI
    Tasks.render();
}

// Timer event handlers
function onTimerTick() {
    // Optional: Add tick handlers here
}

function onTimerFinish() {
    if (Timer.currentMode === "pomodoro") {
        Report.addFocusSession(Timer.getDurationInMinutes());
        showBreakSelector(Tasks.activeTaskId);
    } else {
        completePendingTaskAfterBreak();
        Timer.changeMode("pomodoro");
    }
}

function completePendingTaskAfterBreak() {
    if (!pendingTaskAfterBreak || pendingTaskId === null) {
        pendingTaskAfterBreak = false;
        pendingTaskId = null;
        return;
    }
    
    if (Tasks.completePomodoro(pendingTaskId)) {
        Report.syncTaskMetrics();
    }
    
    pendingTaskAfterBreak = false;
    pendingTaskId = null;
    Tasks.render();
    
    if (DOM.reportPage && !DOM.reportPage.classList.contains("hidden")) {
        renderReportPage();
    }
}

function renderReportPage() {
    const focusLabel = document.getElementById("report-focus-time");
    const pomodoroLabel = document.getElementById("report-pomodoro-count");
    const taskLabel = document.getElementById("report-tasks-completed");
    const streakLabel = document.getElementById("report-current-streak");
    const insightMost = document.getElementById("insight-most-productive");
    const insightAverage = document.getElementById("insight-average-session");
    const insightMonth = document.getElementById("insight-month-hours");
    const insightCompletion = document.getElementById("insight-completion");
    const sessionHistory = document.getElementById("session-history");
    const streakCurrent = document.getElementById("streak-current");
    const streakLongest = document.getElementById("streak-longest");
    const streakConsistency = document.getElementById("streak-consistency");
    
    const analytics = Tasks.getAnalytics();
    const completion = Report.getCompletionPercentage();
    const consistency = Report.getWeeklyConsistency();
    
    // Update labels
    if (focusLabel) focusLabel.textContent = `${Report.reportData.totalFocusMinutes}m`;
    if (pomodoroLabel) pomodoroLabel.textContent = `${Report.reportData.totalPomodoros}`;
    if (taskLabel) taskLabel.textContent = `${Report.reportData.totalCompletedTasks}`;
    if (streakLabel) streakLabel.textContent = `${Report.reportData.currentStreak} days`;
    if (insightMost) insightMost.textContent = `You focused most on ${Report.getMostProductiveDay()}.`;
    if (insightAverage) insightAverage.textContent = `Your average session is ${Report.getAverageSession()} minutes.`;
    if (insightMonth) insightMonth.textContent = `This month you focused ${Math.floor(Report.reportData.totalFocusMinutes / 60)} hours.`;
    if (insightCompletion) insightCompletion.textContent = `Completion percentage is ${completion}%`;
    if (streakCurrent) streakCurrent.textContent = `${Report.reportData.currentStreak} day streak`;
    if (streakLongest) streakLongest.textContent = `Longest streak: ${Report.reportData.longestStreak} days`;
    if (streakConsistency) streakConsistency.textContent = `Weekly consistency: ${consistency}%`;
    
    // Render session history
    if (sessionHistory) {
        sessionHistory.innerHTML = "";
        Report.reportData.sessionHistory.forEach((entry) => {
            const item = document.createElement("div");
            item.className = "session-item";
            item.innerHTML = `
                <span class="session-status">${entry.label}</span>
                <div>
                    <p class="session-label">${entry.description}</p>
                    <p class="session-time">${entry.time}</p>
                </div>
            `;
            sessionHistory.appendChild(item);
        });
    }
    
    // Render charts and heatmap
    Charts.buildWeeklyChart(Report.reportData);
    Charts.buildTaskChart(analytics);
    Heatmap.render(Report.reportData);
}

// Event Listeners

// Timer controls
if (DOM.startBtn) {
    DOM.startBtn.addEventListener("click", () => {
        Timer.startTimer(onTimerTick, onTimerFinish);
    });
}

if (DOM.nextBtn) {
    DOM.nextBtn.addEventListener("click", () => {
        if (Timer.currentMode === "pomodoro") {
            onTimerFinish();
        } else if (Timer.isBreakMode()) {
            Timer.stop();
            pendingTaskAfterBreak = true;
            pendingTaskId = Tasks.activeTaskId;
            completePendingTaskAfterBreak();
            Timer.changeMode("pomodoro");
        }
    });
}

// Mode buttons
if (DOM.pomodoroBtn) {
    DOM.pomodoroBtn.addEventListener("click", () => Timer.changeMode("pomodoro"));
}

if (DOM.breakBtns[0]) {
    DOM.breakBtns[0].addEventListener("click", () => Timer.changeMode("short"));
}

if (DOM.breakBtns[1]) {
    DOM.breakBtns[1].addEventListener("click", () => Timer.changeMode("long"));
}

// Break modal
if (DOM.shortBreakBtn) {
    DOM.shortBreakBtn.addEventListener("click", () => {
        hideBreakSelector();
        Report.addBreakSession("short");
        Timer.changeMode("short");
    });
}

if (DOM.longBreakBtn) {
    DOM.longBreakBtn.addEventListener("click", () => {
        hideBreakSelector();
        Report.addBreakSession("long");
        Timer.changeMode("long");
    });
}

// Report modal
if (DOM.reportBtn) {
    DOM.reportBtn.addEventListener("click", () => {
        openReportPage();
        renderReportPage();
    });
}

if (DOM.reportCloseBtn) {
    DOM.reportCloseBtn.addEventListener("click", closeReportPage);
}

if (DOM.clearReportBtn) {
    DOM.clearReportBtn.addEventListener("click", () => {
        if (Report.clearReport()) {
            renderReportPage();
        }
    });
}

// Heatmap navigation
if (DOM.prevMonthBtn) {
    DOM.prevMonthBtn.addEventListener("click", () => Heatmap.previousMonth());
}

if (DOM.nextMonthBtn) {
    DOM.nextMonthBtn.addEventListener("click", () => Heatmap.nextMonth());
}

// Task creation
if (DOM.taskBox) {
    DOM.taskBox.addEventListener("click", () => {
        Tasks.editingTaskId = null;
        openAddPopup();
    });
}

// Task popup
if (DOM.cancelPopupBtn) {
    DOM.cancelPopupBtn.addEventListener("click", closePopup);
}

if (DOM.savePopupBtn) {
    DOM.savePopupBtn.addEventListener("click", () => {
        const taskName = DOM.popupTaskInput.value;
        const estimatedPomodoros = parseInt(DOM.countInput.value) || 1;
        
        if (!taskName.trim()) {
            alert("Please enter a task name");
            return;
        }
        
        if (Tasks.editingTaskId !== null) {
            Tasks.updateTask(Tasks.editingTaskId, taskName, estimatedPomodoros);
        } else {
            Tasks.createTask(taskName, estimatedPomodoros);
        }
        
        Report.syncTaskMetrics();
        Tasks.render();
        
        if (DOM.reportPage && !DOM.reportPage.classList.contains("hidden")) {
            renderReportPage();
        }
        
        closePopup();
    });
}

// Counter buttons
if (DOM.upBtn) {
    DOM.upBtn.addEventListener("click", incrementCounter);
}

if (DOM.downBtn) {
    DOM.downBtn.addEventListener("click", decrementCounter);
}

// Task menu
if (DOM.taskDotsButton && DOM.taskMenu) {
    DOM.taskDotsButton.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleTaskMenu();
    });
}

document.addEventListener("click", (event) => {
    if (!DOM.taskMenu || !DOM.taskDotsButton) return;
    if (DOM.taskMenu.classList.contains("hidden")) return;
    if (event.target === DOM.taskDotsButton || DOM.taskMenu.contains(event.target)) return;
    closeTaskMenu();
});

if (DOM.clearFinishedBtn) {
    DOM.clearFinishedBtn.addEventListener("click", () => {
        Tasks.clearCompleted();
        Report.syncTaskMetrics();
        Tasks.render();
        closeTaskMenu();
    });
}

if (DOM.clearAllBtn) {
    DOM.clearAllBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete all tasks?")) {
            Tasks.clearAll();
            Report.syncTaskMetrics();
            Tasks.render();
            closeTaskMenu();
        }
    });
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", initializeApp);
