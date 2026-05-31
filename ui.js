// UI Utilities and DOM Management

// Cached DOM Elements
const DOM = {
    // Timer elements
    timerDisplay: document.querySelector(".display h1"),
    startBtn: document.querySelector(".start-btn"),
    nextBtn: document.querySelector(".next-btn"),
    
    // Mode buttons
    pomodoroBtn: document.querySelector(".active-btn"),
    breakBtns: document.querySelectorAll(".main-btn"),
    modeBtns: document.querySelectorAll(".active-btn, .main-btn"),
    
    // Task elements
    taskBox: document.querySelector(".task-box"),
    taskPopup: document.querySelector(".task-popup"),
    taskList: document.querySelector(".task-list"),
    cancelPopupBtn: document.querySelector(".cancel-popup-btn"),
    savePopupBtn: document.querySelector(".save-popup-btn"),
    popupTaskInput: document.querySelector(".popup-task-input"),
    countInput: document.querySelector(".count-input"),
    upBtn: document.querySelector(".up-btn"),
    downBtn: document.querySelector(".down-btn"),
    taskDotsButton: document.querySelector(".dots-btn"),
    taskMenu: document.querySelector("#task-menu"),
    clearFinishedBtn: document.querySelector("[data-action='clear-finished']"),
    clearAllBtn: document.querySelector("[data-action='clear-all']"),
    statusNumber: document.querySelector(".status-box span"),
    
    // Break modal
    breakOverlay: document.querySelector(".break-modal-overlay"),
    shortBreakBtn: document.querySelector(".short-break-btn"),
    longBreakBtn: document.querySelector(".long-break-btn"),
    
    // Report elements
    reportBtn: document.querySelector(".top-btn.report-btn"),
    reportPage: document.querySelector("#report-page"),
    reportCloseBtn: document.querySelector(".report-close-btn"),
    clearReportBtn: document.querySelector(".clear-report-btn"),
    page: document.querySelector(".page"),
    
    // Heatmap elements
    prevMonthBtn: document.querySelector("#prev-month"),
    nextMonthBtn: document.querySelector("#next-month"),
    heatmapMonthYear: document.querySelector("#heatmap-month-year"),
};

// Utility function to toggle visibility
function setNextButtonVisibility(visible) {
    if (!DOM.nextBtn) return;
    DOM.nextBtn.classList.toggle("visible", visible);
}

// Break selector modal
function showBreakSelector(activeTaskId) {
    if (!DOM.breakOverlay) return;
    DOM.breakOverlay.classList.remove("hidden");
}

function hideBreakSelector() {
    if (!DOM.breakOverlay) return;
    DOM.breakOverlay.classList.add("hidden");
}

// Report modal
function openReportPage() {
    if (!DOM.reportPage) return;
    DOM.reportPage.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeReportPage() {
    if (!DOM.reportPage) return;
    DOM.reportPage.classList.add("hidden");
    document.body.style.overflow = "auto";
}

// Task popup
function openAddPopup() {
    if (!DOM.taskPopup || !DOM.popupTaskInput || !DOM.countInput) return;
    DOM.popupTaskInput.value = "";
    DOM.countInput.value = "1";
    DOM.taskPopup.classList.remove("hidden");
    DOM.taskBox.style.display = "none";
    DOM.page.classList.add("page-expanded");
    
    const deleteBtn = document.querySelector(".delete-popup-btn");
    if (deleteBtn) deleteBtn.style.display = "none";
}

function openEditPopup(taskTitle, estimatedPomodoros) {
    if (!DOM.taskPopup || !DOM.popupTaskInput || !DOM.countInput) return;
    DOM.popupTaskInput.value = taskTitle;
    DOM.countInput.value = estimatedPomodoros;
    DOM.taskPopup.classList.remove("hidden");
    DOM.taskBox.style.display = "none";
    DOM.page.classList.add("page-expanded");
}

function closePopup() {
    if (!DOM.taskPopup || !DOM.popupTaskInput || !DOM.countInput) return;
    DOM.taskPopup.classList.add("hidden");
    DOM.taskBox.style.display = "flex";
    DOM.page.classList.remove("page-expanded");
    DOM.popupTaskInput.value = "";
    DOM.countInput.value = "1";
}

// Task menu
function toggleTaskMenu() {
    if (!DOM.taskMenu) return;
    DOM.taskMenu.classList.toggle("hidden");
}

function closeTaskMenu() {
    if (!DOM.taskMenu) return;
    DOM.taskMenu.classList.add("hidden");
}

// Counter buttons
function incrementCounter() {
    if (!DOM.countInput) return;
    DOM.countInput.value = parseInt(DOM.countInput.value) + 1;
}

function decrementCounter() {
    if (!DOM.countInput) return;
    const currentValue = parseInt(DOM.countInput.value);
    if (currentValue > 1) {
        DOM.countInput.value = currentValue - 1;
    }
}

// Update UI displays
function updateStatusNumber(activeIndex) {
    if (!DOM.statusNumber) return;
    DOM.statusNumber.textContent = activeIndex >= 0 ? `#${activeIndex + 1}` : "#0";
}

function updateTimerDisplay(minutes, seconds) {
    if (!DOM.timerDisplay) return;
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");
    DOM.timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
}

function updateStartButtonText(text) {
    if (!DOM.startBtn) return;
    DOM.startBtn.textContent = text;
}

// Mode activation
function setActiveMode(mode) {
    DOM.modeBtns.forEach((btn) => {
        btn.classList.remove("mode-active");
    });
    
    if (mode === "pomodoro") {
        DOM.pomodoroBtn.classList.add("mode-active");
    } else if (mode === "short") {
        DOM.breakBtns[0].classList.add("mode-active");
    } else if (mode === "long") {
        DOM.breakBtns[1].classList.add("mode-active");
    }
}

function setBodyMode(mode) {
    if (mode === "pomodoro") {
        document.body.className = "";
    } else if (mode === "short") {
        document.body.className = "short-mode";
    } else if (mode === "long") {
        document.body.className = "long-mode";
    }
}
