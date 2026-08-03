// ==================== CONFIG ====================
const BIN_ID = "6a710bbdf5f4af5e29e6f916";
const ACCESS_KEY = "$2a$10$9lPLXs9BTSMO0.aJ3iQ4mOmNGglYCLnp5waM4xGFNoFiXbE77yhey";
const JSON_CONFIGURED = BIN_ID !== "YOUR_BIN_ID" && ACCESS_KEY !== "YOUR_ACCESS_KEY";

// ==================== STATE ====================
let currentPage = 'home';
const drivers = [];
const teams = [];
const races = [];
const news = [];
let archive = {};
let seasonName = '2026';
let standings = [];
let selectedSeason = 'live';
let standingsTab = 'drivers';

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initLightsOut();
    setupNavigation();
    setupEventListeners();
    setupModal();
    loadData();
});

// ==================== LIGHTS OUT ====================
function initLightsOut() {
    const lightsOut = document.getElementById('lightsOut');
    const countdown = document.getElementById('countdown');
    let count = 5;
    const interval = setInterval(() => {
        count--; countdown.textContent = count;
        if (count === 0) { clearInterval(interval); setTimeout(() => lightsOut.classList.add('hidden'), 500); }
    }, 500);
}

// ==================== NAVIGATION ====================
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('href') && link.getAttribute('href').endsWith('.html')) return;
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
    document.addEventListener('click', (e) => {
        if (e.target.matches('[data-page]') && !e.target.matches('.nav-link')) navigateTo(e.target.dataset.page);
    });
}
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = page;
        if (page === 'standings') renderStandingsView();
        else if (page === 'calendar') renderCalendar();
        else if (page === 'teams') renderTeams();
        else if (page === 'drivers') renderDrivers();
        window.scrollTo(0, 0);
    }
}

// ==================== EVENTS ====================
function setupEventListeners() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (navToggle) navToggle.addEventListener('click', () => { navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex'; });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            standingsTab = btn.dataset.tab;
            renderStandingsView();
        });
    });

    const seasonSelect = document.getElementById('seasonSelect');
    if (seasonSelect) seasonSelect.addEventListener('change', () => { selectedSeason = seasonSelect.value; renderStandingsView(); });
}

// ==================== MODAL ====================
function setupModal() {
    const modal = document.getElementById('modal');
    document.getElementById('modalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}
function openModal(html) {
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modal').classList.remove('hidden');
}
function closeModal() { document.getElementById('modal').classList.add('hidden'); }

// ==================== LOAD ====================
async function loadData() {
    if (!JSON_CONFIGURED) { loadSampleData(); afterLoad(); return; }
    try {
        const res = await fetch("https://api.jsonbin.io/v3/b/" + BIN_ID + "/latest", { headers: { "X-Access-Key": ACCESS_KEY } });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();
        const record = json.record || {};
        drivers.push(...(record.drivers || []));
        teams.push(...(record.teams || []));
        races.push(...(record.races || []));
        news.push(...(record.news || []));
        archive = record.archive || {};
        seasonName = record.seasonName || '2026';
        standings = [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
        afterLoad();
    } catch (error) {
        console.error('Error loading data:', error);
        loadSampleData(); afterLoad();
    }
}
function afterLoad() { populateSeasons(); renderHome(); }

// ==================== SAMPLE ====================
function loadSampleData() {
    drivers.push(
        { name: 'Alex Racer', team: 'Red Velocity', points: 185, wins: 3, poles: 2, races: 5, photo: '' },
        { name: 'Jordan Swift', team: 'Blue Storm', points: 162, wins: 2, poles: 3, races: 5, photo: '' },
        { name: 'Casey Drift', team: 'Neon Flux', points: 151, wins: 2, poles: 1, races: 5, photo: '' },
        { name: 'Morgan Apex', team: 'Red Velocity', points: 138, wins: 1, poles: 2, races: 5, photo: '' },
        { name: 'Taylor Nova', team: 'Black Cipher', points: 125, wins: 1, poles: 0, races: 5, photo: '' }
    );
    teams.push(
        { name: 'Red Velocity', points: 323, drivers: ['Alex Racer', 'Morgan Apex'] },
        { name: 'Blue Storm', points: 162, drivers: ['Jordan Swift'] },
        { name: 'Neon Flux', points: 151, drivers: ['Casey Drift'] },
        { name: 'Black Cipher', points: 125, drivers: ['Taylor Nova'] }
    );
    races.push(
        { name: 'Season Opener', track: 'Neo Tokyo 500', date: '2026-02-15', format: 'Sprint', laps: 50, status: 'completed', results: [
            { driver: 'Alex Racer', pos: 1, pts: 25 }, { driver: 'Jordan Swift', pos: 2, pts: 18 }, { driver: 'Casey Drift', pos: 3, pts: 15 } ] },
        { name: 'Paradise Desert', track: 'Oasis Circuit', date: '2026-02-22', format: 'Classic', laps: 75, status: 'completed', results: [
            { driver: 'Casey Drift', pos: 1, pts: 25 }, { driver: 'Alex Racer', pos: 2, pts: 18 }, { driver: 'Morgan Apex', pos: 3, pts: 15 } ] },
        { name: 'Urban Chase', track: 'Downtown Circuit', date: '2026-03-01', format: 'Sprint', laps: 40, status: 'upcoming', results: [] },
        { name: 'Final Lap', track: 'Orbital Track', date: '2026-03-08', format: 'Championship', laps: 100, status: 'upcoming', results: [] }
    );
    news.push(
        { title: 'Alex Racer takes championship lead', body: 'A dominant win at Neo Tokyo puts Red Velocity on top.', date: '2026-02-15' },
        { title: 'Blue Storm sign new pilot', body: 'Sam Turbo joins the grid ahead of the desert round.', date: '2026-02-18' },
        { title: 'Season finale confirmed', body: 'The title will be decided at Orbital Track.', date: '2026-02-20' }
    );
    archive = {
        '2025': {
            seasonName: '2025',
            drivers: [
                { name: 'Morgan Apex', team: 'Red Velocity', points: 298, wins: 6, poles: 4, races: 12, photo: '' },
                { name: 'Alex Racer', team: 'Red Velocity', points: 271, wins: 4, poles: 5, races: 12, photo: '' },
                { name: 'Taylor Nova', team: 'Black Cipher', points: 240, wins: 3, poles: 2, races: 12, photo: '' }
            ],
            teams: [
                { name: 'Red Velocity', points: 569, drivers: ['Morgan Apex', 'Alex Racer'] },
                { name: 'Black Cipher', points: 240, drivers: ['Taylor Nova'] }
            ],
            races: [
                { name: '2025 Finale', track: 'Orbital Track', date: '2025-11-30', format: 'Championship', laps: 100, status: 'completed', results: [
                    { driver: 'Morgan Apex', pos: 1, pts: 25 }, { driver: 'Alex Racer', pos: 2, pts: 18 } ] }
            ]
        }
    };
    seasonName = '2026';
    standings = [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
}

// ==================== SEASON HELPERS ====================
function populateSeasons() {
    const sel = document.getElementById('seasonSelect');
    if (!sel) return;
    let opts = `<option value="live">${seasonName} (Live)</option>`;
    Object.keys(archive).sort().reverse().forEach(key => { opts += `<option value="${key}">${key}</option>`; });
    sel.innerHTML = opts;
}
function seasonData(sel) {
    if (sel === 'live') return { drivers, teams, races };
    const a = archive[sel] || {};
    return { drivers: a.drivers || [], teams: a.teams || [], races: a.races || [] };
}

// ==================== HOME ====================
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
    const tbody = document.getElementById('standingsBody');
    tbody.innerHTML = '';
    standings.slice(0, 10).forEach((d, i) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td class="pos">${i + 1}</td><td class="driver">${d.name}</td><td class="team">${d.team}</td><td class="points">${d.points || 0}</td>`;
        tbody.appendChild(row);
    });
    renderNews();
}

// ==================== NEWS ====================
function renderNews() {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;
    if (!news.length) { grid.innerHTML = '<p style="color:var(--f1-muted);">No news yet.</p>'; return; }
    const sorted = [...news].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    grid.innerHTML = sorted.slice(0, 6).map(n => {
        const date = n.date ? new Date(n.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
        return `<div class="news-card"><div class="news-body"><div class="news-date">${date}</div><h3>${n.title || ''}</h3><p>${n.body || ''}</p></div></div>`;
    }).join('');
}

// ==================== STANDINGS VIEW ====================
function renderStandingsView() {
    const data = seasonData(selectedSeason);
    const tbody = document.getElementById('fullStandingsBody');
    tbody.innerHTML = '';
    if (standingsTab === 'teams') {
        [...data.teams].sort((a, b) => (b.points || 0) - (a.points || 0)).forEach((t, i) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td class="pos">${i + 1}</td><td class="driver" style="font-weight:700;">${t.name}</td><td class="team">Team</td><td class="points">${t.points || 0}</td><td>${(t.drivers || []).length}</td><td>-</td><td>-</td>`;
            tbody.appendChild(row);
        });
    } else {
        [...data.drivers].sort((a, b) => (b.points || 0) - (a.points || 0)).forEach((d, i) => {
            const row = document.createElement('tr');
            row.style.cursor = 'pointer';
            row.innerHTML = `<td class="pos">${i + 1}</td><td class="driver">${d.name}</td><td class="team">${d.team}</td><td class="points">${d.points || 0}</td><td>${d.races || 0}</td><td>${d.wins || 0}</td><td>${d.poles || 0}</td>`;
            row.addEventListener('click', () => openDriverModal(d));
            tbody.appendChild(row);
        });
    }
    // Archived-season race results below the table
    const sr = document.getElementById('seasonRaces');
    if (selectedSeason === 'live') { sr.innerHTML = ''; return; }
    const rlist = data.races || [];
    if (!rlist.length) { sr.innerHTML = ''; return; }
    sr.innerHTML = `<h2 style="margin:2.5rem 0 1.2rem;">${selectedSeason} RACE RESULTS</h2>` +
        [...rlist].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0)).map((r, i) => raceRowHTML(r, i)).join('');
    bindRaceRows(sr, rlist);
}

// ==================== CALENDAR ====================
function renderCalendar() {
    const container = document.getElementById('calendarContainer');
    container.innerHTML = '';
    if (races.length === 0) { container.innerHTML = '<p>No races scheduled yet.</p>'; return; }
    const sorted = [...races].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    container.innerHTML = sorted.map((r, i) => raceRowHTML(r, i)).join('');
    bindRaceRows(container, sorted);
}
function raceRowHTML(race, index) {
    const formattedDate = race.date ? new Date(race.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : 'TBC';
    const hasResults = race.results && race.results.length;
    return `<div class="calendar-event" data-idx="${index}" style="cursor:pointer;">
        <div class="event-date"><div style="font-size:0.8rem;color:var(--f1-muted);">Race</div>${String(index + 1).padStart(2, '0')}</div>
        <div class="event-info">
            <h3>${race.name}</h3>
            <p class="event-track">${race.track || ''}</p>
            <p style="font-size:0.85rem;color:var(--f1-muted);">${formattedDate}</p>
        </div>
        <div class="event-status">
            <div style="margin-bottom:0.25rem;">${race.format || ''}</div>
            <div style="font-size:0.75rem;color:var(--f1-muted);">${race.laps || 0} LAPS</div>
            <div style="margin-top:0.4rem;color:${hasResults ? 'var(--f1-red)' : 'var(--f1-muted)'};font-weight:700;">${hasResults ? 'VIEW RESULTS' : (race.status || '').toUpperCase()}</div>
        </div>
    </div>`;
}
function bindRaceRows(container, list) {
    container.querySelectorAll('.calendar-event').forEach(el => {
        el.addEventListener('click', () => openRaceModal(list[parseInt(el.dataset.idx)]));
    });
}
function openRaceModal(race) {
    if (!race) return;
    const date = race.date ? new Date(race.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBC';
    let body = `<div class="modal-race-head">
        <div class="modal-race-num">${race.name}</div>
        <p class="event-track">${race.track || ''}</p>
        <p style="color:var(--f1-muted);">${date} &middot; ${race.format || ''} &middot; ${race.laps || 0} laps</p>
    </div>`;
    if (race.results && race.results.length) {
        const rows = [...race.results].sort((a, b) => (a.pos || 99) - (b.pos || 99)).map(r =>
            `<tr><td class="pos">${r.pos}</td><td class="driver">${r.driver}</td><td class="points">${r.pts || 0}</td></tr>`).join('');
        body += `<table class="standings-table" style="margin-top:1rem;">
            <thead><tr><th class="pos">POS</th><th class="driver">DRIVER</th><th class="points">PTS</th></tr></thead>
            <tbody>${rows}</tbody></table>`;
    } else {
        body += `<p style="margin-top:1rem;color:var(--f1-muted);">No results yet — check back after the race.</p>`;
    }
    openModal(body);
}

// ==================== TEAMS ====================
function renderTeams() {
    const grid = document.getElementById('teamsGrid');
    grid.innerHTML = '';
    if (teams.length === 0) { grid.innerHTML = '<p>No teams available yet.</p>'; return; }
    teams.forEach(team => {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.innerHTML = `
            <h3>${team.name}</h3>
            <div style="color:var(--f1-red);font-weight:900;font-family:var(--font-display);margin:1rem 0;">${team.points || 0} <span style="font-size:0.8rem;color:var(--f1-muted);">POINTS</span></div>
            <p style="font-size:0.9rem;color:var(--f1-muted);margin-bottom:0.5rem;">Drivers</p>
            <ul style="list-style:none;font-size:0.9rem;">${(team.drivers || []).map(d => `<li style="color:var(--f1-text);">${d}</li>`).join('')}</ul>`;
        grid.appendChild(card);
    });
}

// ==================== DRIVERS ====================
function driverAvatar(driver, cls) {
    const initials = (driver.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    return driver.photo
        ? `<img class="${cls}" src="${driver.photo}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="${cls}-fallback" style="display:none;">${initials}</div>`
        : `<div class="${cls}-fallback">${initials}</div>`;
}
function renderDrivers() {
    const grid = document.getElementById('driversGrid');
    grid.innerHTML = '';
    if (drivers.length === 0) { grid.innerHTML = '<p>No drivers available yet.</p>'; return; }
    drivers.forEach(driver => {
        const card = document.createElement('div');
        card.className = 'driver-card';
        card.style.cursor = 'pointer';
        card.innerHTML = `
            ${driverAvatar(driver, 'driver-photo')}
            <h3>${driver.name}</h3>
            <p style="color:var(--f1-red);font-size:0.9rem;font-weight:600;margin-bottom:1rem;">${driver.team}</p>
            <div style="background:var(--f1-surface-2);padding:1rem;border-radius:8px;margin-bottom:1rem;">
                <div style="font-size:0.8rem;color:var(--f1-muted);margin-bottom:0.3rem;">POINTS</div>
                <div style="font-family:var(--font-display);font-weight:900;font-size:1.8rem;color:var(--f1-white);">${driver.points || 0}</div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:0.85rem;">
                <div><span style="color:var(--f1-muted);">Wins</span><div style="color:var(--f1-white);font-weight:700;">${driver.wins || 0}</div></div>
                <div><span style="color:var(--f1-muted);">Poles</span><div style="color:var(--f1-white);font-weight:700;">${driver.poles || 0}</div></div>
            </div>`;
        card.addEventListener('click', () => openDriverModal(driver));
        grid.appendChild(card);
    });
}
function openDriverModal(driver) {
    const pos = standings.findIndex(d => d.name === driver.name);
    const posText = pos >= 0 ? '#' + (pos + 1) : '-';
    const html = `
        <div class="driver-profile">
            ${driverAvatar(driver, 'profile-photo')}
            <h2 class="profile-name">${driver.name}</h2>
            <p class="profile-team">${driver.team || ''}</p>
            <div class="profile-grid">
                <div class="profile-stat"><span>Championship Pos</span><strong>${posText}</strong></div>
                <div class="profile-stat"><span>Points</span><strong>${driver.points || 0}</strong></div>
                <div class="profile-stat"><span>Wins</span><strong>${driver.wins || 0}</strong></div>
                <div class="profile-stat"><span>Poles</span><strong>${driver.poles || 0}</strong></div>
                <div class="profile-stat"><span>Races</span><strong>${driver.races || 0}</strong></div>
            </div>
        </div>`;
    openModal(html);
}

// ==================== SERVICE WORKER ====================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
}
