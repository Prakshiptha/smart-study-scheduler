// script.js
document.addEventListener('DOMContentLoaded', function() {
    const subjectInput = document.getElementById('subjectInput');
    const hoursInput = document.getElementById('hoursInput');
    const priorityInput = document.getElementById('priorityInput');
    const difficultyInput = document.getElementById('difficultyInput');
    const addBtn = document.getElementById('addBtn');
    const subjectList = document.getElementById('subjectList');
    const studyDays = document.getElementById('studyDays');
    const dailyHours = document.getElementById('dailyHours');
    const energyPeak = document.getElementById('energyPeak');
    const enableSpacedRepetition = document.getElementById('enableSpacedRepetition');
    const generateBtn = document.getElementById('generateBtn');
    const scheduleResult = document.getElementById('scheduleResult');
    const filterAll = document.getElementById('filterAll');
    const filterHigh = document.getElementById('filterHigh');
    const filterMedium = document.getElementById('filterMedium');
    const filterLow = document.getElementById('filterLow');
    const totalHours = document.getElementById('totalHours');
    const completedHours = document.getElementById('completedHours');
    const exportBtn = document.getElementById('exportBtn');
    const printBtn = document.getElementById('printBtn');
    const revisionModal = document.getElementById('revisionModal');
    const closeModal = document.querySelector('.close');
    const revisionSchedule = document.getElementById('revisionSchedule');

    // App State
    let subjects = JSON.parse(localStorage.getItem('studySubjects')) || [];
    let currentFilter = 'all';
    
    // Initialize the app
    function init() {
        renderSubjectList();
        updateStats();
        setupEventListeners();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        addBtn.addEventListener('click', addSubject);
        subjectList.addEventListener('click', handleSubjectActions);
        generateBtn.addEventListener('click', generateSchedule);
        filterAll.addEventListener('click', () => setFilter('all'));
        filterHigh.addEventListener('click', () => setFilter('high'));
        filterMedium.addEventListener('click', () => setFilter('medium'));
        filterLow.addEventListener('click', () => setFilter('low'));
        exportBtn.addEventListener('click', exportSchedule);
        printBtn.addEventListener('click', printSchedule);
        closeModal.addEventListener('click', () => revisionModal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === revisionModal) {
                revisionModal.style.display = 'none';
            }
        });
    }
    
    // Add a new subject
    function addSubject() {
        const name = subjectInput.value.trim();
        const hours = parseFloat(hoursInput.value);
        const priority = priorityInput.value;
        const difficulty = difficultyInput.value;
        
        if (name && !isNaN(hours)) {
            const subject = {
                id: Date.now(),
                name,
                hours,
                priority,
                difficulty,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            subjects.push(subject);
            saveSubjects();
            renderSubjectList();
            updateStats();
            
            // Clear inputs
            subjectInput.value = '';
            hoursInput.value = '1';
        }
    }
    
    // Handle subject actions (complete, delete, etc.)
    function handleSubjectActions(e) {
        const id = parseInt(e.target.closest('button')?.dataset?.id);
        if (!id) return;
        
        const subjectIndex = subjects.findIndex(s => s.id === id);
        if (subjectIndex === -1) return;
        
        if (e.target.classList.contains('complete-btn')) {
            subjects[subjectIndex].completed = !subjects[subjectIndex].completed;
        } else if (e.target.classList.contains('delete-btn')) {
            subjects.splice(subjectIndex, 1);
        } else if (e.target.classList.contains('revise-btn')) {
            showRevisionSchedule(subjects[subjectIndex]);
            return;
        }
        
        saveSubjects();
        renderSubjectList();
        updateStats();
    }
    
    // Render the subject list
    function renderSubjectList() {
        subjectList.innerHTML = '';
        
        const filteredSubjects = subjects.filter(subject => {
            if (currentFilter === 'all') return true;
            return subject.priority === currentFilter;
        });
        
        if (filteredSubjects.length === 0) {
            subjectList.innerHTML = '<li class="empty">No subjects found. Add some to get started!</li>';
            return;
        }
        
        filteredSubjects.forEach(subject => {
            const li = document.createElement('li');
            li.className = `priority-${subject.priority} ${subject.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <div class="subject-info">
                    <div class="subject-name">${subject.name}</div>
                    <div class="subject-meta">
                        <span>${subject.hours} hrs</span>
                        <span class="priority-badge ${subject.priority}">${subject.priority}</span>
                        <span class="difficulty-badge ${subject.difficulty}">${subject.difficulty}</span>
                    </div>
                </div>
                <div class="subject-actions">
                    <button class="action-btn complete-btn" data-id="${subject.id}" title="${subject.completed ? 'Mark pending' : 'Mark complete'}">
                        <i class="fas fa-${subject.completed ? 'undo' : 'check'}"></i>
                    </button>
                    <button class="action-btn revise-btn" data-id="${subject.id}" title="Schedule revisions">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${subject.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            subjectList.appendChild(li);
        });
    }
    
    // Set the current filter
    function setFilter(filter) {
        currentFilter = filter;
        document.querySelectorAll('.btn-filter').forEach(btn => {
            btn.classList.toggle('active', btn.id === `filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`);
        });
        renderSubjectList();
    }
    
    // Update statistics
    function updateStats() {
        const total = subjects.reduce((sum, subject) => sum + subject.hours, 0);
        const completed = subjects.reduce((sum, subject) => sum + (subject.completed ? subject.hours : 0), 0);
        
        totalHours.textContent = `Total: ${total.toFixed(1)} hours`;
        completedHours.textContent = `Completed: ${completed.toFixed(1)} hours`;
    }
    
    // Save subjects to localStorage
    function saveSubjects() {
        localStorage.setItem('studySubjects', JSON.stringify(subjects));
    }
    
    // Generate the study schedule
    function generateSchedule() {
        const days = parseInt(studyDays.value);
        const hoursPerDay = parseFloat(dailyHours.value);
        const peakTime = energyPeak.value;
        const useSpacedRepetition = enableSpacedRepetition.checked;
        
        if (subjects.length === 0) {
            alert('Please add some subjects first!');
            return;
        }
        
        if (isNaN(days) || days < 1) {
            alert('Please enter valid number of days');
            return;
        }
        
        if (isNaN(hoursPerDay) || hoursPerDay < 0.5) {
            alert('Please enter valid daily study hours');
            return;
        }
        const activeSubjects = subjects.filter(s => !s.completed);
        
        if (activeSubjects.length === 0) {
            scheduleResult.innerHTML = '<p>All subjects are marked as completed!</p>';
            return;
        }
        const schedule = createSmartSchedule(activeSubjects, days, hoursPerDay, peakTime, useSpacedRepetition);
        displaySchedule(schedule);
    }
    function createSmartSchedule(subjects, days, hoursPerDay, peakTime, useSpacedRepetition) {
        const sortedSubjects = [...subjects].sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            const difficultyOrder = { hard: 3, medium: 2, easy: 1 };
            return difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty];
        });
        const totalNeededHours = sortedSubjects.reduce((sum, s) => sum + s.hours, 0);
        const totalAvailableHours = days * hoursPerDay;
        if (totalNeededHours > totalAvailableHours) {
            const adjustmentFactor = totalAvailableHours / totalNeededHours;
            sortedSubjects.forEach(s => {
                s.adjustedHours = parseFloat((s.hours * adjustmentFactor).toFixed(1));
            });
        } else {
            sortedSubjects.forEach(s => {
                s.adjustedHours = s.hours;
            });
        }
        const schedule = [];
        let currentDay = 1;
        let dayHoursUsed = 0;
        
        for (const subject of sortedSubjects) {
            let remainingSubjectHours = subject.adjustedHours;
            
            while (remainingSubjectHours > 0 && currentDay <= days) {
                if (!schedule[currentDay - 1]) {
                    schedule[currentDay - 1] = {
                        day: currentDay,
                        morning: [],
                        afternoon: [],
                        evening: []
                    };
                }
                
                const availableHours = hoursPerDay - dayHoursUsed;
                const hoursToAssign = Math.min(availableHours, remainingSubjectHours);
                
                if (hoursToAssign > 0) {
                    const timeSlot = (subject.difficulty === 'hard' && peakTime) ? peakTime : 
                                   (subject.difficulty === 'easy') ? getOppositeTime(peakTime) : 
                                   getNeutralTime(peakTime);
                    
                    schedule[currentDay - 1][timeSlot].push({
                        ...subject,
                        scheduledHours: hoursToAssign
                    });
                    
                    dayHoursUsed += hoursToAssign;
                    remainingSubjectHours -= hoursToAssign;
                }
                
                if (dayHoursUsed >= hoursPerDay) {
                    currentDay++;
                    dayHoursUsed = 0;
                }
            }
        }
        if (useSpacedRepetition) {
            addSpacedRepetition(schedule, days, hoursPerDay);
        }
        
        return schedule;
    }
    function getOppositeTime(peakTime) {
        const times = ['morning', 'afternoon', 'evening'];
        const oppositeIndex = (times.indexOf(peakTime) + 1) % 3;
        return times[oppositeIndex];
    }
    function getNeutralTime(peakTime) {
        const times = ['morning', 'afternoon', 'evening'];
        const neutralIndex = (times.indexOf(peakTime) + 2) % 3;
        return times[neutralIndex];
    }
    function addSpacedRepetition(schedule, totalDays, hoursPerDay) {
        const repetitionDays = [1, 2, 4, 7, 15];
        
        schedule.forEach((day, index) => {
            const dayNumber = index + 1;
            repetitionDays.forEach(interval => {
                const reviewDay = dayNumber + interval;
                if (reviewDay <= totalDays) {
                    day.morning.concat(day.afternoon, day.evening).forEach(topic => {
                        const reviewHours = Math.min(0.5, topic.scheduledHours * 0.3); 
                        
                        if (!schedule[reviewDay - 1]) {
                            schedule[reviewDay - 1] = {
                                day: reviewDay,
                                morning: [],
                                afternoon: [],
                                evening: []
                            };
                        }
                        const currentDayHours = schedule[reviewDay - 1].morning.concat(
                            schedule[reviewDay - 1].afternoon,
                            schedule[reviewDay - 1].evening
                        ).reduce((sum, t) => sum + t.scheduledHours, 0);
                        
                        if (currentDayHours + reviewHours <= hoursPerDay) {
                            schedule[reviewDay - 1].morning.push({
                                ...topic,
                                scheduledHours: reviewHours,
                                isRevision: true
                            });
                        }
                    });
                }
            });
        });
    }
    
    // Display the generated schedule
    function displaySchedule(schedule) {
        scheduleResult.innerHTML = '';
        
        if (!schedule || schedule.length === 0) {
            scheduleResult.innerHTML = '<p>No schedule could be generated with the current inputs.</p>';
            return;
        }
        
        schedule.forEach(day => {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-schedule';
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.innerHTML = `
                <span class="day-title">Day ${day.day}</span>
                <span class="day-total">Total: ${calculateDayHours(day).toFixed(1)} hours</span>
            `;
            dayDiv.appendChild(dayHeader);
            
            const timeSlots = ['morning', 'afternoon', 'evening'];
            timeSlots.forEach(slot => {
                if (day[slot].length > 0) {
                    const slotDiv = document.createElement('div');
                    slotDiv.className = 'time-slot';
                    
                    const slotTitle = document.createElement('div');
                    slotTitle.className = 'slot-title';
                    slotTitle.textContent = `${slot.charAt(0).toUpperCase() + slot.slice(1)}:`;
                    slotDiv.appendChild(slotTitle);
                    
                    const topicList = document.createElement('div');
                    topicList.className = 'topic-list';
                    
                    day[slot].forEach(topic => {
                        const topicDiv = document.createElement('div');
                        topicDiv.className = 'topic-item';
                        
                        const revisionBadge = topic.isRevision ? 
                            '<span class="revision-badge">Revision</span>' : '';
                        
                        topicDiv.innerHTML = `
                            <div class="topic-name">
                                ${topic.name} ${revisionBadge}
                            </div>
                            <div class="topic-meta">
                                <span>${topic.scheduledHours} hrs</span>
                                <span class="priority-badge ${topic.priority}">${topic.priority}</span>
                                <span class="difficulty-badge ${topic.difficulty}">${topic.difficulty}</span>
                            </div>
                        `;
                        topicList.appendChild(topicDiv);
                    });
                    
                    slotDiv.appendChild(topicList);
                    dayDiv.appendChild(slotDiv);
                }
            });
            
            scheduleResult.appendChild(dayDiv);
        });
    }
    
    // Calculate total hours for a day
    function calculateDayHours(day) {
        return day.morning.concat(day.afternoon, day.evening)
            .reduce((sum, topic) => sum + topic.scheduledHours, 0);
    }
    
    // Show revision schedule for a specific topic
    function showRevisionSchedule(topic) {
        revisionSchedule.innerHTML = `
            <h4>${topic.name} - Revision Schedule</h4>
            <p>Based on spaced repetition principles, here are the optimal times to review this material:</p>
            <ul class="revision-dates">
                <li><strong>Initial Study:</strong> Today</li>
                <li><strong>First Review:</strong> 1 day later</li>
                <li><strong>Second Review:</strong> 2 days after first review</li>
                <li><strong>Third Review:</strong> 4 days after second review</li>
                <li><strong>Final Review:</strong> 1 week before exam</li>
            </ul>
            <p>Recommended review duration: ${Math.min(0.5, topic.hours * 0.3).toFixed(1)} hours per session</p>
        `;
        revisionModal.style.display = 'block';
    }
    
    // Export schedule
    function exportSchedule() {
        const scheduleHtml = scheduleResult.innerHTML;
        if (!scheduleHtml) {
            alert('Generate a schedule first!');
            return;
        }
        
        const blob = new Blob([`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Study Schedule Export</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .day-schedule { margin-bottom: 20px; }
                    .day-header { background: #4361ee; color: white; padding: 10px; }
                    .topic-item { margin: 5px 0; padding: 5px; background: #f0f0f0; }
                </style>
            </head>
            <body>
                <h1>Study Schedule</h1>
                ${scheduleHtml}
            </body>
            </html>
        `], { type: 'text/html' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'study_schedule.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Print schedule
    function printSchedule() {
        const scheduleHtml = scheduleResult.innerHTML;
        if (!scheduleHtml) {
            alert('Generate a schedule first!');
            return;
        }
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Study Schedule</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    .day-schedule { margin-bottom: 20px; page-break-inside: avoid; }
                    .day-header { background: #4361ee; color: white; padding: 10px; }
                    .topic-item { margin: 5px 0; padding: 5px; background: #f0f0f0; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <h1>Study Schedule</h1>
                ${scheduleHtml}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }
    
    // Initialize the app
    init();
});