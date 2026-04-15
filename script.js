function renderHabits() {
  habitList.innerHTML = "";
  const sortedHabits = getSortedHabits();

  sortedHabits.forEach((habit) => {
    const li = document.createElement("li");
    li.className = "habit-card";
    li.draggable = true;
    li.dataset.habitId = habit.id;

    const locked = isHabitLockedForWeek(habit);

    if (habit.doneToday) {
      li.classList.add("completed");
    }

    if (locked) {
      li.classList.add("locked");
    }

    const progressPercent = Math.min((habit.completedDays / habit.targetDays) * 100, 100);
    const badgeHtml = getHabitBadgesHtml(habit);
    const heatmapHtml = renderHeatmap(habit);

    li.innerHTML = `
      <div class="habit-main-row">
        <button
          class="habit-check-btn ${habit.doneToday ? "checked" : ""} ${locked ? "locked" : ""}"
          onclick="event.stopPropagation(); toggleHabitById('${habit.id}')"
          ${locked ? "disabled" : ""}
          aria-label="${locked ? "Habit locked for this week" : (habit.doneToday ? "Undo today's completion" : "Mark habit complete")}"
          title="${locked ? "Weekly target already reached" : (habit.doneToday ? "Undo today" : "Complete today")}"
        >
          ${locked ? "🏆" : (habit.doneToday ? "✓" : "")}
        </button>

        <div class="habit-body">
          <div class="habit-top-row">
            <div class="habit-name">${habit.name}</div>
            ${badgeHtml}
          </div>

          <div class="habit-stats">
            🎯 ${habit.completedDays}/${habit.targetDays} this week • 🔥 ${habit.streak} • ✅ ${habit.total} • 🏆 ${habit.perfectWeeks || 0}
          </div>

          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progressPercent}%"></div>
          </div>

          <div class="habit-action-row">
            <div class="habit-action-meta">
              ${locked ? "Locked until next week" : (habit.doneToday ? "Marked today" : "Available today")}
            </div>

            <button
              class="secondary-btn small-btn habit-details-btn"
              onclick="event.stopPropagation(); openHabitDetailById('${habit.id}')"
            >
              Details
            </button>
          </div>

          ${heatmapHtml}
        </div>
      </div>

      <div class="card-controls">
        <button class="drag-handle" title="Reorder" aria-label="Reorder habit">⋮⋮</button>
        <button class="delete-btn" onclick="event.stopPropagation(); openDeleteModalById('${habit.id}');">❌</button>
      </div>
    `;

    li.addEventListener("dragstart", () => {
      draggedHabitId = habit.id;
      li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
      draggedHabitId = null;
      li.classList.remove("dragging");
    });

    li.addEventListener("dragover", event => {
      event.preventDefault();
    });

    li.addEventListener("drop", event => {
      event.preventDefault();
      if (!draggedHabitId || draggedHabitId === habit.id) return;
      reorderHabit(draggedHabitId, habit.id);
    });

    habitList.appendChild(li);
  });

  updateWeeklySummary();
  updateWeeklyChart();
  updateInsights();
  updateTodaySection();
  renderMonthlyCalendar();
  updateYearAchievements();
  updateEmptyState();
  maybeShowRestoreBanner();

  if (selectedHabitId) {
    renderHabitDetail();
  }
}
