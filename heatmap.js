// Heatmap Logic with Correct Month Handling

const Heatmap = {
    // State
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    
    // Month names
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    
    // Get days in month (fixes February and different month lengths)
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },
    
    // Get first day of month (0 = Sunday)
    getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    },
    
    // Update header
    updateHeader() {
        if (!DOM.heatmapMonthYear) return;
        DOM.heatmapMonthYear.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
    },
    
    // Navigate to previous month
    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.updateHeader();
        this.render(Report.reportData);
    },
    
    // Navigate to next month
    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.updateHeader();
        this.render(Report.reportData);
    },
    
    // Render heatmap
    render(reportData) {
        const container = document.getElementById("report-heatmap");
        if (!container || !reportData) return;
        
        container.innerHTML = "";
        
        const daysInMonth = this.getDaysInMonth(this.currentYear, this.currentMonth);
        const firstDay = this.getFirstDayOfMonth(this.currentYear, this.currentMonth);
        const today = new Date();
        
        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement("div");
            empty.className = "heatmap-day empty";
            container.appendChild(empty);
        }
        
        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            const dateKey = this.getDateKey(date);
            
            const square = document.createElement("div");
            square.className = "heatmap-day";
            square.textContent = day;
            
            const dayOfMonth = day - 1;
            const minutes = reportData.monthlyHeatmap[dayOfMonth] || 0;
            const level = Math.min(4, Math.floor(minutes / 15));
            const shades = ["#252535", "#353545", "#454555", "#555565", "#656575"];
            square.style.background = shades[level];
            
            const isFuture = date > today;
            if (isFuture) {
                square.classList.add("future");
            }
            
            square.title = `${minutes} mins focused on ${date.toLocaleDateString()}`;
            container.appendChild(square);
        }
    },
    
    // Get date key for storage
    getDateKey(date) {
        return date.toISOString().split("T")[0];
    }
};
