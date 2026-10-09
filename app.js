const storageKey = "j-athlete-data";

const defaultState = {
  user: null,
  accounts: [],
  profile: null,
  team: null,
  activities: [],
  schedule: [],
};

const teamCatalog = [
  { name: "Sunrise Racers", sport: "Track & Field", city: "San Mateo", level: "Intermediate" },
  { name: "Bay Hoops Crew", sport: "Basketball", city: "San Francisco", level: "Advanced" },
  { name: "Peninsula Strikers", sport: "Soccer", city: "Redwood City", level: "Beginner" },
  { name: "Golden State Swing", sport: "Baseball", city: "Oakland", level: "Elite" },
  { name: "Coastline Cyclers", sport: "Cycling", city: "Half Moon Bay", level: "Intermediate" },
];

const gearCatalog = [
  { name: "Road Running Shoes", category: "Footwear", price: 120, rating: 4.8 },
  { name: "Hydration Vest", category: "Recovery", price: 75, rating: 4.6 },
  { name: "Performance Socks", category: "Footwear", price: 18, rating: 4.4 },
  { name: "GPS Sports Watch", category: "Tech", price: 199, rating: 4.9 },
  { name: "Training Cones Set", category: "Training", price: 26, rating: 4.5 },
  { name: "Compression Sleeve", category: "Recovery", price: 24, rating: 4.3 },
];

const authFreePages = new Set(["index.html", "login.html", "signup.html", "about.html"]);
const currentPage = window.location.pathname.split("/").pop() || "index.html";

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

const normalizeUsername = (value) => value.trim().toLowerCase();

const emptyAccountData = () => ({
  profile: null,
  team: null,
  activities: [],
  schedule: [],
});

const findAccountByUsername = (username) =>
  state.accounts.find((account) => account.username === normalizeUsername(username));

const loadAccountDataIntoState = (account) => {
  state.profile = account.profile ? { ...account.profile } : null;
  state.team = account.team ?? null;
  state.activities = Array.isArray(account.activities) ? [...account.activities] : [];
  state.schedule = Array.isArray(account.schedule) ? [...account.schedule] : [];
};

const persistStateToCurrentAccount = () => {
  if (!state.user?.username) return;

  const account = findAccountByUsername(state.user.username);
  if (!account) return;

  account.profile = state.profile ? { ...state.profile } : null;
  account.team = state.team ?? null;
  account.activities = [...state.activities];
  account.schedule = [...state.schedule];
};

const migrateLegacyState = () => {
  let changed = false;

  if (!Array.isArray(state.accounts)) {
    state.accounts = [];
    changed = true;
  }

  if (state.user?.email && !state.user.username) {
    const derivedUsername = normalizeUsername(state.user.email.split("@")[0] || state.user.email);
    let account = findAccountByUsername(derivedUsername);

    if (!account) {
      account = {
        username: derivedUsername,
        email: state.user.email,
        password: "athlete123",
        ...emptyAccountData(),
      };
      state.accounts.push(account);
      changed = true;
    }

    account.profile = state.profile ? { ...state.profile } : account.profile;
    account.team = state.team ?? account.team ?? null;
    account.activities = state.activities.length ? [...state.activities] : account.activities ?? [];
    account.schedule = state.schedule.length ? [...state.schedule] : account.schedule ?? [];
    state.user = { username: account.username, email: account.email || "" };
    changed = true;
  }

  if (state.user?.username) {
    const account = findAccountByUsername(state.user.username);
    if (account) {
      state.user = { username: account.username, email: account.email || "" };
      loadAccountDataIntoState(account);
      changed = true;
    } else {
      state.user = null;
      state.profile = null;
      state.team = null;
      state.activities = [];
      state.schedule = [];
      changed = true;
    }
  }

  if (changed) saveState();
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

const formatPrice = (value) => `$${value.toFixed(2)}`;

const enforceAccess = () => {
  if (authFreePages.has(currentPage)) return true;
  if (!state.user) {
    window.location.href = "login.html";
    return false;
  }
  if (!state.profile && currentPage !== "profile.html") {
    window.location.href = "profile.html";
    return false;
  }
  return true;
};

const renderCurrentUser = () => {
  setText("current-user", state.user ? `Signed in: ${state.user.username}` : "Not signed in");
};

const renderGear = () => {
  const list = el("gear-list");
  if (!list) return;

  list.innerHTML = gearCatalog
    .map(
      (item, index) =>
        `<li><strong>${item.name}</strong> · ${item.category} · <strong>${formatPrice(item.price)}</strong> · ⭐ ${item.rating.toFixed(1)} <button type="button" data-gear-index="${index}">Buy</button></li>`,
    )
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
  } else if (el("profile-status")) {
    setText("profile-status", "Create your athlete profile to continue to your dashboard.");
  }
};

const syncTeam = () => {
  if (state.team) {
    setText("team-status", `Current team: ${state.team}`);
  }
};

const setupLogin = () => {
  const form = el("login-form");
  if (!form) return;

  if (state.user?.username) {
    setValue("username", state.user.username);
    setText("login-status", `Logged in as ${state.user.username}`);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = normalizeUsername(el("username").value);
    const password = el("password").value;
    const account = findAccountByUsername(username);

    if (!account || account.password !== password) {
      setText("login-status", "Invalid username or password.");
      return;
    }

    state.user = { username: account.username, email: account.email || "" };
    loadAccountDataIntoState(account);
    saveState();
    setText("login-status", `Logged in as ${account.username}`);
    renderCurrentUser();

    if (!state.profile) {
      window.location.href = "profile.html";
      return;
    }

    window.location.href = "dashboard.html";
  });
};

const setupSignup = () => {
  const form = el("signup-form");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = normalizeUsername(el("signup-username").value);
    const email = el("signup-email").value.trim();
    const password = el("signup-password").value;
    const confirmPassword = el("signup-confirm-password").value;
    const displayName = el("signup-display-name").value.trim();
    const skillLevel = el("signup-skill-level").value;

    if (username.length < 3) {
      setText("signup-status", "Username must be at least 3 characters.");
      return;
    }

    if (findAccountByUsername(username)) {
      setText("signup-status", "That username is already taken.");
      return;
    }

    if (password !== confirmPassword) {
      setText("signup-status", "Passwords do not match.");
      return;
    }

    const account = {
      username,
      email,
      password,
      ...emptyAccountData(),
      profile: { displayName, skillLevel },
    };

    state.accounts.push(account);
    state.user = { username, email };
    loadAccountDataIntoState(account);
    saveState();

    setText("signup-status", `Welcome ${displayName}! Account created for ${username}.`);
    renderCurrentUser();
    window.location.href = "dashboard.html";
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
    persistStateToCurrentAccount();
    saveState();
    setText("profile-status", `${displayName} (${skillLevel}) saved.`);
    window.location.href = "dashboard.html";
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
    persistStateToCurrentAccount();
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
    persistStateToCurrentAccount();
    saveState();
    renderSchedule();
    form.reset();
  });
};

const renderTeamMarketplace = () => {
  const teamList = el("team-list");
  const gearGrid = el("team-gear-grid");
  const searchInput = el("team-search");
  const gearFilter = el("gear-filter");

  if (!teamList || !gearGrid || !searchInput || !gearFilter) return;

  const teamSearch = searchInput.value.trim().toLowerCase();
  const selectedCategory = gearFilter.value;

  const visibleTeams = teamCatalog.filter((team) => {
    const content = `${team.name} ${team.sport} ${team.city} ${team.level}`.toLowerCase();
    return content.includes(teamSearch);
  });

  teamList.innerHTML = visibleTeams
    .map(
      (team) => `
      <article class="shop-card team-card">
        <p class="shop-card-tag">${team.sport}</p>
        <h3>${team.name}</h3>
        <p>${team.city} · ${team.level}</p>
        <button type="button" class="btn" data-team-name="${team.name}">Join Team</button>
      </article>
    `,
    )
    .join("");

  teamList.querySelectorAll("button[data-team-name]").forEach((button) => {
    button.addEventListener("click", () => {
      state.team = button.dataset.teamName;
      persistStateToCurrentAccount();
      saveState();
      setText("team-status", `Current team: ${state.team}`);
    });
  });

  const visibleGear = gearCatalog.filter((item) => selectedCategory === "All" || item.category === selectedCategory);

  gearGrid.innerHTML = visibleGear
    .map(
      (item, index) => `
      <article class="shop-card gear-card">
        <p class="shop-card-tag">${item.category}</p>
        <h3>${item.name}</h3>
        <p><strong>${formatPrice(item.price)}</strong> · ⭐ ${item.rating.toFixed(1)}</p>
        <button type="button" class="btn" data-market-gear-index="${index}">Add to Cart</button>
      </article>
    `,
    )
    .join("");

  gearGrid.querySelectorAll("button[data-market-gear-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const gear = visibleGear[Number(button.dataset.marketGearIndex)];
      alert(`Added ${gear.name} to cart!`);
    });
  });
};

const setupTeam = () => {
  const searchInput = el("team-search");
  const gearFilter = el("gear-filter");
  if (!searchInput || !gearFilter) return;

  syncTeam();
  renderTeamMarketplace();

  searchInput.addEventListener("input", renderTeamMarketplace);
  gearFilter.addEventListener("change", renderTeamMarketplace);
};

const setupLogout = () => {
  const button = el("logout-btn");
  if (!button) return;

  button.addEventListener("click", () => {
    state.user = null;
    state.profile = null;
    state.team = null;
    state.activities = [];
    state.schedule = [];
    saveState();
    renderCurrentUser();
    window.location.href = "index.html";
  });
};

migrateLegacyState();

if (enforceAccess()) {
  renderCurrentUser();
  renderGear();
  setupLogin();
  setupSignup();
  setupProfile();
  setupTracker();
  setupSchedule();
  setupTeam();
  setupLogout();
}
