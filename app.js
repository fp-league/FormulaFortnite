// ==================== CONFIG ====================
// Fill these in (read-only Access Key — see README).
// Until you do, the site shows sample data.
const BIN_ID = "6a710bbdf5f4af5e29e6f916";
const ACCESS_KEY = "$2a$10$9lPLXs9BTSMO0.aJ3iQ4mOmNGglYCLnp5waM4xGFNoFiXbE77yhey";
const JSON_CONFIGURED = BIN_ID !== "YOUR_BIN_ID" && ACCESS_KEY !== "YOUR_ACCESS_KEY";

// ==================== GLOBAL STATE ====================
let currentPage = 'home';
const drivers = [];
const teams = [];
const races = [];
let standings = [];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initLightsOut();
    setupNavigation();
    setupEventListeners();
    loadData();
});

// ==================== LIGHTS OUT INTRO ====================
function initLightsOut() {
    const lightsOut = document.getElementById('lightsOut');
    const countdown = document.getElementById('countdown');
    let count = 5;
    const interval = setInterval(() => {
        count--;
        countdown.textContent = count;
        if (count === 0) {
            clearInterval(interval);
            setTimeout(() => lightsOut.classList.add('hidden'), 500);
        }
    }, 500);
}

// ==================== NAVIGATION ====================
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        // Skip external links (like the admin page)
        if (link.getAttribute('href') && link.getAttribute('href').endsWith('.html')) return;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateTo(page);
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-page]') && !e.target.matches('.nav-link')) {
            const page = e.target.dataset.page;
            navigateTo(page);
        }
    });
}

function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = page;
        if (page === 'standings') renderFullStandings();
        else if (page === 'calendar') renderCalendar();
        else if (page === 'teams') renderTeams();
        else if (page === 'drivers') renderDrivers();
        window.scrollTo(0, 0);
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) registerBtn.addEventListener('click', () => alert('Registration coming soon!'));

    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.tab === 'teams') renderTeamStandings();
            else renderFullStandings();
        });
    });
}

// ==================== DATA LOADING (JSON) ====================
async function loadData() {
    if (!JSON_CONFIGURED) {
        loadSampleData();
        return;
    }
    try {
        const res = await fetch("https://api.jsonbin.io/v3/b/" + BIN_ID + "/latest", {
            headers: { "X-Access-Key": ACCESS_KEY }
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();
        const record = json.record || {};

        drivers.push(...(record.drivers || []));
        teams.push(...(record.teams || []));
        races.push(...(record.races || []));

        standings = [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
        renderHome();
    } catch (error) {
        console.error('Error loading data:', error);
        loadSampleData();
    }
}

// ==================== SAMPLE DATA (fallback) ====================
function loadSampleData() {
    const sampleDrivers = [
        { name: 'Alex Racer', team: 'Red Velocity', points: 185, wins: 3, poles: 2, races: 5 },
        { name: 'Jordan Swift', team: 'Blue Storm', points: 162, wins: 2, poles: 3, races: 5 },
        { name: 'Casey Drift', team: 'Neon Flux', points: 151, wins: 2, poles: 1, races: 5 },
        { name: 'Morgan Apex', team: 'Red Velocity', points: 138, wins: 1, poles: 2, races: 5 },
        { name: 'Taylor Nova', team: 'Black Cipher', points: 125, wins: 1, poles: 0, races: 5 },
    ];
    const sampleTeams = [
        { name: 'Red Velocity', points: 323, drivers: ['Alex Racer', 'Morgan Apex'] },
        { name: 'Blue Storm', points: 162, drivers: ['Jordan Swift'] },
        { name: 'Neon Flux', points: 151, drivers: ['Casey Drift'] },
        { name: 'Black Cipher', points: 125, drivers: ['Taylor Nova'] },
    ];
    const sampleRaces = [
        { name: 'Season Opener', track: 'Neo Tokyo 500', date: '2026-02-15', format: 'Sprint', laps: 50, status: 'completed' },
        { name: 'Paradise Desert', track: 'Oasis Circuit', date: '2026-02-22', format: 'Classic', laps: 75, status: 'completed' },
        { name: 'Urban Chase', track: 'Downtown Circuit', date: '2026-03-01', format: 'Sprint', laps: 40, status: 'upcoming' },
        { name: 'Final Lap', track: 'Orbital Track', date: '2026-03-08', format: 'Championship', laps: 100, status: 'upcoming' },
    ];
    drivers.push(...sampleDrivers);
    teams.push(...sampleTeams);
    races.push(...sampleRaces);
    standings = [...sampleDrivers].sort((a, b) => (b.points || 0) - (a.points || 0));
    renderHome();
}

// ==================== RENDER HOME ====================
function renderHome() {
    document.getElementById('activePilots').textContent = drivers.length;
    const nextRace = races.find(r => r.status === 'upcoming') || races[0];
    if (nextRace) {
        document.getElementById('raceNumber').textContent = String(races.indexOf(nextRace) + 1).padStart(2, '0');
        document.getElementById('raceName').textContent = nextRace.name;
        document.getElementById('raceTrack').textContent = nextRace.track;
        document.getElementById('raceDate').textContent = new Date(nextRace.date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('raceFormat').textContent = nextRace.format;
        document.getElementById('raceLaps').textContent = nextRace.laps;
    }
    renderStandingsPreview();
}

function renderStandingsPreview() {
    const tbody = document.getElementById('standingsBody');
    tbody.innerHTML = '';
    standings.slice(0, 10).forEach((driver, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="pos">${index + 1}</td>
            <td class="driver">${driver.name}</td>
            <td class="team">${driver.team}</td>
            <td class="points">${driver.points || 0}</td>`;
        tbody.appendChild(row);
    });
}

function renderFullStandings() {
    const tbody = document.getElementById('fullStandingsBody');
    tbody.innerHTML = '';
    standings.forEach((driver, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="pos">${index + 1}</td>
            <td class="driver">${driver.name}</td>
            <td class="team">${driver.team}</td>
            <td class="points">${driver.points || 0}</td>
            <td>${driver.races || 0}</td>
            <td>${driver.wins || 0}</td>
            <td>${driver.poles || 0}</td>`;
        tbody.appendChild(row);
    });
}

function renderTeamStandings() {
    const tbody = document.getElementById('fullStandingsBody');
    tbody.innerHTML = '';
    const teamStandings = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0));
    teamStandings.forEach((team, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="pos">${index + 1}</td>
            <td class="driver" style="font-weight:700;">${team.name}</td>
            <td class="team">Team</td>
            <td class="points">${team.points || 0}</td>
            <td>${(team.drivers || []).length}</td>
            <td>-</td>
            <td>-</td>`;
        tbody.appendChild(row);
    });
}

// ==================== RENDER CALENDAR ====================
function renderCalendar() {
    const container = document.getElementById('calendarContainer');
    container.innerHTML = '';
    if (races.length === 0) { container.innerHTML = '<p>No races scheduled yet.</p>'; return; }
    races.forEach((race, index) => {
        const date = new Date(race.date);
        const formattedDate = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        const event = document.createElement('div');
        event.className = 'calendar-event';
        event.innerHTML = `
            <div class="event-date">
                <div style="font-size:0.8rem;opacity:0.7;">Race</div>
                ${String(index + 1).padStart(2, '0')}
            </div>
            <div class="event-info">
                <h3>${race.name}</h3>
                <p class="event-track">${race.track}</p>
                <p style="font-size:0.85rem;color:var(--ff-text);">${formattedDate}</p>
            </div>
            <div class="event-status">
                <div style="margin-bottom:0.25rem;">${race.format}</div>
                <div style="font-size:0.75rem;opacity:0.7;">${race.laps} LAPS</div>
            </div>`;
        container.appendChild(event);
    });
}

// ==================== RENDER TEAMS ====================
function renderTeams() {
    const grid = document.getElementById('teamsGrid');
    grid.innerHTML = '';
    if (teams.length === 0) { grid.innerHTML = '<p>No teams available yet.</p>'; return; }
    teams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `
            <h3>${team.name}</h3>
            <div style="color:var(--ff-orange);font-family:var(--font-mono);margin:1rem 0;">
                ${team.points || 0} <span style="font-size:0.8rem;">POINTS</span>
            </div>
            <p style="font-size:0.9rem;color:var(--ff-text);margin-bottom:0.5rem;">Drivers</p>
            <ul style="list-style:none;font-size:0.85rem;">
                ${(team.drivers || []).map(d => `<li style="opacity:0.8;">• ${d}</li>`).join('')}
            </ul>`;
        grid.appendChild(card);
    });
}

// ==================== RENDER DRIVERS ====================
function renderDrivers() {
    const grid = document.getElementById('driversGrid');
    grid.innerHTML = '';
    if (drivers.length === 0) { grid.innerHTML = '<p>No drivers available yet.</p>'; return; }
    drivers.forEach(driver => {
        const card = document.createElement('div');
        card.className = 'driver-card';
        card.innerHTML = `
            <h3>${driver.name}</h3>
            <p style="color:var(--ff-orange);font-size:0.9rem;margin-bottom:1rem;">${driver.team}</p>
            <div style="background:var(--ff-gray-light);padding:1rem;border-radius:2px;margin-bottom:1rem;">
                <div style="font-size:0.8rem;color:var(--ff-text);opacity:0.7;margin-bottom:0.3rem;">POINTS</div>
                <div style="font-family:var(--font-display);font-size:1.8rem;color:var(--ff-red);">${driver.points || 0}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:0.85rem;">
                <div><span style="opacity:0.7;">Wins</span><div style="color:var(--ff-orange);font-weight:700;">${driver.wins || 0}</div></div>
                <div><span style="opacity:0.7;">Poles</span><div style="color:var(--ff-orange);font-weight:700;">${driver.poles || 0}</div></div>
            </div>`;
        grid.appendChild(card);
    });
}

// ==================== SERVICE WORKER ====================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
}
