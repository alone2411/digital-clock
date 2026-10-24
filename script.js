"use strict";

const elements = {
  clockTime: document.getElementById("clockTime"),
  clockDate: document.getElementById("clockDate"),
  period: document.getElementById("period"),
  timezone: document.getElementById("timezone"),
  formatToggle: document.getElementById("formatToggle"),
  formatLabel: document.getElementById("formatLabel"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.querySelector(".theme-icon"),
  targetDate: document.getElementById("targetDate"),
  targetTime: document.getElementById("targetTime"),
  countdownForm: document.getElementById("countdownForm"),
  startButton: document.getElementById("startButton"),
  pauseButton: document.getElementById("pauseButton"),
  resetButton: document.getElementById("resetButton"),
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
  countdownPanel: document.querySelector(".countdown-panel"),
  countdownMessage: document.getElementById("countdownMessage"),
  timerStatus: document.getElementById("timerStatus"),
  notification: document.getElementById("notification"),
  infoDay: document.getElementById("infoDay"),
  infoDate: document.getElementById("infoDate"),
  infoMonth: document.getElementById("infoMonth"),
  infoYear: document.getElementById("infoYear")
};

let useTwelveHour = localStorage.getItem("timeflow-hour-format") === "12";
let countdownInterval = null;
let targetTimestamp = null;
let notificationTimeout;

function pad(number) {
  return String(number).padStart(2, "0");
}

function toLocalDateInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toLocalTimeInputValue(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function updateClock() {
  const now = new Date();
  let hours = now.getHours();
  const period = hours >= 12 ? "PM" : "AM";

  if (useTwelveHour) {
    hours = hours % 12 || 12;
  }

  elements.clockTime.textContent = `${pad(hours)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  elements.period.textContent = useTwelveHour ? period : "";

  updateDate(now);
}

function updateDate(now) {
  const longDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(now);

  elements.clockDate.textContent = longDate;

  elements.infoDay.textContent = new Intl.DateTimeFormat("en-US", {
    weekday: "long"
  }).format(now);

  elements.infoDate.textContent = pad(now.getDate());

  elements.infoMonth.textContent = new Intl.DateTimeFormat("en-US", {
    month: "long"
  }).format(now);

  elements.infoYear.textContent = now.getFullYear();
}

function toggleTimeFormat() {
  useTwelveHour = !useTwelveHour;

  localStorage.setItem("timeflow-hour-format", useTwelveHour ? "12" : "24");

  elements.formatToggle.classList.toggle("twelve-hour", useTwelveHour);
  elements.formatToggle.setAttribute("aria-pressed", String(useTwelveHour));

  elements.formatToggle.setAttribute(
    "aria-label",
    `Switch to ${useTwelveHour ? "24" : "12"}-hour clock format`
  );

  elements.formatLabel.textContent = useTwelveHour ? "12H" : "24H";

  updateClock();
}

function setTimerStatus(status) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  elements.timerStatus.className = `timer-status ${status}`;
  elements.timerStatus.innerHTML = `<span aria-hidden="true"></span> ${label}`;
}

function getTargetTime() {
  if (!elements.targetDate.value || !elements.targetTime.value) {
    showNotification("Choose both a target date and time first.", "error");
    return null;
  }

  const timestamp = new Date(
    `${elements.targetDate.value}T${elements.targetTime.value}`
  ).getTime();

  if (Number.isNaN(timestamp) || timestamp <= Date.now()) {
    showNotification("Your target time needs to be in the future.", "error");
    return null;
  }

  return timestamp;
}

function startCountdown(event) {
  if (event) {
    event.preventDefault();
  }

  if (countdownInterval) {
    showNotification("Your countdown is already running.", "error");
    return;
  }

  targetTimestamp = getTargetTime();

  if (!targetTimestamp) {
    return;
  }

  elements.countdownPanel.classList.remove("complete");
  elements.startButton.disabled = true;
  elements.pauseButton.disabled = false;
  elements.countdownMessage.textContent = "Countdown in progress...";

  setTimerStatus("running");

  updateCountdown();
  countdownInterval = window.setInterval(updateCountdown, 1000);
}

function pauseCountdown() {
  if (!countdownInterval) {
    return;
  }

  window.clearInterval(countdownInterval);
  countdownInterval = null;

  elements.startButton.disabled = false;
  elements.startButton.innerHTML = '<span aria-hidden="true">▶</span> Resume Countdown';

  elements.pauseButton.disabled = true;
  elements.countdownMessage.textContent = "Countdown paused. Resume when you are ready.";

  setTimerStatus("paused");
}

function resetCountdown() {
  if (countdownInterval) {
    window.clearInterval(countdownInterval);
  }

  countdownInterval = null;
  targetTimestamp = null;

  elements.countdownPanel.classList.remove("complete");

  updateCountdownDisplay(0, 0, 0, 0);

  elements.startButton.disabled = false;
  elements.startButton.innerHTML = '<span aria-hidden="true">▶</span> Start Countdown';

  elements.pauseButton.disabled = true;
  elements.countdownMessage.textContent = "Set a target date and time to begin.";

  setTimerStatus("ready");
}

function updateCountdown() {
  const remaining = targetTimestamp - Date.now();

  if (remaining <= 0) {
    completeCountdown();
    return;
  }

  const totalSeconds = Math.floor(remaining / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  updateCountdownDisplay(days, hours, minutes, seconds);
}

function updateCountdownDisplay(days, hours, minutes, seconds) {
  const values = [pad(days), pad(hours), pad(minutes), pad(seconds)];

  [elements.days, elements.hours, elements.minutes, elements.seconds].forEach(
    (element, index) => {
      if (element.textContent !== values[index]) {
        element.textContent = values[index];

        element.classList.remove("changed");
        void element.offsetWidth;
        element.classList.add("changed");
      }
    }
  );
}

function completeCountdown() {
  if (countdownInterval) {
    window.clearInterval(countdownInterval);
  }

  countdownInterval = null;
  targetTimestamp = null;

  updateCountdownDisplay(0, 0, 0, 0);

  elements.countdownPanel.classList.add("complete");

  elements.startButton.disabled = false;
  elements.startButton.innerHTML = '<span aria-hidden="true">▶</span> Start Countdown';

  elements.pauseButton.disabled = true;

  elements.countdownMessage.textContent =
    "Time's Up! Take a moment, then choose what is next.";

  setTimerStatus("completed");

  showNotification("Time's Up! Your countdown has finished.");
}

function setPreset(minutes) {
  const target = new Date(Date.now() + minutes * 60 * 1000);

  elements.targetDate.value = toLocalDateInputValue(target);
  elements.targetTime.value = toLocalTimeInputValue(target);

  resetCountdown();

  const presetText =
    minutes === 60
      ? "1 hour"
      : `${minutes} minute${minutes === 1 ? "" : "s"}`;

  elements.countdownMessage.textContent =
    `${presetText} selected. Press Start Countdown when ready.`;

  showNotification("Preset applied. Your timer is ready.");
}

function toggleTheme() {
  const isLight = document.body.classList.toggle("light-theme");

  localStorage.setItem("timeflow-theme", isLight ? "light" : "dark");

  elements.themeIcon.textContent = isLight ? "☾" : "☼";

  elements.themeToggle.setAttribute(
    "aria-label",
    `Switch to ${isLight ? "dark" : "light"} mode`
  );
}

function showNotification(message, type = "success") {
  window.clearTimeout(notificationTimeout);

  elements.notification.textContent = message;
  elements.notification.className =
    `notification show ${type === "error" ? "error" : ""}`;

  notificationTimeout = window.setTimeout(() => {
    elements.notification.classList.remove("show");
  }, 3400);
}

function initializeTheme() {
  const theme = localStorage.getItem("timeflow-theme") || "dark";

  if (theme === "light") {
    document.body.classList.add("light-theme");
  }

  elements.themeIcon.textContent = theme === "light" ? "☾" : "☼";

  elements.themeToggle.setAttribute(
    "aria-label",
    `Switch to ${theme === "light" ? "dark" : "light"} mode`
  );
}

function initialize() {
  initializeTheme();

  elements.formatToggle.classList.toggle("twelve-hour", useTwelveHour);
  elements.formatToggle.setAttribute("aria-pressed", String(useTwelveHour));

  elements.formatToggle.setAttribute(
    "aria-label",
    `Switch to ${useTwelveHour ? "24" : "12"}-hour clock format`
  );

  elements.formatLabel.textContent = useTwelveHour ? "12H" : "24H";

  elements.timezone.textContent =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";

  elements.targetDate.min = toLocalDateInputValue(new Date());

  updateClock();
  window.setInterval(updateClock, 1000);

  elements.formatToggle.addEventListener("click", toggleTimeFormat);
  elements.themeToggle.addEventListener("click", toggleTheme);

  elements.countdownForm.addEventListener("submit", startCountdown);
  elements.pauseButton.addEventListener("click", pauseCountdown);
  elements.resetButton.addEventListener("click", resetCountdown);

  document.querySelectorAll("[data-minutes]").forEach((button) => {
    button.addEventListener("click", () => {
      setPreset(Number(button.dataset.minutes));
    });
  });
}

initialize();