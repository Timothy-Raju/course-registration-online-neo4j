const AUTH_KEY = "webtech-auth";
const ALLOWED_ACCESS_VALUES = new Set(["logged-in", "no-login"]);

if (!ALLOWED_ACCESS_VALUES.has(sessionStorage.getItem(AUTH_KEY))) {
  window.location.replace("signin.html");
}

const statusEl = document.getElementById("status");
const loadingOverlay = document.getElementById("loading-overlay");
const loadingTextEl = document.getElementById("loading-text");
const API_BASE = ["", "3000", "8888", "80", "443"].includes(window.location.port)
  ? ""
  : "http://localhost:8888";
let pendingRequests = 0;

function setUIBusy(isBusy, message = "Please wait...") {
  const controls = document.querySelectorAll("input, button, select, textarea");
  controls.forEach((control) => {
    control.disabled = isBusy;
  });

  document.body.classList.toggle("loading", isBusy);
  loadingOverlay.classList.toggle("active", isBusy);
  loadingOverlay.setAttribute("aria-hidden", String(!isBusy));
  loadingTextEl.textContent = message;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icons = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] ?? icons.info}</span>
    <span class="toast-text"></span>
    <button class="toast-close" aria-label="Dismiss notification">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>`;

  // Set message via textContent to prevent XSS
  toast.querySelector('.toast-text').textContent = message;
  container.appendChild(toast);

  const remove = () => {
    if (toast.classList.contains('removing')) return;
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  };

  toast.querySelector('.toast-close').addEventListener('click', remove);
  setTimeout(remove, 4500);
}

function setStatus(message, isError = false) {
  showToast(message, isError ? 'error' : 'success');
}

async function api(path, options = {}) {
  pendingRequests += 1;
  setUIBusy(true, "Saving or loading data...");

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!response.ok) {
      let message = "Request failed";
      try {
        const body = await response.json();
        message = body.message || message;
      } catch (_) {
        // Keep fallback message.
      }
      throw new Error(message);
    }

    return response.json();
  } finally {
    pendingRequests = Math.max(0, pendingRequests - 1);
    if (pendingRequests === 0) {
      setUIBusy(false);
    }
  }
}

function formToObject(form) {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

function clearForm(form) {
  form.reset();
  form.querySelectorAll("input").forEach((input) => {
    input.value = "";
  });
}

function renderList(container, items, mapFn) {
  container.innerHTML = "";

  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "No records found";
    container.appendChild(li);
    return;
  }

  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = mapFn(item);
    container.appendChild(li);
  }
}

document.getElementById("student-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = formToObject(form);

  try {
    await api("/api/students", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    clearForm(form);
    setStatus("Student saved successfully");
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById("course-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = formToObject(form);

  try {
    await api("/api/courses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    clearForm(form);
    setStatus("Course saved successfully");
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById("enroll-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = formToObject(form);

  try {
    await api("/api/enroll", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    clearForm(form);
    setStatus("Enrollment saved successfully");
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById("load-students").addEventListener("click", async () => {
  const list = document.getElementById("students-list");
  try {
    const students = await api("/api/students");
    renderList(list, students, (s) => `${s.name} (${s.studentId})`);
    setStatus("Students loaded");
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById("load-courses").addEventListener("click", async () => {
  const list = document.getElementById("courses-list");
  try {
    const courses = await api("/api/courses");
    renderList(list, courses, (c) => `${c.courseCode} - ${c.title}`);
    setStatus("Courses loaded");
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById("student-courses-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const { studentId } = formToObject(event.target);
  const list = document.getElementById("student-courses-result");

  try {
    const data = await api(`/api/student/${encodeURIComponent(studentId)}/courses`);
    renderList(list, data.courses, (course) => `${course.courseCode} - ${course.title}`);
    event.target.reset();
    setStatus(`Loaded courses for ${data.student.name}`);
  } catch (error) {
    setStatus(error.message, true);
  }
});

document.getElementById("course-students-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const { courseCode } = formToObject(event.target);
  const list = document.getElementById("course-students-result");

  try {
    const data = await api(`/api/course/${encodeURIComponent(courseCode)}/students`);
    renderList(list, data.students, (student) => `${student.name} (${student.studentId})`);
    event.target.reset();
    setStatus(`Loaded students for ${data.course.title}`);
  } catch (error) {
    setStatus(error.message, true);
  }
});
