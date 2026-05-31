// Chart Rendering Logic

const Charts = {
    // Chart instances
    weeklyChart: null,
    taskChart: null,
    
    // Build weekly focus chart
    buildWeeklyChart(reportData) {
        const ctx = document.getElementById("weekly-focus-chart");
        if (!ctx) return;
        
        const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, "rgba(123, 193, 255, 0.95)");
        gradient.addColorStop(1, "rgba(96, 73, 255, 0.4)");
        
        if (this.weeklyChart) {
            this.weeklyChart.destroy();
        }
        
        this.weeklyChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                datasets: [{
                    label: "Focus minutes",
                    data: reportData.weeklyFocus,
                    backgroundColor: gradient,
                    borderRadius: 16,
                    maxBarThickness: 32,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "rgba(16, 24, 52, 0.95)",
                        titleColor: "#f8fbff",
                        bodyColor: "#e8e8ff",
                        borderColor: "rgba(255,255,255,0.12)",
                        borderWidth: 1,
                        padding: 12,
                    },
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: "rgba(255,255,255,0.72)" },
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: "rgba(255,255,255,0.08)" },
                        ticks: { color: "rgba(255,255,255,0.72)", stepSize: 20 },
                    },
                },
            },
        });
    },
    
    // Build task analytics chart
    buildTaskChart(analytics) {
        const ctx = document.getElementById("task-analytics-chart");
        if (!ctx) return;
        
        const completed = analytics.completed;
        const incomplete = analytics.incomplete;
        
        if (this.taskChart) {
            this.taskChart.destroy();
        }
        
        this.taskChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Completed", "Incomplete"],
                datasets: [{
                    data: [completed, incomplete],
                    backgroundColor: ["#5ec9ff", "rgba(255,255,255,0.16)"],
                    borderWidth: 0,
                    hoverOffset: 10,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: { color: "rgba(255,255,255,0.75)" },
                    },
                    tooltip: {
                        backgroundColor: "rgba(16, 24, 52, 0.95)",
                        titleColor: "#f8fbff",
                        bodyColor: "#e8e8ff",
                        borderColor: "rgba(255,255,255,0.12)",
                        borderWidth: 1,
                        padding: 12,
                    },
                },
            },
        });
    }
};
