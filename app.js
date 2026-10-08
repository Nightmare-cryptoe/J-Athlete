const storageKey = "j-athlete-data";

const defaultState = {
  user: null,
  profile: null,
  team: null,
  activities: [],
  schedule: [],
};

const gearCatalog = [
  { name: "Road Running Shoes", price: "$120" },
  { name: "Hydration Vest", price: "$75" },
  { name: "Performance Socks", price: "$18" },
  { name: "GPS Sports Watch", price: "$199" },
];

const loadState = () => {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? { ...defaultState, ...JSON.parse(saved) } : { ...defaultState };
  } catch {
    return { ...defaultState };
  }
};

let state = loadState();

const saveState = () => {
  localStorage.setItem(storageKey, JSON.stringify(state));
};

const el = (id) => document.getElementById(id);

const setText = (id, value) => {
  const node = el(id);
  if (node) node.textContent = value;
};

const setValue = (id, value) => {
  const node = el(id);
  if (node) node.value = value;
};

const renderCurrentUser = () => {
  setText("current-user", state.user ? `Signed in: ${state.user.email}` : "Not signed in");
};

const renderGear = () => {
  const list = el("gear-list");
  if (!list) return;

  list.innerHTML = gearCatalog
    .map((item, index) => `<li>${item.name} - <strong>${item.price}</strong> <button type="button" data-gear-index="${index}">Buy</button></li>`)
    .join("");

  list.querySelectorAll("button[data-gear-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const gear = gearCatalog[Number(button.dataset.gearIndex)];
      alert(`Added ${gear.name} to cart!`);
    });
  });
};

const renderActivities = () => {
  const totalMilesNode = el("total-miles");
  const totalTimeNode = el("total-time");
  const listNode = el("activity-list");
  if (!totalMilesNode || !totalTimeNode || !listNode) return;

  const totalMiles = state.activities.reduce((sum, a) => sum + a.miles, 0);
  const totalTime = state.activities.reduce((sum, a) => sum + a.timeMinutes, 0);

  totalMilesNode.textContent = totalMiles.toFixed(2);
  totalTimeNode.textContent = String(totalTime);
  listNode.innerHTML = state.activities
    .map((a) => `<li>${a.name}: ${a.miles.toFixed(2)} mi in ${a.timeMinutes} min</li>`)
    .join("");
};

const renderSchedule = () => {
  const listNode = el("schedule-list");
  if (!listNode) return;

  const sorted = [...state.schedule].sort((a, b) => a.date.localeCompare(b.date));
  listNode.innerHTML = sorted.map((s) => `<li>${s.date}: ${s.plan}</li>`).join("");
};

const syncProfile = () => {
  if (state.profile) {
    setValue("display-name", state.profile.displayName);
    setValue("skill-level", state.profile.skillLevel);
    setText("profile-status", `${state.profile.displayName} (${state.profile.skillLevel}) saved.`);
  }
};

const syncTeam = () => {
  if (state.team) {
    setValue("team-name", state.team);
    setText("team-status", `Joined team: ${state.team}`);
  }
};

const setupLogin = () => {
  const form = el("login-form");
  if (!form) return;

  if (state.user) {
    setValue("email", state.user.email);
    setText("login-status", `Logged in as ${state.user.email}`);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = el("email").value.trim();
    state.user = { email };
    saveState();
    setText("login-status", `Logged in as ${email}`);
    renderCurrentUser();
  });
};

const setupSignup = () => {
  const form = el("signup-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = el("signup-email").value.trim();
    const displayName = el("signup-display-name").value.trim();
    const skillLevel = el("signup-skill-level").value;

    state.user = { email };
    state.profile = { displayName, skillLevel };
    saveState();

    setText("signup-status", `Welcome ${displayName}! Account created.`);
    renderCurrentUser();
  });
};

const setupProfile = () => {
  const form = el("profile-form");
  if (!form) return;

  syncProfile();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const displayName = el("display-name").value.trim();
    const skillLevel = el("skill-level").value;
    state.profile = { displayName, skillLevel };
    saveState();
    setText("profile-status", `${displayName} (${skillLevel}) saved.`);
  });
};

const setupTracker = () => {
  const form = el("activity-form");
  if (!form) return;

  renderActivities();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = el("activity-name").value.trim();
    const miles = Number(el("activity-miles").value);
    const timeMinutes = Number(el("activity-time").value);

    state.activities.push({ name, miles, timeMinutes });
    saveState();
    renderActivities();
    form.reset();
  });
};

const setupSchedule = () => {
  const form = el("schedule-form");
  if (!form) return;

  renderSchedule();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const date = el("schedule-date").value;
    const plan = el("schedule-plan").value.trim();

    state.schedule.push({ date, plan });
    saveState();
    renderSchedule();
    form.reset();
  });
};

const setupTeam = () => {
  const form = el("team-form");
  if (!form) return;

  syncTeam();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const team = el("team-name").value.trim();
    state.team = team;
    saveState();
    setText("team-status", `Joined team: ${team}`);
  });
};

const setupLogout = () => {
  const button = el("logout-btn");
  if (!button) return;

  button.addEventListener("click", () => {
    state.user = null;
    saveState();
    renderCurrentUser();
  });
};

renderCurrentUser();
renderGear();
setupLogin();
setupSignup();
setupProfile();
setupTracker();
setupSchedule();
setupTeam();
setupLogout();
