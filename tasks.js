// Task Management and Persistence

const Tasks = {
    // State
    tasks: [],
    taskIdCounter: 0,
    activeTaskId: null,
    editingTaskId: null,
    
    // Storage key
    STORAGE_KEY: "pomodoroTasks",
    COUNTER_KEY: "pomodoroTaskIdCounter",
    ACTIVE_KEY: "pomodoroActiveTaskId",
    
    // Initialize
    init() {
        this.loadTasks();
        this.render();
    },
    
    // Load tasks from localStorage
    loadTasks() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.tasks = JSON.parse(stored);
            }
            
            const counter = localStorage.getItem(this.COUNTER_KEY);
            if (counter) {
                this.taskIdCounter = parseInt(counter);
            }
            
            const activeId = localStorage.getItem(this.ACTIVE_KEY);
            if (activeId) {
                this.activeTaskId = parseInt(activeId);
            }
        } catch (error) {
            console.error("Failed to load tasks:", error);
            this.tasks = [];
        }
    },
    
    // Save tasks to localStorage
    saveTasks() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks));
            localStorage.setItem(this.COUNTER_KEY, String(this.taskIdCounter));
            localStorage.setItem(this.ACTIVE_KEY, String(this.activeTaskId));
        } catch (error) {
            console.error("Failed to save tasks:", error);
        }
    },
    
    // Get task by ID
    getTaskById(taskId) {
        return this.tasks.find((task) => task.id === taskId);
    },
    
    // Create new task
    createTask(title, estimatedPomodoros) {
        if (!title.trim()) return null;
        
        const newTask = {
            id: this.taskIdCounter++,
            title: title.trim(),
            estimatedPomodoros: Math.max(1, estimatedPomodoros),
            completedPomodoros: 0,
            completed: false,
            createdAt: new Date().toISOString(),
        };
        
        this.tasks.push(newTask);
        
        if (this.activeTaskId === null) {
            this.activeTaskId = newTask.id;
        }
        
        this.saveTasks();
        return newTask;
    },
    
    // Update task
    updateTask(taskId, title, estimatedPomodoros) {
        const task = this.getTaskById(taskId);
        if (!task) return false;
        
        task.title = title.trim();
        task.estimatedPomodoros = Math.max(1, estimatedPomodoros);
        this.updateTaskCompletionStatus(task);
        this.saveTasks();
        return true;
    },
    
    // Delete task
    deleteTask(taskId) {
        this.tasks = this.tasks.filter((t) => t.id !== taskId);
        
        if (this.activeTaskId === taskId) {
            this.activeTaskId = null;
        }
        
        this.saveTasks();
        return true;
    },
    
    // Clear completed tasks
    clearCompleted() {
        this.tasks = this.tasks.filter((task) => !task.completed);
        
        if (this.activeTaskId !== null && !this.getTaskById(this.activeTaskId)) {
            this.activeTaskId = null;
        }
        
        this.saveTasks();
    },
    
    // Clear all tasks
    clearAll() {
        this.tasks = [];
        this.activeTaskId = null;
        this.saveTasks();
    },
    
    // Set active task
    setActiveTask(taskId) {
        this.activeTaskId = taskId;
        this.saveTasks();
        this.render();
    },
    
    // Update task completion status
    updateTaskCompletionStatus(task) {
        task.completed = task.completedPomodoros >= task.estimatedPomodoros;
    },
    
    // Complete one pomodoro
    completePomodoro(taskId) {
        const task = this.getTaskById(taskId);
        if (!task || task.completed) return false;
        
        task.completedPomodoros = Math.min(task.estimatedPomodoros, task.completedPomodoros + 1);
        this.updateTaskCompletionStatus(task);
        this.saveTasks();
        return true;
    },
    
    // Get analytics
    getAnalytics() {
        const completed = this.tasks.filter((task) => task.completed).length;
        const incomplete = this.tasks.length - completed;
        const estimated = this.tasks.reduce((sum, task) => sum + task.estimatedPomodoros, 0);
        const completedPomodoros = this.tasks.reduce((sum, task) => sum + task.completedPomodoros, 0);
        
        return { completed, incomplete, estimated, completedPomodoros };
    },
    
    // Get active task index
    getActiveTaskIndex() {
        return this.tasks.findIndex((task) => task.id === this.activeTaskId);
    },
    
    // Create task card DOM element
    createTaskCard(task) {
        const taskCard = document.createElement("div");
        taskCard.className = `task-card${task.completed ? " completed" : ""}`;
        taskCard.dataset.taskId = task.id;
        
        taskCard.innerHTML = `
            <div class="task-card-left-bar"></div>
            <div class="task-card-content">
                <h3>${task.title}</h3>
                <div class="task-progress">${task.completedPomodoros}/${task.estimatedPomodoros}</div>
            </div>
            ${task.completed ? '<span class="task-completed-label">Completed</span>' : ""}
            <button class="task-dots-btn" type="button">⋮</button>
        `;
        
        taskCard.addEventListener("click", (e) => {
            if (e.target.classList.contains("task-dots-btn")) return;
            this.setActiveTask(task.id);
        });
        
        const dotsBtn = taskCard.querySelector(".task-dots-btn");
        dotsBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.editingTaskId = task.id;
            openEditPopup(task.title, task.estimatedPomodoros);
        });
        
        return taskCard;
    },
    
    // Render all tasks
    render() {
        if (!DOM.taskList) return;
        
        DOM.taskList.innerHTML = "";
        this.tasks.forEach((task) => {
            DOM.taskList.appendChild(this.createTaskCard(task));
        });
        
        this.updateActiveTaskVisual();
        this.updateStatusDisplay();
    },
    
    // Update visual indicator for active task
    updateActiveTaskVisual() {
        document.querySelectorAll(".task-card").forEach((card) => {
            card.classList.remove("active");
        });
        
        if (this.activeTaskId !== null) {
            const activeCard = document.querySelector(`[data-task-id="${this.activeTaskId}"]`);
            if (activeCard) {
                activeCard.classList.add("active");
            }
        }
    },
    
    // Update status display
    updateStatusDisplay() {
        const activeIndex = this.getActiveTaskIndex();
        updateStatusNumber(activeIndex);
    }
};
