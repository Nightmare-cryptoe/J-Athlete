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

const renderGear = () => {
  el("gear-list").innerHTML = gearCatalog
    .map((item) => `<li>${item.name} - <strong>${item.price}</strong> <button type="button">Buy</button></li>`)
    .join("");
};

const renderActivities = () => {
  const totalMiles = state.activities.reduce((sum, a) => sum + a.miles, 0);
  const totalTime = state.activities.reduce((sum, a) => sum + a.timeMinutes, 0);
  el("total-miles").textContent = totalMiles.toFixed(2);
  el("total-time").textContent = String(totalTime);

  el("activity-list").innerHTML = state.activities
    .map((a) => `<li>${a.name}: ${a.miles.toFixed(2)} mi in ${a.timeMinutes} min</li>`)
    .join("");
};

const renderSchedule = () => {
  const sorted = [...state.schedule].sort((a, b) => a.date.localeCompare(b.date));
  el("schedule-list").innerHTML = sorted.map((s) => `<li>${s.date}: ${s.plan}</li>`).join("");
};

const syncForms = () => {
  if (state.user) {
    el("login-status").textContent = `Logged in as ${state.user.email}`;
    el("email").value = state.user.email;
  }

  if (state.profile) {
    el("display-name").value = state.profile.displayName;
    el("skill-level").value = state.profile.skillLevel;
    el("profile-status").textContent = `${state.profile.displayName} (${state.profile.skillLevel}) saved.`;
  }

  if (state.team) {
    el("team-status").textContent = `Joined team: ${state.team}`;
    el("team-name").value = state.team;
  }
};

const setupHandlers = () => {
  el("login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = el("email").value.trim();
    state.user = { email };
    saveState();
    el("login-status").textContent = `Logged in as ${email}`;
  });

  el("profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const displayName = el("display-name").value.trim();
    const skillLevel = el("skill-level").value;
    state.profile = { displayName, skillLevel };
    saveState();
    el("profile-status").textContent = `${displayName} (${skillLevel}) saved.`;
  });

  el("activity-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const name = el("activity-name").value.trim();
    const miles = Number(el("activity-miles").value);
    const timeMinutes = Number(el("activity-time").value);

    state.activities.push({ name, miles, timeMinutes });
    saveState();
    renderActivities();
    el("activity-form").reset();
  });

  el("schedule-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const date = el("schedule-date").value;
    const plan = el("schedule-plan").value.trim();

    state.schedule.push({ date, plan });
    saveState();
    renderSchedule();
    el("schedule-form").reset();
  });

  el("team-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const team = el("team-name").value.trim();
    state.team = team;
    saveState();
    el("team-status").textContent = `Joined team: ${team}`;
  });
};

renderGear();
renderActivities();
renderSchedule();
syncForms();
setupHandlers();
