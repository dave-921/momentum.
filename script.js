let habits = JSON.parse(localStorage.getItem("habits")) || [];

const APP_VERSION = "1.8.0";
const today = new Date().toISOString().split("T")[0];
let habitIndexToDelete = null;
let celebrationToastTimeout = null;
let deferredPrompt = null;
let draggedHabitId = null;
let currentMonthOffset = 0;
let selectedHabitId = null;
let reminderEditHabitId = null;

const DAY_LABELS = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat"
};

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

// Habit detail modal
const habitDetailModal = document.getElementById("habitDetailModal");
const habitDetailBackdrop = document.getElementById("habitDetailBackdrop");
const closeHabitDetailBtn = document.getElementById("closeHabitDetailBtn");
const detailHabitName = document.getElementById("detailHabitName");
const detailHabitSubtitle = document.getElementById("detailHabitSubtitle");
const detailWeekProgress = document.getElementById("detailWeekProgress");
const detailStreak = document.getElementById("detailStreak");
const detailTotal = document.getElementById("detailTotal");
const detailPerfectWeeks = document.getElementById("detailPerfectWeeks");
const detailMonthReward = document.getElementById("detailMonthReward");
const detailMonthRewardMeta = document.getElementById("detailMonthRewardMeta");
const detailMonthLabel = document.getElementById("detailMonthLabel");
const detailMonthGrid = document.getElementById("detailMonthGrid");
const detailPerfectMonths = document.getElementById("detailPerfectMonths");
const detailStrongMonths = document.getElementById("detailStrongMonths");
const detailYearConsistency = document.getElementById("detailYearConsistency");
const detailReminderSummary = document.getElementById("detailReminderSummary");
const openReminderModalBtn = document.getElementById("openReminderModalBtn");

// Reminder modal
const reminderModal = document.getElementById("reminderModal");
const reminderBackdrop = document.getElementById("reminderBackdrop");
const closeReminderModalBtn = document.getElementById("closeReminderModalBtn");
const reminderEnabled = document.getElementById("reminderEnabled");
const reminderTime = document.getElementById("reminderTime");
const reminderDaysGrid = document.getElementById("reminderDaysGrid");
const requestNotificationPermissionBtn = document.getElementById("requestNotificationPermissionBtn");
const saveReminderBtn = document.getElementById("saveReminderBtn");
const notificationPermissionStatus = document.getElementById("notificationPermissionStatus");
const notificationSettingsBtn = document.getElementById("notificationSettingsBtn");

// App update modal
const appUpdateModal = document.getElementById("appUpdateModal");
const appUpdateBackdrop = document.getElementById("appUpdateBackdrop");
const closeAppUpdateBtn = document.getElementById("closeAppUpdateBtn");

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

// Monthly section
const monthlySection = document.getElementById("monthlySection");
const monthlyGrid = document.getElementById("monthlyGrid");
const monthlySectionTitle = document.getElementById("monthlySectionTitle");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const resetMonthBtn = document.getElementById("resetMonthBtn");

// Year achievements
const yearAchievementsSection = document.getElementById("yearAchievementsSection");
const yearAchievementsSubtitle = document.getElementById("yearAchievementsSubtitle");
const achievementPerfectYear = document.getElementById("achievementPerfectYear");
const achievementPerfectYearSubtext = document.getElementById("achievementPerfectYearSubtext");
const achievementMomentumYear = document.getElementById("achievementMomentumYear");
const achievementMomentumYearSubtext = document.getElementById("achievementMomentumYearSubtext");
const achievementEliteConsistency = document.getElementById("achievementEliteConsistency");
const achievementEliteConsistencySubtext = document.getElementById("achievementEliteConsistencySubtext");
const achievementYearTotals = document.getElementById("achievementYearTotals");
const achievementYearTotalsSubtext = document.getElementById("achievementYearTotalsSubtext");

// Install banner
const installBanner = document.getElementById("installBanner");
const installAppBtn = document.getElementById("installAppBtn");
const dismissInstallBtn = document.getElementById("dismissInstallBtn");

// Celebration toast
const celebrationToast = document.getElementById("celebrationToast");
const celebrationToastMessage = document.getElementById("celebrationToastMessage");
const confettiLayer = document.getElementById("confettiLayer");

const insightLongestStreak = document.getElementById("insightLongestStreak");
const insightLongestStreakSubtext = document.getElementById("insightLongestStreakSubtext");
const insightMostConsistent = document.getElementById("insightMostConsistent");
const insightMostConsistentSubtext = document.getElementById("insightMostConsistentSubtext");
const insightClosestTarget = document.getElementById("insightClosestTarget");
const insightClosestTargetSubtext = document.getElementById("insightClosestTargetSubtext");

function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
}

function createId() {
  return `habit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDateKey(date) {
  return date.toISOString().split("T")[0];
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

function getMonthInfo(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (first.getDay() + 6) % 7;
  const label = first.toLocaleString("en-GB", { month: "long", year: "numeric" });
  return { year, month, daysInMonth, firstDayIndex, label };
}

function getViewedMonthInfo() {
  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + currentMonthOffset);
  return getMonthInfo(base.getFullYear(), base.getMonth());
}

function getWeeksInMonth(year, month) {
  const monthInfo = getMonthInfo(year, month);
  const totalCells = monthInfo.firstDayIndex + monthInfo.daysInMonth;
  return Math.ceil(totalCells / 7);
}

function countCompletedDaysInMonth(habit, year, month) {
  return Object.keys(habit.history || {}).filter(key => {
    const d = new Date(`${key}T12:00:00`);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
}

function getMonthRewardStatus(habit, year, month) {
  const completedDays = countCompletedDaysInMonth(habit, year, month);
  const weeksInMonth = getWeeksInMonth(year, month);
  const targetDaysForMonth = habit.targetDays * weeksInMonth;
  const ratio = targetDaysForMonth > 0 ? completedDays / targetDaysForMonth : 0;

  return {
    completedDays,
    targetDaysForMonth,
    ratio,
    perfect: targetDaysForMonth > 0 && completedDays >= targetDaysForMonth,
    strong: targetDaysForMonth > 0 && ratio >= 0.8
  };
}

function getYearStats(year) {
  let perfectMonthsTotal = 0;
  let strongMonthsTotal = 0;
  let activeMonthsCount = 0;
  let eliteCompleted = 0;
  let eliteTarget = 0;
  let everyMonthHasPerfect = true;

  for (let month = 0; month < 12; month += 1) {
    let monthHasAnyCompletion = false;
    let monthHasPerfectHabit = false;

    habits.forEach(habit => {
      const reward = getMonthRewardStatus(habit, year, month);
      if (reward.completedDays > 0) monthHasAnyCompletion = true;
      if (reward.perfect) {
        monthHasPerfectHabit = true;
        perfectMonthsTotal += 1;
      }
      if (reward.strong) strongMonthsTotal += 1;

      eliteCompleted += reward.completedDays;
      eliteTarget += reward.targetDaysForMonth;
    });

    if (monthHasAnyCompletion) activeMonthsCount += 1;
    if (!monthHasPerfectHabit) everyMonthHasPerfect = false;
  }

  const eliteRatio = eliteTarget > 0 ? eliteCompleted / eliteTarget : 0;

  return {
    perfectMonthsTotal,
    strongMonthsTotal,
    activeMonthsCount,
    eliteRatio,
    perfectYearUnlocked: habits.length > 0 && everyMonthHasPerfect,
    momentumYearUnlocked: activeMonthsCount === 12,
    eliteConsistencyUnlocked: eliteRatio >= 0.8
  };
}

function getSingleHabitYearStats(habit, year) {
  let perfectMonths = 0;
  let strongMonths = 0;
  let completed = 0;
  let target = 0;

  for (let month = 0; month < 12; month += 1) {
    const reward = getMonthRewardStatus(habit, year, month);
    if (reward.perfect) perfectMonths += 1;
    if (reward.strong) strongMonths += 1;
    completed += reward.completedDays;
    target += reward.targetDaysForMonth;
  }

  return {
    perfectMonths,
    strongMonths,
    ratio: target > 0 ? completed / target : 0
  };
}

function ensureHabitDefaults(habit, currentWeek) {
  if (!habit.id) habit.id = createId();
  if (habit.order === undefined) habit.order = 999999;
  if (!habit.weekKey) habit.weekKey = currentWeek;
  if (habit.targetDays === undefined) habit.targetDays = 1;
  if (habit.completedDays === undefined) habit.completedDays = 0;
  if (habit.total === undefined) habit.total = 0;
  if (habit.streak === undefined) habit.streak = 0;
  if (habit.doneToday === undefined) habit.doneToday = false;
  if (!Array.isArray(habit.weekHistory) || habit.weekHistory.length !== 7) habit.weekHistory = getEmptyWeekHistory();
  if (habit.perfectWeeks === undefined) habit.perfectWeeks = 0;
  if (habit.countedPerfectWeek === undefined) habit.countedPerfectWeek = false;
  if (!habit.history || typeof habit.history !== "object" || Array.isArray(habit.history)) habit.history = {};

  if (!habit.reminder || typeof habit.reminder !== "object" || Array.isArray(habit.reminder)) {
    habit.reminder = {
      enabled: false,
      time: "19:00",
      days: []
    };
  }

  if (!Array.isArray(habit.reminder.days)) {
    habit.reminder.days = [];
  }
}

function resetHabitPeriods() {
  const currentWeek = currentWeekKey();

  habits.forEach((habit, index) => {
    ensureHabitDefaults(habit, currentWeek);

    if (habit.order === 999999) habit.order = index;

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
  });
}

function getSortedHabits() {
  return [...habits].sort((a, b) => {
    if (a.doneToday !== b.doneToday) return Number(a.doneToday) - Number(b.doneToday);
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

function getReminderSummary(reminder) {
  if (!reminder || !reminder.enabled) return "No reminder set";
  const daysText = reminder.days.length
    ? reminder.days.map(day => DAY_LABELS[day]).join(", ")
    : "No days selected";
  return `${daysText} at ${reminder.time}`;
}

function updateNotificationPermissionStatus() {
  if (!("Notification" in window)) {
    notificationPermissionStatus.textContent = "Notifications are not supported on this device.";
    return;
  }

  if (Notification.permission === "granted") {
    notificationPermissionStatus.textContent = "Notifications enabled";
  } else if (Notification.permission === "denied") {
    notificationPermissionStatus.textContent = "Notifications blocked in browser settings";
  } else {
    notificationPermissionStatus.textContent = "Notifications not enabled yet";
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    updateNotificationPermissionStatus();
    return;
  }

  const result = await Notification.requestPermission();
  updateNotificationPermissionStatus();

  if (result === "granted") {
    showCelebrationToast("Notifications enabled for Momentum.");
  }
}

async function sendTestNotification() {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification("Momentum.", {
    body: "Reminders are enabled. You’re ready for habit notifications.",
    icon: "icon-192.png",
    badge: "icon-192.png",
    data: { url: "./" }
  });
}

function openReminderModalForHabit(habitId) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;

  reminderEditHabitId = habitId;
  reminderEnabled.checked = Boolean(habit.reminder?.enabled);
  reminderTime.value = habit.reminder?.time || "19:00";

  const selectedDays = new Set(habit.reminder?.days || []);
  reminderDaysGrid.querySelectorAll(".day-pill").forEach(btn => {
    const day = Number(btn.dataset.day);
    btn.classList.toggle("active", selectedDays.has(day));
  });

  updateNotificationPermissionStatus();
  reminderModal.classList.remove("hidden");
}

function closeReminderModal() {
  reminderEditHabitId = null;
  reminderModal.classList.add("hidden");
}

function saveReminderSettings() {
  const habit = habits.find(h => h.id === reminderEditHabitId);
  if (!habit) return;

  const selectedDays = [...reminderDaysGrid.querySelectorAll(".day-pill.active")].map(btn => Number(btn.dataset.day));

  habit.reminder = {
    enabled: reminderEnabled.checked,
    time: reminderTime.value || "19:00",
    days: selectedDays
  };

  saveHabits();
  renderHabits();
  renderHabitDetail();
  closeReminderModal();
}

function updateWeeklySummary() {
  const totalCompleted = habits.reduce((sum, habit) => sum + (habit.completedDays || 0), 0);
  const totalTarget = habits.reduce((sum, habit) => sum + (habit.targetDays || 0), 0);
  const targetsHit = habits.filter(habit => (habit.completedDays || 0) >= (habit.targetDays || 0)).length;
  const totalPerfectWeeks = habits.reduce((sum, habit) => sum + (habit.perfectWeeks || 0), 0);

  const overallProgress = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

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
    if (!best || (habit.streak || 0) > (best.streak || 0)) return habit;
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
    const completed = Boolean(habit.history?.[day.key]);
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

function buildMonthCells(habit, year, month) {
  const monthInfo = getMonthInfo(year, month);
  const cells = [];

  for (let i = 0; i < monthInfo.firstDayIndex; i += 1) {
    cells.push(`<div class="month-cell spacer"></div>`);
  }

  for (let day = 1; day <= monthInfo.daysInMonth; day += 1) {
    const date = new Date(year, month, day, 12, 0, 0);
    const key = formatDateKey(date);
    const completed = Boolean(habit.history?.[key]);
    const isToday = key === today;

    cells.push(`
      <div class="month-cell ${completed ? "completed" : ""} ${isToday ? "today" : ""}" title="${key}: ${completed ? "completed" : "not completed"}">
        ${day}
      </div>
    `);
  }

  return cells.join("");
}

function renderMonthlyCalendar() {
  if (habits.length === 0) {
    monthlySection.classList.add("hidden");
    monthlyGrid.innerHTML = "";
    return;
  }

  const monthInfo = getViewedMonthInfo();
  monthlySectionTitle.textContent = monthInfo.label;
  monthlySection.classList.remove("hidden");

  const sorted = getSortedHabits();

  monthlyGrid.innerHTML = sorted.map(habit => {
    const reward = getMonthRewardStatus(habit, monthInfo.year, monthInfo.month);

    let rewardBadge = `<span class="month-reward neutral">Building month</span>`;
    if (reward.perfect) {
      rewardBadge = `<span class="month-reward perfect">🏆 Perfect Month</span>`;
    } else if (reward.strong) {
      rewardBadge = `<span class="month-reward strong">✨ Strong Month</span>`;
    }

    return `
      <div class="month-card">
        <div class="month-card-top">
          <div>
            <div class="month-habit-name">${habit.name}</div>
            <div class="month-habit-meta">
              ${reward.completedDays}/${reward.targetDaysForMonth} target completions this month
            </div>
          </div>
          ${rewardBadge}
        </div>

        <div class="month-weekdays">
          <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
        </div>

        <div class="month-grid">
          ${buildMonthCells(habit, monthInfo.year, monthInfo.month)}
        </div>
      </div>
    `;
  }).join("");
}

function updateYearAchievements() {
  if (habits.length === 0) {
    yearAchievementsSection.classList.add("hidden");
    return;
  }

  const viewed = getViewedMonthInfo();
  const yearStats = getYearStats(viewed.year);

  yearAchievementsSection.classList.remove("hidden");
  yearAchievementsSubtitle.textContent = `${viewed.year}`;

  achievementPerfectYear.textContent = yearStats.perfectYearUnlocked ? "Unlocked" : "Locked";
  achievementPerfectYear.classList.toggle("unlocked", yearStats.perfectYearUnlocked);
  achievementPerfectYearSubtext.textContent = yearStats.perfectYearUnlocked
    ? "Every month has at least one Perfect Month."
    : "Get at least one Perfect Month in every month.";

  achievementMomentumYear.textContent = yearStats.momentumYearUnlocked ? "Unlocked" : "Locked";
  achievementMomentumYear.classList.toggle("unlocked", yearStats.momentumYearUnlocked);
  achievementMomentumYearSubtext.textContent = yearStats.momentumYearUnlocked
    ? "You completed at least one habit every month."
    : `${yearStats.activeMonthsCount}/12 active months so far.`;

  achievementEliteConsistency.textContent = yearStats.eliteConsistencyUnlocked ? "Unlocked" : "Locked";
  achievementEliteConsistency.classList.toggle("unlocked", yearStats.eliteConsistencyUnlocked);
  achievementEliteConsistencySubtext.textContent = `${Math.round(yearStats.eliteRatio * 100)}% yearly consistency`;

  achievementYearTotals.textContent = `${yearStats.perfectMonthsTotal} / ${yearStats.strongMonthsTotal}`;
  achievementYearTotals.classList.remove("unlocked");
  achievementYearTotalsSubtext.textContent = "Perfect months / Strong months";
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

function openHabitDetailById(habitId) {
  selectedHabitId = habitId;
  renderHabitDetail();
  habitDetailModal.classList.remove("hidden");
}

function closeHabitDetail() {
  selectedHabitId = null;
  habitDetailModal.classList.add("hidden");
}

function renderHabitDetail() {
  const habit = habits.find(h => h.id === selectedHabitId);
  if (!habit) return;

  const viewed = getViewedMonthInfo();
  const monthStatus = getMonthRewardStatus(habit, viewed.year, viewed.month);
  const yearStats = getSingleHabitYearStats(habit, viewed.year);

  detailHabitName.textContent = habit.name;
  detailHabitSubtitle.textContent = `Target: ${habit.targetDays} day${habit.targetDays === 1 ? "" : "s"} per week`;
  detailWeekProgress.textContent = `${habit.completedDays}/${habit.targetDays}`;
  detailStreak.textContent = `${habit.streak || 0}`;
  detailTotal.textContent = `${habit.total || 0}`;
  detailPerfectWeeks.textContent = `${habit.perfectWeeks || 0}`;

  detailMonthLabel.textContent = viewed.label;
  detailMonthReward.className = "month-reward neutral";
  if (monthStatus.perfect) {
    detailMonthReward.className = "month-reward perfect";
    detailMonthReward.textContent = "🏆 Perfect Month";
  } else if (monthStatus.strong) {
    detailMonthReward.className = "month-reward strong";
    detailMonthReward.textContent = "✨ Strong Month";
  } else {
    detailMonthReward.className = "month-reward neutral";
    detailMonthReward.textContent = "Building month";
  }

  detailMonthRewardMeta.textContent = `${monthStatus.completedDays}/${monthStatus.targetDaysForMonth} target completions this month`;
  detailMonthGrid.innerHTML = buildMonthCells(habit, viewed.year, viewed.month);

  detailPerfectMonths.textContent = `${yearStats.perfectMonths}`;
  detailStrongMonths.textContent = `${yearStats.strongMonths}`;
  detailYearConsistency.textContent = `${Math.round(yearStats.ratio * 100)}%`;

  detailReminderSummary.textContent = getReminderSummary(habit.reminder);
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
      <div class="habit-content" onclick="openHabitDetailById('${habit.id}')">
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
  renderMonthlyCalendar();
  updateYearAchievements();
  updateEmptyState();

  if (selectedHabitId) {
    renderHabitDetail();
  }
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
    history: {},
    perfectWeeks: 0,
    countedPerfectWeek: false,
    reminder: {
      enabled: false,
      time: "19:00",
      days: []
    }
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

function showCelebrationToast(message) {
  clearTimeout(celebrationToastTimeout);

  celebrationToastMessage.textContent = message;
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

  const viewed = getViewedMonthInfo();
  const previousMonthStatus = getMonthRewardStatus(habit, viewed.year, viewed.month);

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
    habit.history[today] = true;

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
      showCelebrationToast(`"${habit.name}" hit its weekly target.`);
      triggerConfetti();
    }
  } else {
    habit.doneToday = false;
    habit.completedDays = Math.max(habit.completedDays - 1, 0);
    habit.total = Math.max(habit.total - 1, 0);
    habit.weekHistory[dayIndex] = Math.max((habit.weekHistory[dayIndex] || 0) - 1, 0);
    delete habit.history[today];

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

  const currentMonthStatus = getMonthRewardStatus(habit, viewed.year, viewed.month);

  if (!previousMonthStatus.strong && currentMonthStatus.strong) {
    showCelebrationToast(`"${habit.name}" unlocked a Strong Month.`);
  }

  if (!previousMonthStatus.perfect && currentMonthStatus.perfect) {
    showCelebrationToast(`"${habit.name}" unlocked a Perfect Month.`);
    triggerConfetti();
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

function maybeShowAppUpdateModal() {
  const lastSeenVersion = localStorage.getItem("momentum-last-seen-version");
  if (lastSeenVersion !== APP_VERSION) {
    appUpdateModal.classList.remove("hidden");
  }
}

function closeAppUpdateModal() {
  localStorage.setItem("momentum-last-seen-version", APP_VERSION);
  appUpdateModal.classList.add("hidden");
}

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

prevMonthBtn.addEventListener("click", () => {
  currentMonthOffset -= 1;
  renderHabits();
});

nextMonthBtn.addEventListener("click", () => {
  currentMonthOffset += 1;
  renderHabits();
});

resetMonthBtn.addEventListener("click", () => {
  currentMonthOffset = 0;
  renderHabits();
});

openModalBtn.addEventListener("click", openHabitModal);
mobileAddBtn.addEventListener("click", openHabitModal);
emptyStateAddBtn.addEventListener("click", openHabitModal);
closeModalBtn.addEventListener("click", closeHabitModal);
cancelModalBtn.addEventListener("click", closeHabitModal);
habitModalBackdrop.addEventListener("click", closeHabitModal);

closeHabitDetailBtn.addEventListener("click", closeHabitDetail);
habitDetailBackdrop.addEventListener("click", closeHabitDetail);

openReminderModalBtn.addEventListener("click", () => {
  if (selectedHabitId) openReminderModalForHabit(selectedHabitId);
});

notificationSettingsBtn.addEventListener("click", async () => {
  await requestNotificationPermission();
  if (Notification.permission === "granted") {
    await sendTestNotification();
  }
});

closeReminderModalBtn.addEventListener("click", closeReminderModal);
reminderBackdrop.addEventListener("click", closeReminderModal);
requestNotificationPermissionBtn.addEventListener("click", async () => {
  await requestNotificationPermission();
  if (Notification.permission === "granted") {
    await sendTestNotification();
  }
});
saveReminderBtn.addEventListener("click", saveReminderSettings);

reminderDaysGrid.querySelectorAll(".day-pill").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.classList.toggle("active");
  });
});

closeAppUpdateBtn.addEventListener("click", closeAppUpdateModal);
appUpdateBackdrop.addEventListener("click", closeAppUpdateModal);

habitForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = habitNameInput.value.trim();
  const targetDays = parseInt(targetDaysInput.value, 10);

  if (!name) return;
  if (isNaN(targetDays) || targetDays < 1 || targetDays > 7) return;

  addHabit(name, targetDays);
  closeHabitModal();
});

cancelDeleteBtn.addEventListener("click", closeDeleteModal);
confirmDeleteBtn.addEventListener("click", confirmDeleteHabit);
deleteModalBackdrop.addEventListener("click", closeDeleteModal);

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    if (!habitModal.classList.contains("hidden")) closeHabitModal();
    if (!deleteModal.classList.contains("hidden")) closeDeleteModal();
    if (!habitDetailModal.classList.contains("hidden")) closeHabitDetail();
    if (!reminderModal.classList.contains("hidden")) closeReminderModal();
    if (!appUpdateModal.classList.contains("hidden")) closeAppUpdateModal();
  }
});

window.openHabitDetailById = openHabitDetailById;
window.openDeleteModalById = openDeleteModalById;
window.toggleHabitById = toggleHabitById;

resetHabitPeriods();
saveHabits();
renderHabits();
showInstallBanner();
maybeShowAppUpdateModal();
updateNotificationPermissionStatus();
