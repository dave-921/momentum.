let habits = JSON.parse(localStorage.getItem("habits")) || [];

const today = new Date().toISOString().split("T")[0];
let habitIndexToDelete = null;
let celebrationToastTimeout = null;
let deferredPrompt = null;
let draggedHabitId = null;

// Add Habit modal elements
const habitModal = document.getElementById("habitModal");
const openModalBtn = document.getElementById("openModalBtn");
const mobileAddBtn = document.getElementById("mobileAddBtn");
const emptyStateAddBtn = document.getElementById("emptyStateAddBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const habitModalBackdrop = document.getElementById("habitModalBackdrop");
const habitForm = document.getElementById("habitForm");
const habitNameInput = document.getElementById("habitName");
const targetDaysInput = document.getElementById("targetDays");

// Delete modal elements
const deleteModal = document.getElementById("deleteModal");
const deleteModalBackdrop = document.getElementById("deleteModalBackdrop");
const deleteModalText = document.getElementById("deleteModalText");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

// Summary elements
const summaryCompleted = document.getElementById("summaryCompleted");
const summaryTargetsHit = document.getElementById("summaryTargetsHit");
const summaryProgress = document.getElementById("summaryProgress");
const summaryPerfectWeeks = document.getElementById("summaryPerfectWeeks");

// Empty state / sections
const emptyState = document.getElementById("emptyState");
const weeklySummary = document.getElementById("weeklySummary");
const chartCard = document.querySelector(".chart-card");
const insightsCard = document.getElementById("insightsCard");
const todayCard = document.getElementById("todayCard");
const todayList = document.getElementById("todayList");
const habitList = document.getElementById("habitList");

// Install banner
const installBanner = document.getElementById("installBanner");
const installAppBtn = document.getElementById("installAppBtn");
const dismissInstallBtn = document.getElementById("dismissInstallBtn");

// Celebration toast
const celebrationToast = document.getElementById("celebrationToast");
const celebrationToastMessage = document.getElementById("celebrationToastMessage");
const confettiLayer = document.getElementById("confettiLayer");

// Insights
const insightLongestStreak = document.getElementById("insightLongestStreak");
const insightLongestStreakSubtext = document.getElementById("insightLongestStreakSubtext");
const insightMostConsistent = document.getElementById("insightMostConsistent");
const insightMostConsistentSubtext = document.getElementById("insightMostConsistentSubtext");
const insightClosestTarget = document.getElementById("insightClosestTarget");
const insightClosestTargetSubtext = document.getElementById("insightClosestTargetSubtext");

function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

function getWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNum}`;
}

function currentWeekKey() {
  return getWeekKey(new Date());
}

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function getDayIndexFromDate(dateString) {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function getEmptyWeekHistory() {
  return [0, 0, 0, 0, 0, 0, 0];
}

function getEmptyRecentHistory() {
  return {};
}

function formatDateKey(date) {
  return date.toISOString().split("T")[0];
}

function getLast7Days() {
  const days = [];
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);

    days.push({
      key: formatDateKey(d),
      label: labels[d.getDay()],
      isToday: formatDateKey(d) === today
    });
  }

  return days;
}

function createId() {
  return `habit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureHabitDefaults(habit, currentWeek) {
  if (!habit.id) {
    habit.id = createId();
  }

  if (habit.order === undefined) {
    habit.order = 999999;
  }

  if (!habit.weekKey) {
    habit.weekKey = currentWeek;
  }

  if (habit.targetDays === undefined) {
    habit.targetDays = 1;
  }

  if (habit.completedDays === undefined) {
    habit.completedDays = 0;
  }

  if (habit.total === undefined) {
    habit.total = 0;
  }

  if (habit.streak === undefined) {
    habit.streak = 0;
  }

  if (habit.doneToday === undefined) {
    habit.doneToday = false;
  }

  if (!Array.isArray(habit.weekHistory) || habit.weekHistory.length !== 7) {
    habit.weekHistory = getEmptyWeekHistory();
  }

  if (habit.perfectWeeks === undefined) {
    habit.perfectWeeks = 0;
  }

  if (habit.countedPerfectWeek === undefined) {
    habit.countedPerfectWeek = false;
  }

  if (!habit.recentHistory || typeof habit.recentHistory !== "object" || Array.isArray(habit.recentHistory)) {
    habit.recentHistory = getEmptyRecentHistory();
  }
}

function pruneRecentHistory(habit) {
  const last7Keys = new Set(getLast7Days().map(day => day.key));

  Object.keys(habit.recentHistory).forEach(key => {
    if (!last7Keys.has(key)) {
      delete habit.recentHistory[key];
    }
  });
}

function resetHabitPeriods() {
  const currentWeek = currentWeekKey();

  habits.forEach((habit, index) => {
    ensureHabitDefaults(habit, currentWeek);

    if (habit.order === 999999) {
      habit.order = index;
    }

    if (habit.weekKey !== currentWeek) {
      const hitTargetLastWeek = habit.completedDays >= habit.targetDays;

      if (hitTargetLastWeek && !habit.countedPerfectWeek) {
        habit.perfectWeeks += 1;
      }

      habit.weekKey = currentWeek;
      habit.completedDays = 0;
      habit.doneToday = false;
      habit.weekHistory = getEmptyWeekHistory();
      habit.countedPerfectWeek = false;
    }

    if (habit.lastCompleted !== today) {
      habit.doneToday = false;
    }

    pruneRecentHistory(habit);
  });
}

function getSortedHabits() {
  return [...habits].sort((a, b) => {
    if (a.doneToday !== b.doneToday) {
      return Number(a.doneToday) - Number(b.doneToday);
    }
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

function updateWeeklySummary() {
  const totalCompleted = habits.reduce((sum, habit) => sum + (habit.completedDays || 0), 0);
  const totalTarget = habits.reduce((sum, habit) => sum + (habit.targetDays || 0), 0);
  const targetsHit = habits.filter(habit => (habit.completedDays || 0) >= (habit.targetDays || 0)).length;
  const totalPerfectWeeks = habits.reduce((sum, habit) => sum + (habit.perfectWeeks || 0), 0);

  const overallProgress = totalTarget > 0
    ? Math.round((totalCompleted / totalTarget) * 100)
    : 0;

  summaryCompleted.textContent = totalCompleted;
  summaryTargetsHit.textContent = `${targetsHit}/${habits.length}`;
  summaryProgress.textContent = `${overallProgress}%`;
  summaryPerfectWeeks.textContent = totalPerfectWeeks;
}

function updateWeeklyChart() {
  const weeklyTotals = [0, 0, 0, 0, 0, 0, 0];

  habits.forEach(habit => {
    const history = Array.isArray(habit.weekHistory) ? habit.weekHistory : getEmptyWeekHistory();
    history.forEach((value, index) => {
      weeklyTotals[index] += value;
    });
  });

  const maxPerDay = habits.length > 0 ? habits.length : 1;

  weeklyTotals.forEach((value, index) => {
    const bar = document.getElementById(`bar-${index}`);
    if (!bar) return;

    const heightPercent = Math.min((value / maxPerDay) * 100, 100);
    bar.style.height = `${heightPercent}%`;
    bar.title = `${value} completion${value === 1 ? "" : "s"}`;
  });
}

function updateInsights() {
  if (habits.length === 0) {
    insightLongestStreak.textContent = "-";
    insightLongestStreakSubtext.textContent = "No habits yet";
    insightMostConsistent.textContent = "-";
    insightMostConsistentSubtext.textContent = "No habits yet";
    insightClosestTarget.textContent = "-";
    insightClosestTargetSubtext.textContent = "No habits yet";
    return;
  }

  const longestStreakHabit = habits.reduce((best, habit) => {
    if (!best || (habit.streak || 0) > (best.streak || 0)) {
      return habit;
    }
    return best;
  }, null);

  if (longestStreakHabit && (longestStreakHabit.streak || 0) > 0) {
    insightLongestStreak.textContent = `${longestStreakHabit.streak} day${longestStreakHabit.streak === 1 ? "" : "s"}`;
    insightLongestStreakSubtext.textContent = longestStreakHabit.name;
  } else {
    insightLongestStreak.textContent = "0 days";
    insightLongestStreakSubtext.textContent = "No active streaks yet";
  }

  const mostConsistentHabit = habits.reduce((best, habit) => {
    const bestRatio = best ? ((best.completedDays || 0) / Math.max(best.targetDays || 1, 1)) : -1;
    const currentRatio = (habit.completedDays || 0) / Math.max(habit.targetDays || 1, 1);

    if (!best || currentRatio > bestRatio || (currentRatio === bestRatio && (habit.completedDays || 0) > (best.completedDays || 0))) {
      return habit;
    }
    return best;
  }, null);

  if (mostConsistentHabit) {
    const consistentPercent = Math.min(
      Math.round(((mostConsistentHabit.completedDays || 0) / Math.max(mostConsistentHabit.targetDays || 1, 1)) * 100),
      100
    );
    insightMostConsistent.textContent = mostConsistentHabit.name;
    insightMostConsistentSubtext.textContent = `${consistentPercent}% of weekly target completed`;
  }

  const closestHabit = habits.reduce((best, habit) => {
    const remaining = Math.max((habit.targetDays || 0) - (habit.completedDays || 0), 0);
    const progress = (habit.completedDays || 0) / Math.max(habit.targetDays || 1, 1);

    if (!best) return { habit, remaining, progress };
    if (remaining < best.remaining) return { habit, remaining, progress };
    if (remaining === best.remaining && progress > best.progress) return { habit, remaining, progress };
    return best;
  }, null);

  if (closestHabit) {
    insightClosestTarget.textContent = closestHabit.habit.name;
    if (closestHabit.remaining === 0) {
      insightClosestTargetSubtext.textContent = "Target already hit this week";
    } else if (closestHabit.remaining === 1) {
      insightClosestTargetSubtext.textContent = "1 completion away from target";
    } else {
      insightClosestTargetSubtext.textContent = `${closestHabit.remaining} completions away from target`;
    }
  }
}

function updateTodaySection() {
  if (habits.length === 0) {
    todayCard.classList.add("hidden");
    todayList.innerHTML = "";
    return;
  }

  const sorted = getSortedHabits();
  todayCard.classList.remove("hidden");

  todayList.innerHTML = sorted.map(habit => `
    <div class="today-item">
      <div class="today-item-left">
        <div class="today-item-name">${habit.name}</div>
        <div class="today-item-meta">
          ${habit.doneToday ? "Completed today" : "Still to do today"} • ${habit.completedDays}/${habit.targetDays} this week
        </div>
      </div>
      <div class="today-badge ${habit.doneToday ? "done" : "pending"}">
        ${habit.doneToday ? "✓" : "○"}
      </div>
    </div>
  `).join("");
}

function getHabitBadgeHtml(habit) {
  if (habit.completedDays >= habit.targetDays) {
    return `<span class="badge badge-perfect">🏆 Perfect week</span>`;
  }
  return "";
}

function renderHeatmap(habit) {
  const days = getLast7Days();

  const cells = days.map(day => {
    const completed = Boolean(habit.recentHistory?.[day.key]);
    const classes = ["heatmap-cell", completed ? "completed" : "", day.isToday ? "today" : ""].filter(Boolean).join(" ");
    const title = `${day.label} ${day.key}: ${completed ? "completed" : "not completed"}`;

    return `
      <div class="heatmap-day">
        <div class="${classes}" title="${title}"></div>
        <div class="heatmap-day-label">${day.label.slice(0, 1)}</div>
      </div>
    `;
  }).join("");

  return `
    <div class="heatmap-wrap">
      <div class="heatmap-label-row">
        <div class="heatmap-title">Last 7 days</div>
        <div class="heatmap-subtitle">Recent consistency</div>
      </div>
      <div class="heatmap-grid">
        ${cells}
      </div>
    </div>
  `;
}

function updateEmptyState() {
  const hasHabits = habits.length > 0;

  if (hasHabits) {
    emptyState.classList.add("hidden");
    weeklySummary.classList.remove("hidden");
    chartCard.classList.remove("hidden");
    insightsCard.classList.remove("hidden");
    habitList.classList.remove("hidden");
  } else {
    emptyState.classList.remove("hidden");
    weeklySummary.classList.add("hidden");
    chartCard.classList.add("hidden");
    insightsCard.classList.add("hidden");
    habitList.classList.add("hidden");
  }
}

function triggerConfetti() {
  const colors = ["#5EEAD4", "#14B8A6", "#ffffff", "#99F6E4"];

  for (let i = 0; i < 22; i += 1) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--x", `${(Math.random() * 360) - 180}px`);
    piece.style.setProperty("--y", `${(Math.random() * 260) - 40}px`);
    piece.style.setProperty("--r", `${(Math.random() * 720) - 360}deg`);
    piece.style.left = `${50 + (Math.random() * 8 - 4)}%`;
    piece.style.top = `${45 + (Math.random() * 8 - 4)}%`;
    confettiLayer.appendChild(piece);

    setTimeout(() => {
      piece.remove();
    }, 950);
  }
}

function renderHabits() {
  habitList.innerHTML = "";
  const sortedHabits = getSortedHabits();

  sortedHabits.forEach((habit) => {
    const li = document.createElement("li");
    li.className = "habit-card";
    li.draggable = true;
    li.dataset.habitId = habit.id;

    if (habit.doneToday) {
      li.classList.add("completed");
    }

    const progressPercent = Math.min((habit.completedDays / habit.targetDays) * 100, 100);
    const badgeHtml = getHabitBadgeHtml(habit);
    const heatmapHtml = renderHeatmap(habit);

    li.innerHTML = `
      <div class="habit-content" onclick="toggleHabitById('${habit.id}')">
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

        ${heatmapHtml}
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
  updateEmptyState();
}

function reorderHabit(draggedId, targetId) {
  const sorted = getSortedHabits();
  const draggedIndex = sorted.findIndex(h => h.id === draggedId);
  const targetIndex = sorted.findIndex(h => h.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1) return;

  const [moved] = sorted.splice(draggedIndex, 1);
  sorted.splice(targetIndex, 0, moved);

  sorted.forEach((habit, index) => {
    const original = habits.find(h => h.id === habit.id);
    if (original) {
      original.order = index;
    }
  });

  saveHabits();
  renderHabits();
}

function openHabitModal() {
  habitModal.classList.remove("hidden");
  habitNameInput.focus();
}

function closeHabitModal() {
  habitModal.classList.add("hidden");
  habitForm.reset();
  targetDaysInput.value = "5";
}

function addHabit(name, targetDays) {
  const nextOrder = habits.length === 0 ? 0 : Math.max(...habits.map(h => h.order ?? 0)) + 1;

  habits.push({
    id: createId(),
    order: nextOrder,
    name,
    targetDays,
    completedDays: 0,
    streak: 0,
    total: 0,
    doneToday: false,
    lastCompleted: null,
    weekKey: currentWeekKey(),
    weekHistory: getEmptyWeekHistory(),
    recentHistory: getEmptyRecentHistory(),
    perfectWeeks: 0,
    countedPerfectWeek: false
  });

  saveHabits();
  renderHabits();
}

function maybeAwardPerfectWeek(habit) {
  let newlyUnlocked = false;

  if (habit.completedDays >= habit.targetDays && !habit.countedPerfectWeek) {
    habit.perfectWeeks += 1;
    habit.countedPerfectWeek = true;
    newlyUnlocked = true;
  }

  if (habit.completedDays < habit.targetDays) {
    habit.countedPerfectWeek = false;
  }

  return newlyUnlocked;
}

function showCelebrationToast(habitName) {
  clearTimeout(celebrationToastTimeout);

  celebrationToastMessage.textContent = `"${habitName}" hit its weekly target.`;
  celebrationToast.classList.remove("hidden");

  requestAnimationFrame(() => {
    celebrationToast.classList.add("show");
  });

  celebrationToastTimeout = setTimeout(() => {
    celebrationToast.classList.remove("show");
    setTimeout(() => {
      celebrationToast.classList.add("hidden");
    }, 250);
  }, 2600);
}

function triggerTargetHitAnimation(card) {
  if (!card) return;
  card.classList.remove("target-hit");
  void card.offsetWidth;
  card.classList.add("target-hit");
}

function toggleHabitById(habitId) {
  const habit = habits.find(h => h.id === habitId);
  const card = document.querySelector(`.habit-card[data-habit-id="${habitId}"]`);

  if (!habit || !card) return;

  const fill = card.querySelector(".progress-fill");
  const stats = card.querySelector(".habit-stats");
  const topRow = card.querySelector(".habit-top-row");

  const previousPercent = Math.min((habit.completedDays / habit.targetDays) * 100, 100);
  const dayIndex = getDayIndexFromDate(today);

  if (!habit.doneToday) {
    if (habit.lastCompleted === yesterday()) {
      habit.streak += 1;
    } else {
      habit.streak = 1;
    }

    habit.doneToday = true;
    habit.lastCompleted = today;
    habit.completedDays += 1;
    habit.total += 1;
    habit.weekHistory[dayIndex] += 1;
    habit.recentHistory[today] = true;

    const unlockedPerfectWeek = maybeAwardPerfectWeek(habit);
    const newPercent = Math.min((habit.completedDays / habit.targetDays) * 100, 100);

    topRow.innerHTML = `
      <div class="habit-name">${habit.name}</div>
      ${getHabitBadgeHtml(habit)}
    `;

    stats.innerHTML = `🎯 ${habit.completedDays}/${habit.targetDays} this week • 🔥 ${habit.streak} • ✅ ${habit.total} • 🏆 ${habit.perfectWeeks || 0}`;
    card.classList.add("completed");

    fill.style.transition = "none";
    fill.style.width = `${previousPercent}%`;

    setTimeout(() => {
      fill.style.transition = "width 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
      fill.style.width = `${newPercent}%`;
    }, 10);

    if (unlockedPerfectWeek) {
      triggerTargetHitAnimation(card);
      showCelebrationToast(habit.name);
      triggerConfetti();
    }
  } else {
    habit.doneToday = false;
    habit.completedDays = Math.max(habit.completedDays - 1, 0);
    habit.total = Math.max(habit.total - 1, 0);
    habit.weekHistory[dayIndex] = Math.max((habit.weekHistory[dayIndex] || 0) - 1, 0);
    delete habit.recentHistory[today];

    maybeAwardPerfectWeek(habit);

    const newPercent = Math.min((habit.completedDays / habit.targetDays) * 100, 100);

    topRow.innerHTML = `
      <div class="habit-name">${habit.name}</div>
      ${getHabitBadgeHtml(habit)}
    `;

    stats.innerHTML = `🎯 ${habit.completedDays}/${habit.targetDays} this week • 🔥 ${habit.streak} • ✅ ${habit.total} • 🏆 ${habit.perfectWeeks || 0}`;
    card.classList.remove("completed");
    card.classList.remove("target-hit");

    fill.style.transition = "none";
    fill.style.width = `${newPercent}%`;
  }

  saveHabits();
  renderHabits();
}

function openDeleteModalById(habitId) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;

  habitIndexToDelete = habits.findIndex(h => h.id === habitId);
  deleteModalText.textContent = `Delete "${habit.name}" and lose its momentum?`;
  deleteModal.classList.remove("hidden");
}

function closeDeleteModal() {
  habitIndexToDelete = null;
  deleteModal.classList.add("hidden");
}

function confirmDeleteHabit() {
  if (habitIndexToDelete === null) return;

  habits.splice(habitIndexToDelete, 1);
  saveHabits();
  renderHabits();
  closeDeleteModal();
}

function showInstallBanner() {
  const dismissed = localStorage.getItem("momentum-install-dismissed") === "true";
  if (deferredPrompt && !dismissed) {
    installBanner.classList.remove("hidden");
  }
}

function hideInstallBanner(persist = false) {
  installBanner.classList.add("hidden");
  if (persist) {
    localStorage.setItem("momentum-install-dismissed", "true");
  }
}

// Install prompt handling
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  showInstallBanner();
});

installAppBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const choiceResult = await deferredPrompt.userChoice;

  if (choiceResult.outcome === "accepted") {
    hideInstallBanner(true);
  }

  deferredPrompt = null;
});

dismissInstallBtn.addEventListener("click", () => {
  hideInstallBanner(true);
});

window.addEventListener("appinstalled", () => {
  hideInstallBanner(true);
  deferredPrompt = null;
});

// Add Habit modal events
openModalBtn.addEventListener("click", openHabitModal);
mobileAddBtn.addEventListener("click", openHabitModal);
emptyStateAddBtn.addEventListener("click", openHabitModal);
closeModalBtn.addEventListener("click", closeHabitModal);
cancelModalBtn.addEventListener("click", closeHabitModal);
habitModalBackdrop.addEventListener("click", closeHabitModal);

habitForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = habitNameInput.value.trim();
  const targetDays = parseInt(targetDaysInput.value, 10);

  if (!name) return;
  if (isNaN(targetDays) || targetDays < 1 || targetDays > 7) return;

  addHabit(name, targetDays);
  closeHabitModal();
});

// Delete modal events
cancelDeleteBtn.addEventListener("click", closeDeleteModal);
confirmDeleteBtn.addEventListener("click", confirmDeleteHabit);
deleteModalBackdrop.addEventListener("click", closeDeleteModal);

// Escape key closes modals
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    if (!habitModal.classList.contains("hidden")) {
      closeHabitModal();
    }

    if (!deleteModal.classList.contains("hidden")) {
      closeDeleteModal();
    }
  }
});

// Init
resetHabitPeriods();
saveHabits();
renderHabits();
showInstallBanner();
