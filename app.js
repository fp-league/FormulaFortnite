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
let fantasyTeams = [];
let seasonName = '2026';
let standings = [];
let selectedSeason = 'live';
let standingsTab = 'drivers';
let homeSeason = 'live';
let homeTab = 'drivers';
let resultsSeason = 'live';
let resultsTab = 'races';

// ==================== PWA: INSTALL PROMPT ====================
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    // Show after 30s if not dismissed before
    const dismissed = localStorage.getItem('ff_install_dismissed');
    if (!dismissed) setTimeout(() => {
        const banner = document.getElementById('installBanner');
        if (banner && deferredInstallPrompt) banner.style.display = 'flex';
    }, 30000);
});

function installApp() {
    const banner = document.getElementById('installBanner');
    if (banner) banner.style.display = 'none';
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(choice => {
        if (choice.outcome === 'accepted') localStorage.setItem('ff_install_dismissed', '1');
        deferredInstallPrompt = null;
    });
}
function dismissInstall() {
    document.getElementById('installBanner').style.display = 'none';
    localStorage.setItem('ff_install_dismissed', '1');
}

// ==================== PWA: NOTIFICATIONS ====================
function enableNotifs() {
    document.getElementById('notifBanner').style.display = 'none';
    localStorage.setItem('ff_notif_dismissed', '1');
    if (window.OneSignal) {
        window.OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.Notifications.requestPermission();
        });
    }
}
function dismissNotif() {
    document.getElementById('notifBanner').style.display = 'none';
    localStorage.setItem('ff_notif_dismissed', '1');
}

// ==================== PWA: DEEP LINKS ====================
function handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    if (page) navigateTo(page);
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initLightsOut();
    setupNavigation();
    setupEventListeners();
    setupModal();
    loadData();
    handleDeepLink();
    // Show notification prompt after 60s if not dismissed
    setTimeout(() => {
        const dismissed = localStorage.getItem('ff_notif_dismissed');
        const banner = document.getElementById('notifBanner');
        if (!dismissed && banner && 'Notification' in window && Notification.permission === 'default') {
            banner.style.display = 'flex';
        }
    }, 60000);
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
        if (e.target.matches('[data-page]') && !e.target.matches('.nav-link')) {
            navigateTo(e.target.dataset.page);
            navLinks.forEach(l => l.classList.remove('active'));
            const match = document.querySelector('.nav-link[data-page="' + e.target.dataset.page + '"]');
            if (match) match.classList.add('active');
        }
    });
}
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const targetPage = document.getElementById(page);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = page;
        if (page === 'home') renderHome();
        else if (page === 'standings') renderStandingsView();
        else if (page === 'results') renderResults();
        else if (page === 'calendar') renderCalendar();
        else if (page === 'teams') renderTeams();
        else if (page === 'fantasy') renderFantasy();
        window.scrollTo(0, 0);
    }
}

// ==================== EVENTS ====================
function setupEventListeners() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('open');
        });
    }
    // Close menu when a nav link is tapped
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('open');
            navToggle.classList.remove('open');
        });
    });

    // Standings page tabs
    document.querySelectorAll('#standings .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#standings .tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            standingsTab = btn.dataset.tab;
            renderStandingsView();
        });
    });
    const seasonSelect = document.getElementById('seasonSelect');
    if (seasonSelect) seasonSelect.addEventListener('change', () => { selectedSeason = seasonSelect.value; renderStandingsView(); });

    // Home tabs
    document.querySelectorAll('.htab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.htab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            homeTab = btn.dataset.htab;
            renderHomeSeason();
        });
    });
    const homeSel = document.getElementById('homeSeasonSelect');
    if (homeSel) homeSel.addEventListener('change', () => { homeSeason = homeSel.value; renderHomeSeason(); });

    const calSel = document.getElementById('calSeasonSelect');
    if (calSel) calSel.addEventListener('change', () => { calSeason = calSel.value; renderCalendar(); });

    // Results page tabs + season
    document.querySelectorAll('.rtab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.rtab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            resultsTab = btn.dataset.rtab;
            renderResults();
        });
    });
    const resSel = document.getElementById('resultsSeasonSelect');
    if (resSel) resSel.addEventListener('change', () => { resultsSeason = resSel.value; renderResults(); });
}

// ==================== MODAL ====================
function setupModal() {
    const modal = document.getElementById('modal');
    document.getElementById('modalClose').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}
function openModal(html) { document.getElementById('modalContent').innerHTML = html; document.getElementById('modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('modal').classList.add('hidden'); }

// ==================== LOAD ====================
async function loadData() {
    if (!JSON_CONFIGURED) { loadSampleData(); afterLoad(); return; }
    try {
        const res = await fetch("https://api.jsonbin.io/v3/b/" + BIN_ID + "/latest", {
            headers: { "X-Access-Key": ACCESS_KEY }
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();
        const r = json.record || {};
        // Safe push — handle missing/malformed arrays gracefully
        if (Array.isArray(r.drivers)) drivers.push(...r.drivers);
        if (Array.isArray(r.teams))   teams.push(...r.teams);
        if (Array.isArray(r.races))   races.push(...r.races);
        if (Array.isArray(r.news))    news.push(...r.news);
        if (Array.isArray(r.fantasy)) fantasyTeams.push(...r.fantasy);
        archive    = (r.archive && typeof r.archive === 'object') ? r.archive : {};
        seasonName = r.seasonName || '2026';
        standings  = [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
        afterLoad();
    } catch (error) {
        console.warn('JSONBin load failed, using sample data:', error.message);
        loadSampleData();
        afterLoad();
    }
}
function afterLoad() { populateSeasons(); renderHome(); }

// ==================== SAMPLE ====================
function loadSampleData() {
    drivers.push(
        { name: 'Alex Racer', team: 'Red Velocity', nationality: 'GBR', number: 7, points: 185, wins: 3, poles: 2, races: 5, photo: '' },
        { name: 'Jordan Swift', team: 'Blue Storm', nationality: 'USA', number: 11, points: 162, wins: 2, poles: 3, races: 5, photo: '' },
        { name: 'Casey Drift', team: 'Neon Flux', nationality: 'AUS', number: 4, points: 151, wins: 2, poles: 1, races: 5, photo: '' },
        { name: 'Morgan Apex', team: 'Red Velocity', nationality: 'GBR', number: 23, points: 138, wins: 1, poles: 2, races: 5, photo: '' },
        { name: 'Taylor Nova', team: 'Black Cipher', nationality: 'FRA', number: 81, points: 125, wins: 1, poles: 0, races: 5, photo: '' }
    );
    teams.push(
        { name: 'Red Velocity', points: 323, color: '#E10600', logo: '', car: '', drivers: ['Alex Racer', 'Morgan Apex'] },
        { name: 'Blue Storm', points: 162, color: '#00B2E3', logo: '', car: '', drivers: ['Jordan Swift'] },
        { name: 'Neon Flux', points: 151, color: '#33D17A', logo: '', car: '', drivers: ['Casey Drift'] },
        { name: 'Black Cipher', points: 125, color: '#9C27B0', logo: '', car: '', drivers: ['Taylor Nova'] }
    );
    races.push(
        { name: 'Season Opener', track: 'Neo Tokyo 500', date: '2026-02-15', format: 'Sprint', laps: 50, status: 'completed', results: [
            { driver: 'Alex Racer', pos: 1, pts: 25, time: '1:23:06.801' }, { driver: 'Jordan Swift', pos: 2, pts: 18, time: '+5.812' }, { driver: 'Casey Drift', pos: 3, pts: 15, time: '+12.004' } ] },
        { name: 'Paradise Desert', track: 'Oasis Circuit', date: '2026-02-22', format: 'Classic', laps: 75, status: 'completed', results: [
            { driver: 'Casey Drift', pos: 1, pts: 25, time: '1:33:15.607' }, { driver: 'Alex Racer', pos: 2, pts: 18, time: '+3.221' }, { driver: 'Morgan Apex', pos: 3, pts: 15, time: '+18.995' } ] },
        { name: 'Urban Chase', track: 'Downtown Circuit', date: '2026-03-01', format: 'Sprint', laps: 40, status: 'upcoming', results: [] },
        { name: 'Final Lap', track: 'Orbital Track', date: '2026-03-08', format: 'Championship', laps: 100, status: 'upcoming', results: [] }
    );
    news.push(
        { title: 'Alex Racer takes championship lead', body: 'A dominant win at Neo Tokyo puts Red Velocity on top of the standings after a commanding drive from lights to flag.', date: '2026-02-15', image: '' },
        { title: 'Blue Storm sign new pilot', body: 'Sam Turbo joins the grid ahead of the desert round.', date: '2026-02-18', image: '' },
        { title: 'Season finale confirmed', body: 'The title will be decided at Orbital Track in a 100-lap classic.', date: '2026-02-20', image: '' },
        { title: 'Neon Flux surge continues', body: 'Casey Drift claims a stunning win at Oasis Circuit.', date: '2026-02-22', image: '' },
        { title: 'Grid expands for 2026', body: 'Two new teams are set to join the championship.', date: '2026-02-24', image: '' }
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
                { name: 'Red Velocity', points: 569, color: '#E10600', drivers: ['Morgan Apex', 'Alex Racer'] },
                { name: 'Black Cipher', points: 240, color: '#9C27B0', drivers: ['Taylor Nova'] }
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
    const opts = `<option value="live">${seasonName} (Live)</option>` +
        Object.keys(archive).sort().reverse().map(k => `<option value="${k}">${k}</option>`).join('');
    ['seasonSelect', 'homeSeasonSelect', 'calSeasonSelect'].forEach(id => { const s = document.getElementById(id); if (s) s.innerHTML = opts; });
}
function seasonData(sel) {
    if (sel === 'live') return { drivers, teams, races };
    const a = archive[sel] || {};
    return { drivers: a.drivers || [], teams: a.teams || [], races: a.races || [] };
}
function colourFor(name, teamsArr) {
    const t = (teamsArr || []).find(x => x.name === name);
    if (t && t.color) return t.color;
    return autoColor(name || '');
}
function autoColor(name) { let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360; return 'hsl(' + h + ',65%,45%)'; }
function dot(c) { return '<span class="team-dot" style="background:' + c + '"></span>'; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''; }

// ==================== HOME ====================
function renderHome() {
    renderRaceStrip();
    startCountdown();
    renderHomeNews();
    renderHomeSeason();
}

function renderRaceStrip() {
    const strip = document.getElementById('raceStrip');
    if (!strip) return;
    if (!races.length) { strip.style.display = 'none'; return; }
    const sorted = [...races].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    const next = sorted.find(r => r.status === 'upcoming') || sorted[sorted.length - 1];
    const idx = sorted.indexOf(next) + 1;
    const d = next.date ? new Date(next.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC';
    strip.style.display = 'flex';
    strip.innerHTML = `<span class="rs-round">ROUND ${String(idx).padStart(2, '0')}</span>
        <span class="rs-name">${next.name}</span>
        <span class="rs-track">${next.track || ''}</span>
        <span class="rs-date">${d}</span>
        <span class="rs-status ${next.status === 'upcoming' ? 'up' : ''}">${(next.status || '').toUpperCase()}</span>`;
}

let countdownInterval = null;
function startCountdown() {
    const bar = document.getElementById('countdownBar');
    if (!bar) return;
    const next = [...races].sort((a,b) => new Date(a.date||0)-new Date(b.date||0)).find(r => r.status === 'upcoming');
    if (!next || !next.date) { bar.style.display = 'none'; return; }
    const target = new Date(next.date).getTime();
    if (countdownInterval) clearInterval(countdownInterval);
    function tick() {
        const diff = target - Date.now();
        if (diff <= 0) { bar.style.display = 'none'; clearInterval(countdownInterval); return; }
        bar.style.display = 'flex';
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        document.getElementById('cdDays').textContent  = String(d).padStart(2,'0');
        document.getElementById('cdHours').textContent = String(h).padStart(2,'0');
        document.getElementById('cdMins').textContent  = String(m).padStart(2,'0');
        document.getElementById('cdSecs').textContent  = String(s).padStart(2,'0');
    }
    tick();
    countdownInterval = setInterval(tick, 1000);
}
function newsHeroHTML(n) {
    const bg = n.image ? `<div class="nh-bg" style="background-image:url('${n.image}')"></div>` : `<div class="nh-bg nh-placeholder"></div>`;
    return `${bg}<div class="nh-overlay"></div><div class="nh-content"><span class="nh-tag">LATEST</span><h2>${n.title || ''}</h2><p>${(n.body || '').slice(0, 130)}${(n.body || '').length > 130 ? '…' : ''}</p></div>`;
}
function renderHomeNews() {
    const hero = document.getElementById('newsHero');
    const side = document.getElementById('newsSide');
    if (!hero || !side) return;
    if (!news.length) { hero.innerHTML = '<div class="nh-bg nh-placeholder"></div><div class="nh-content"><h2>No news yet</h2></div>'; side.innerHTML = ''; return; }
    const sorted = [...news].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    const h = sorted[0];
    hero.innerHTML = newsHeroHTML(h);
    hero.onclick = () => openNewsModal(h);
    const rest = sorted.slice(1, 5);
    side.innerHTML = rest.map((n, i) => `<div class="news-mini" data-i="${i}">
        ${n.image ? `<div class="news-mini-img" style="background-image:url('${n.image}')"></div>` : `<div class="news-mini-img placeholder"></div>`}
        <div class="news-mini-body"><div class="news-date">${fmtDate(n.date)}</div><h4>${n.title || ''}</h4></div>
    </div>`).join('');
    side.querySelectorAll('.news-mini').forEach(el => el.addEventListener('click', () => openNewsModal(rest[parseInt(el.dataset.i)])));
}
function openNewsModal(n) {
    if (!n) return;
    const img = n.image ? `<div class="modal-news-img" style="background-image:url('${n.image}')"></div>` : '';
    openModal(`${img}<div class="news-date" style="margin-top:1rem;">${fmtDate(n.date)}</div><h2 style="color:var(--f1-white);font-style:italic;margin:0.3rem 0 1rem;">${n.title || ''}</h2><p style="color:var(--f1-text);line-height:1.6;">${(n.body || '').replace(/\n/g, '<br>')}</p>`);
}

// ==================== HOME SEASON (PODIUM + TABLE) ====================
function driverPodiumCard(d, i, teamsArr) {
    const c = colourFor(d.team, teamsArr);
    const suffix = ['ST', 'ND', 'RD'][i] || 'TH';
    return `<div class="podium-card" style="--tc:${c}">
        <div class="pc-info">
            <div class="pc-pos">${i + 1}<span>${suffix}</span></div>
            <div class="pc-name">${d.name}</div>
            <div class="pc-team">${d.team || ''}</div>
            <div class="pc-pts">${d.points || 0}<span>PTS</span></div>
        </div>
        <div class="pc-photo">${driverAvatar(d, 'pc-img')}</div>
    </div>`;
}
function teamPodiumCard(t, i, teamsArr) {
    const c = t.color || colourFor(t.name, teamsArr);
    const suffix = ['ST', 'ND', 'RD'][i] || 'TH';
    return `<div class="podium-card" style="--tc:${c}">
        <div class="pc-info">
            <div class="pc-pos">${i + 1}<span>${suffix}</span></div>
            <div class="pc-name">${t.name}</div>
            <div class="pc-team">${(t.drivers || []).join(', ')}</div>
            <div class="pc-pts">${t.points || 0}<span>PTS</span></div>
        </div>
    </div>`;
}
function renderHomeSeason() {
    const data = seasonData(homeSeason);
    document.getElementById('seasonHeading').textContent = (homeSeason === 'live' ? seasonName : homeSeason) + ' SEASON';
    const podium = document.getElementById('podium');
    const tbody = document.getElementById('homeStandingsBody');
    if (homeTab === 'teams') {
        const sorted = [...data.teams].sort((a, b) => (b.points || 0) - (a.points || 0));
        podium.innerHTML = sorted.slice(0, 3).map((t, i) => teamPodiumCard(t, i, data.teams)).join('') || '<p style="color:var(--f1-muted);">No teams yet.</p>';
        tbody.innerHTML = sorted.slice(0, 6).map((t, i) => `<tr><td class="pos">${i + 1}</td><td class="driver">${dot(colourFor(t.name, data.teams))}${t.name}</td><td class="team">${(t.drivers || []).length} drivers</td><td class="points">${t.points || 0}</td></tr>`).join('');
    } else {
        const sorted = [...data.drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
        podium.innerHTML = sorted.slice(0, 3).map((d, i) => driverPodiumCard(d, i, data.teams)).join('') || '<p style="color:var(--f1-muted);">No drivers yet.</p>';
        tbody.innerHTML = sorted.slice(0, 6).map((d, i) => {
            return `<tr data-i="${i}" style="cursor:pointer;"><td class="pos">${i + 1}</td><td class="driver">${d.name}</td><td class="team">${dot(colourFor(d.team, data.teams))}${d.team}</td><td class="points">${d.points || 0}</td></tr>`;
        }).join('');
        const arr = sorted;
        tbody.querySelectorAll('tr').forEach(tr => tr.addEventListener('click', () => openDriverModal(arr[parseInt(tr.dataset.i)])));
    }
}

// ==================== STANDINGS PAGE ====================
function renderStandingsView() {
    const data = seasonData(selectedSeason);
    const seasonLabel = selectedSeason === 'live' ? seasonName : selectedSeason;
    const panel = document.getElementById('standingsPanel');
    const title = document.getElementById('standingsTitle');

    if (standingsTab === 'teams') {
        title.textContent = seasonLabel + " TEAMS' STANDINGS";
        const sorted = [...data.teams].sort((a, b) => (b.points || 0) - (a.points || 0));
        if (!sorted.length) { panel.innerHTML = '<p style="padding:1.5rem;color:var(--f1-muted);">No teams yet.</p>'; }
        else {
            panel.innerHTML = `<table class="results-table std-table"><thead><tr><th>POS</th><th>TEAM</th><th>DRIVERS</th><th>PTS</th></tr></thead><tbody>` +
                sorted.map((t, i) => `<tr><td class="rt-pos">${i + 1}</td><td class="rt-team">${dot(t.color || colourFor(t.name, data.teams))}${t.name}</td><td class="std-nat">${(t.drivers || []).join(', ') || '-'}</td><td class="rt-time">${t.points || 0}</td></tr>`).join('') +
                `</tbody></table>`;
        }
    } else {
        title.textContent = seasonLabel + " DRIVERS' STANDINGS";
        const sorted = [...data.drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
        const leader = sorted[0] ? (sorted[0].points || 0) : 0;
        if (!sorted.length) { panel.innerHTML = '<p style="padding:1.5rem;color:var(--f1-muted);">No drivers yet.</p>'; }
        else {
            // Build form guide per driver from races
            const formMap = {};
            if (data.races) {
                [...data.races].sort((a,b)=>new Date(a.date||0)-new Date(b.date||0)).forEach(r => {
                    (r.results||[]).forEach(res => {
                        if (!formMap[res.driver]) formMap[res.driver] = [];
                        formMap[res.driver].push(res.dnf ? 'D' : res.pos === 1 ? 'W' : res.pos <= 3 ? 'P' : 'F');
                    });
                });
            }
            panel.innerHTML = `<table class="results-table std-table"><thead><tr>
                <th>POS</th><th>DRIVER</th><th>NAT</th><th>TEAM</th><th>FORM</th><th>GAP</th><th>PTS</th>
            </tr></thead><tbody>` +
                sorted.map((d, i) => {
                    const gap = i === 0 ? '<span class="pts-leader">LEADER</span>' : `<span class="pts-gap">-${leader - (d.points||0)}</span>`;
                    const form = (formMap[d.name] || []).slice(-5).map(f=>`<div class="fg-dot ${f}">${f==='D'?'—':f}</div>`).join('');
                    return `<tr data-i="${i}" style="cursor:pointer;">
                        <td class="rt-pos">${i + 1}</td>
                        <td class="std-driver">${driverAvatar(d,'std-avatar')}<span>${d.name}</span></td>
                        <td class="std-nat">${d.nationality || '—'}</td>
                        <td class="rt-team">${dot(colourFor(d.team, data.teams))}${d.team}</td>
                        <td><div class="form-guide">${form || '—'}</div></td>
                        <td>${gap}</td>
                        <td class="rt-time">${d.points || 0}</td>
                    </tr>`;
                }).join('') + `</tbody></table>`;
            panel.querySelectorAll('tbody tr').forEach(tr => tr.addEventListener('click', () => openDriverProfile(sorted[parseInt(tr.dataset.i)])));
        }
    }

    // Archived-season race results below the table
    const sr = document.getElementById('seasonRaces');
    if (selectedSeason === 'live') { sr.innerHTML = ''; return; }
    const rlist = data.races || [];
    if (!rlist.length) { sr.innerHTML = ''; return; }
    const rsorted = [...rlist].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    sr.innerHTML = `<h2 style="margin:2.5rem 0 1.2rem;">${selectedSeason} RACE RESULTS</h2>` + rsorted.map((r, i) => raceRowHTML(r, i)).join('');
    bindRaceRows(sr, rsorted);
}
function raceRowHTML(race, index) {
    const formattedDate = race.date ? new Date(race.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : 'TBC';
    const hasResults = race.results && race.results.length;
    return `<div class="calendar-event" data-idx="${index}" style="cursor:pointer;">
        <div class="event-date"><div style="font-size:0.8rem;color:var(--f1-muted);">Race</div>${String(index + 1).padStart(2, '0')}</div>
        <div class="event-info"><h3>${race.name}</h3><p class="event-track">${race.track || ''}</p><p style="font-size:0.85rem;color:var(--f1-muted);">${formattedDate}</p></div>
        <div class="event-status"><div style="margin-bottom:0.25rem;">${race.format || ''}</div><div style="font-size:0.75rem;color:var(--f1-muted);">${race.laps || 0} LAPS</div>
        <div style="margin-top:0.4rem;color:${hasResults ? 'var(--f1-red)' : 'var(--f1-muted)'};font-weight:700;">${hasResults ? 'VIEW RESULTS' : (race.status || '').toUpperCase()}</div></div>
    </div>`;
}
function bindRaceRows(container, list) {
    container.querySelectorAll('.calendar-event').forEach(el => el.addEventListener('click', () => openRaceModal(list[parseInt(el.dataset.idx)])));
}

// ==================== CALENDAR (F1 SCHEDULE STYLE) ====================
let calSeason = 'live';
const CIRCUIT_SVG = '<svg viewBox="0 0 100 60" class="cal-circuit" xmlns="http://www.w3.org/2000/svg"><path d="M15 45 C10 30 25 20 40 25 C55 30 60 12 78 15 C92 17 90 40 75 42 C60 44 55 35 40 40 C28 44 22 52 15 45 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';

function miniPodium(results, teamsArr, driversArr) {
    const top = [...(results || [])].sort((a, b) => (a.pos || 99) - (b.pos || 99)).slice(0, 3);
    if (!top.length) return '';
    return '<div class="cal-podium">' + top.map(r => {
        const drv = (driversArr || []).find(d => d.name === r.driver);
        const c = drv ? colourFor(drv.team, teamsArr) : 'var(--f1-red)';
        const code = (r.driver || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3) || '?';
        return `<div class="cp-row"><span class="cp-pos">${r.pos}</span>${dot(c)}<span class="cp-name">${r.driver}</span><span class="cp-pts">${r.pts || 0}</span></div>`;
    }).join('') + '</div>';
}

function featuredCard(label, r, roundNo, highlight) {
    if (!r) return '';
    const d = r.date ? new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBC';
    const bg = r.image ? `style="background-image:url('${r.image}')"` : '';
    return `<div class="feat-card ${highlight ? 'next' : ''} ${r.image ? '' : 'noimg'}" data-round="${roundNo}" ${bg}>
        <div class="feat-overlay"></div>
        <div class="feat-body">
            <span class="feat-label">${label}</span>
            <div class="feat-round">ROUND ${String(roundNo).padStart(2, '0')}</div>
            <div class="feat-name">${r.name}</div>
            <div class="feat-date">${d}</div>
        </div>
    </div>`;
}

function calCard(r, roundNo, isNext, teamsArr, driversArr) {
    const dr = r.date ? new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase() : 'TBC';
    const hasResults = r.results && r.results.length;
    let bottom;
    if (hasResults) {
        bottom = miniPodium(r.results, teamsArr, driversArr);
    } else {
        bottom = `<div class="cal-card-foot"><span class="cal-fmt">${r.format || ''} &middot; ${r.laps || 0} laps</span><span class="cal-circuit-wrap">${CIRCUIT_SVG}</span></div>`;
    }
    const imgBg = r.image ? `<div class="cal-card-bg" style="background-image:url('${r.image}')"></div>` : '';
    return `<div class="cal-card ${isNext ? 'next' : ''}" data-round="${roundNo}">
        ${imgBg}
        <div class="cal-card-head">
            <span class="cal-round">ROUND ${String(roundNo).padStart(2, '0')}</span>
            ${isNext ? '<span class="cal-next-badge">NEXT RACE</span>' : `<span class="cal-date">${dr}</span>`}
        </div>
        <h3 class="cal-name">${r.name}</h3>
        <p class="cal-track">${r.track || ''}</p>
        ${isNext ? `<p class="cal-date-lg">${dr}</p>` : ''}
        ${bottom}
    </div>`;
}

function renderCalendar() {
    const data = seasonData(calSeason);
    const seasonLabel = calSeason === 'live' ? seasonName : calSeason;
    document.getElementById('calTitle').textContent = seasonLabel + ' FORMULA FORTNITE RACE CALENDAR';

    const sorted = [...(data.races || [])].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    const grid = document.getElementById('calGrid');
    const feat = document.getElementById('calFeatured');

    if (!sorted.length) { grid.innerHTML = '<p>No races scheduled yet.</p>'; feat.innerHTML = ''; return; }

    // work out round numbers by chronological order
    const withRound = sorted.map((r, i) => ({ r, round: i + 1 }));
    const nextIdx = withRound.findIndex(x => x.r.status === 'upcoming');
    const completed = withRound.filter(x => x.r.status !== 'upcoming');
    const upcoming = withRound.filter(x => x.r.status === 'upcoming');

    // Featured: Previous (last completed), Next (first upcoming), Upcoming (next ones)
    const prev = completed.length ? completed[completed.length - 1] : null;
    const next = upcoming.length ? upcoming[0] : null;
    const up1 = upcoming.length > 1 ? upcoming[1] : null;
    const up2 = upcoming.length > 2 ? upcoming[2] : null;

    let featHTML = '';
    if (prev) featHTML += featuredCard('PREVIOUS', prev.r, prev.round, false);
    if (next) featHTML += featuredCard('NEXT', next.r, next.round, true);
    if (up1) featHTML += featuredCard('UPCOMING', up1.r, up1.round, false);
    if (up2) featHTML += featuredCard('UPCOMING', up2.r, up2.round, false);
    feat.innerHTML = featHTML;

    // Grid of all rounds
    grid.innerHTML = withRound.map(x => calCard(x.r, x.round, next && x.round === next.round, data.teams, data.drivers)).join('');

    // click handlers
    const byRound = {};
    withRound.forEach(x => { byRound[x.round] = x.r; });
    feat.querySelectorAll('.feat-card').forEach(el => el.addEventListener('click', () => openRaceModal(byRound[parseInt(el.dataset.round)])));
    grid.querySelectorAll('.cal-card').forEach(el => el.addEventListener('click', () => openRaceModal(byRound[parseInt(el.dataset.round)])));
}
function openRaceModal(race) {
    if (!race) return;
    const date = race.date ? new Date(race.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBC';
    const hasResults = race.results && race.results.length;
    const hasQual = race.qualifying && race.qualifying.length;

    let body = `<div class="modal-race-head">
        <div class="modal-race-num">${race.name}</div>
        <p class="event-track">${race.track || ''}</p>
        <p style="color:var(--f1-muted);">${date} &middot; ${race.format || ''} &middot; ${race.laps || 0} laps</p>
    </div>`;

    // Tabs if qualifying exists
    if (hasQual) {
        body += `<div class="modal-tabs" style="display:flex;gap:8px;margin:1rem 0;">
            <button class="tab-btn active" id="mTab-race" onclick="switchModalTab('race','${race.id||'r'}')">RACE</button>
            <button class="tab-btn" id="mTab-qual" onclick="switchModalTab('qual','${race.id||'r'}')">QUALIFYING</button>
        </div>`;
    }

    // Race results
    if (hasResults) {
        const sorted = [...race.results].sort((a, b) => {
            if (a.dnf && !b.dnf) return 1;
            if (!a.dnf && b.dnf) return -1;
            return (a.pos || 99) - (b.pos || 99);
        });
        const rows = sorted.map(r => `<tr>
            <td class="pos">${r.dnf ? '<span style="color:var(--f1-muted);">DNF</span>' : r.pos}</td>
            <td class="driver">${r.driver}${r.dnf ? ' <span style="color:var(--f1-muted);font-size:0.75rem;">(DNF)</span>' : ''}</td>
            <td class="points">${r.dnf ? '—' : r.pts || 0}</td>
        </tr>`).join('');
        body += `<div id="mPanel-race-${race.id||'r'}">
            <table class="standings-table" style="margin-top:0.5rem;">
                <thead><tr><th class="pos">POS</th><th class="driver">DRIVER</th><th class="points">PTS</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
            ${race.fastestLap ? `<p style="margin-top:1rem;font-size:0.85rem;color:var(--f1-muted);">⚡ Fastest Lap: <strong style="color:var(--f1-white);">${race.fastestLap}</strong></p>` : ''}
        </div>`;
    } else {
        body += `<div id="mPanel-race-${race.id||'r'}"><p style="margin-top:1rem;color:var(--f1-muted);">No results yet — check back after the race.</p></div>`;
    }

    // Qualifying results
    if (hasQual) {
        const qrows = [...race.qualifying].sort((a, b) => (a.pos || 99) - (b.pos || 99)).map(q => `<tr>
            <td class="pos">${q.pos}</td>
            <td class="driver">${q.driver}</td>
            <td class="points">${q.laptime || '—'}</td>
        </tr>`).join('');
        body += `<div id="mPanel-qual-${race.id||'r'}" style="display:none;">
            <table class="standings-table" style="margin-top:0.5rem;">
                <thead><tr><th class="pos">POS</th><th class="driver">DRIVER</th><th class="points">TIME</th></tr></thead>
                <tbody>${qrows}</tbody>
            </table>
        </div>`;
    }

    openModal(body);
}

function switchModalTab(tab, raceId) {
    ['race', 'qual'].forEach(t => {
        const panel = document.getElementById('mPanel-' + t + '-' + raceId);
        const btn = document.getElementById('mTab-' + t);
        if (panel) panel.style.display = t === tab ? 'block' : 'none';
        if (btn) btn.classList.toggle('active', t === tab);
    });
}

// ==================== RESULTS PAGE ====================
function teamOfDriver(name, driversArr) {
    const d = (driversArr || []).find(x => x.name === name);
    return d ? d.team : '';
}
function renderResults() {
    const data = seasonData(resultsSeason);
    const seasonLabel = resultsSeason === 'live' ? seasonName : resultsSeason;
    const panel = document.getElementById('resultsPanel');
    const completed = [...(data.races || [])].filter(r => r.results && r.results.length).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

    if (resultsTab === 'races') {
        document.getElementById('resultsTitle').textContent = seasonLabel + ' RACE RESULTS';
        if (!completed.length) { panel.innerHTML = '<p style="padding:1.5rem;color:var(--f1-muted);">No race results yet.</p>'; return; }
        const rows = completed.map((r, i) => {
            const sorted = [...r.results].sort((a, b) => {
                if (a.dnf && !b.dnf) return 1;
                if (!a.dnf && b.dnf) return -1;
                return (a.pos || 99) - (b.pos || 99);
            });
            const win = sorted.find(x => !x.dnf) || sorted[0] || {};
            const team = teamOfDriver(win.driver, data.drivers);
            const c = colourFor(team, data.teams);
            const date = r.date ? new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
            const dnfCount = r.results.filter(x => x.dnf).length;
            return `<tr data-i="${i}" style="cursor:pointer;">
                <td class="rt-gp">${r.name}${dnfCount ? ` <span style="color:var(--f1-muted);font-size:0.78rem;">(${dnfCount} DNF)</span>` : ''}</td>
                <td class="rt-date">${date}</td>
                <td class="rt-winner">${win.driver || '-'}</td>
                <td class="rt-team">${dot(c)}${team || '-'}</td>
                <td class="rt-laps">${r.laps || 0}</td>
                <td class="rt-time">${win.time || '—'}</td>
            </tr>`;
        }).join('');
        panel.innerHTML = `<table class="results-table">
            <thead><tr><th>GRAND PRIX</th><th>DATE</th><th>WINNER</th><th>TEAM</th><th>LAPS</th><th>TIME</th></tr></thead>
            <tbody>${rows}</tbody></table>`;
        panel.querySelectorAll('tbody tr').forEach(tr => tr.addEventListener('click', () => openRaceModal(completed[parseInt(tr.dataset.i)])));

    } else if (resultsTab === 'drivers') {
        document.getElementById('resultsTitle').textContent = seasonLabel + ' DRIVER RESULTS';
        const tally = {};
        completed.forEach(r => r.results.forEach(res => {
            const k = res.driver;
            if (!tally[k]) tally[k] = { name: k, team: teamOfDriver(k, data.drivers), wins: 0, podiums: 0, pts: 0 };
            if (res.pos === 1) tally[k].wins++;
            if (res.pos <= 3) tally[k].podiums++;
            tally[k].pts += (res.pts || 0);
        }));
        const list = Object.values(tally).sort((a, b) => b.pts - a.pts);
        if (!list.length) { panel.innerHTML = '<p style="padding:1.5rem;color:var(--f1-muted);">No driver results yet.</p>'; return; }
        panel.innerHTML = `<table class="results-table">
            <thead><tr><th>POS</th><th>DRIVER</th><th>TEAM</th><th>WINS</th><th>PODIUMS</th><th>PTS</th></tr></thead>
            <tbody>${list.map((d, i) => `<tr>
                <td class="rt-pos">${i + 1}</td>
                <td class="rt-winner">${d.name}</td>
                <td class="rt-team">${dot(colourFor(d.team, data.teams))}${d.team || '-'}</td>
                <td>${d.wins}</td><td>${d.podiums}</td><td class="rt-time">${d.pts}</td>
            </tr>`).join('')}</tbody></table>`;

    } else {
        document.getElementById('resultsTitle').textContent = seasonLabel + ' TEAM RESULTS';
        const tally = {};
        completed.forEach(r => r.results.forEach(res => {
            const team = teamOfDriver(res.driver, data.drivers) || 'Unknown';
            if (!tally[team]) tally[team] = { name: team, wins: 0, pts: 0 };
            if (res.pos === 1) tally[team].wins++;
            tally[team].pts += (res.pts || 0);
        }));
        const list = Object.values(tally).sort((a, b) => b.pts - a.pts);
        if (!list.length) { panel.innerHTML = '<p style="padding:1.5rem;color:var(--f1-muted);">No team results yet.</p>'; return; }
        panel.innerHTML = `<table class="results-table">
            <thead><tr><th>POS</th><th>TEAM</th><th>WINS</th><th>PTS</th></tr></thead>
            <tbody>${list.map((t, i) => `<tr>
                <td class="rt-pos">${i + 1}</td>
                <td class="rt-team">${dot(colourFor(t.name, data.teams))}${t.name}</td>
                <td>${t.wins}</td><td class="rt-time">${t.pts}</td>
            </tr>`).join('')}</tbody></table>`;
    }
}

// ==================== TEAMS ====================
function miniDriver(name) {
    const d = drivers.find(x => x.name === name);
    const parts = (name || '').split(' ');
    const first = parts.shift() || '';
    const last = parts.join(' ');
    const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const av = (d && d.photo)
        ? `<img class="tdrv-av" src="${d.photo}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><span class="tdrv-av-fb" style="display:none;">${initials}</span>`
        : `<span class="tdrv-av-fb">${initials}</span>`;
    return `<span class="tdrv">${av}<span class="tdrv-name">${first} <b>${last.toUpperCase()}</b></span></span>`;
}
function renderTeams() {
    const grid = document.getElementById('teamsGrid');
    const title = document.getElementById('teamsTitle');
    if (title) title.textContent = 'FF TEAMS ' + seasonName;
    grid.innerHTML = '';
    if (teams.length === 0) { grid.innerHTML = '<p>No teams available yet.</p>'; return; }
    [...teams].sort((a, b) => (b.points || 0) - (a.points || 0)).forEach(team => {
        const c = team.color || colourFor(team.name, teams);
        const logo = team.logo ? `<img class="ftc-logo-img" src="${team.logo}" alt="" onerror="this.style.display='none';">` : '';
        const car = team.car ? `<img class="ftc-car" src="${team.car}" alt="" onerror="this.style.display='none';">` : '';
        const drv = (team.drivers || []).map(n => miniDriver(n)).join('');
        const card = document.createElement('div');
        card.className = 'f1-team-card';
        card.style.setProperty('--tc', c);
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="ftc-top">
                <h3 class="ftc-name">${team.name}</h3>
                <div class="ftc-logo">${logo}</div>
            </div>
            <div class="ftc-drivers">${drv}</div>
            ${car}`;
        card.addEventListener('click', () => openTeamModal(team));
        grid.appendChild(card);
    });
}
function openTeamModal(team) {
    if (!team) return;
    const c = team.color || colourFor(team.name, teams);
    const pos = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0)).findIndex(t => t.name === team.name);
    const posText = pos >= 0 ? '#' + (pos + 1) : '-';
    const drv = (team.drivers || []).map(n => `<div style="padding:0.6rem 0;border-bottom:1px solid var(--f1-line);">${n}</div>`).join('') || '<p style="color:var(--f1-muted);">No drivers listed.</p>';
    openModal(`
        <div style="height:8px;background:${c};border-radius:4px;margin-bottom:1rem;"></div>
        <h2 style="color:var(--f1-white);font-style:italic;margin-bottom:0.3rem;">${team.name}</h2>
        <div class="profile-grid" style="margin:1rem 0;">
            <div class="profile-stat"><span>Championship Pos</span><strong style="color:${c};">${posText}</strong></div>
            <div class="profile-stat"><span>Points</span><strong>${team.points || 0}</strong></div>
        </div>
        <h3 style="color:var(--f1-white);font-size:1.1rem;margin:1rem 0 0.3rem;">Drivers</h3>
        ${drv}`);
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
    const title = document.getElementById('driversTitle');
    if (title) title.textContent = 'FF DRIVERS ' + seasonName;
    grid.innerHTML = '';
    if (drivers.length === 0) { grid.innerHTML = '<p>No drivers available yet.</p>'; return; }
    [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0)).forEach(driver => {
        const c = colourFor(driver.team, teams);
        const parts = (driver.name || '').split(' ');
        const first = parts.shift() || '';
        const last = parts.join(' ');
        const photo = driver.photo ? `<img class="fdc-photo" src="${driver.photo}" alt="" onerror="this.style.display='none';">` : '';
        const card = document.createElement('div');
        card.className = 'f1-driver-card';
        card.style.setProperty('--tc', c);
        card.style.cursor = 'pointer';
        card.innerHTML = `
            <div class="fdc-info">
                <div class="fdc-name"><span class="fdc-first">${first}</span><span class="fdc-last">${last}</span></div>
                <div class="fdc-team">${driver.team || ''}</div>
                <div class="fdc-num">${driver.number || ''}</div>
                <div class="fdc-nat">${driver.nationality || ''}</div>
            </div>
            ${photo}`;
        card.addEventListener('click', () => openDriverProfile(driver));
        grid.appendChild(card);
    });
}

function openDriverProfile(driver) {
    if (!driver) return;
    const c = colourFor(driver.team, teams);
    const pos = [...drivers].sort((a,b)=>(b.points||0)-(a.points||0)).findIndex(d=>d.name===driver.name);
    const posText = pos >= 0 ? '#' + (pos+1) : '—';
    const initials = (driver.name||'?').split(' ').map(w=>w[0]).join('').toUpperCase();
    const avatar = driver.photo
        ? `<img class="dpp-photo" src="${driver.photo}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"><div class="dpp-fallback" style="display:none;">${initials}</div>`
        : `<div class="dpp-fallback">${initials}</div>`;

    // Race by race results
    const driverRaces = races.filter(r => r.results && r.results.some(x => x.driver === driver.name))
        .sort((a,b) => new Date(a.date||0)-new Date(b.date||0));
    let raceRows = '';
    let formArr = [];
    driverRaces.forEach(r => {
        const res = r.results.find(x => x.driver === driver.name);
        if (!res) return;
        const isDnf = res.dnf;
        const posDisplay = isDnf ? 'DNF' : (res.pos || '—');
        const fgClass = isDnf ? 'D' : res.pos === 1 ? 'W' : res.pos <= 3 ? 'P' : 'F';
        formArr.push(fgClass);
        raceRows += `<tr>
            <td>${r.date ? new Date(r.date).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '—'}</td>
            <td class="rt-gp">${r.name}</td>
            <td class="pos">${posDisplay}</td>
            <td class="points">${isDnf ? '—' : res.pts || 0}</td>
        </tr>`;
    });

    const formHTML = formArr.slice(-5).map(f => `<div class="fg-dot ${f}">${f==='D'?'DNF':f}</div>`).join('');

    openModal(`
        <div class="driver-profile-page">
            <div class="dpp-photo-col">
                ${avatar}
                ${driver.number ? `<div class="dpp-number">${driver.number}</div>` : ''}
                ${driver.nationality ? `<div class="dpp-nat">${driver.nationality}</div>` : ''}
            </div>
            <div class="dpp-info">
                <h1>${driver.name}</h1>
                <div class="dpp-team" style="color:${c};">${driver.team || ''}</div>
                <div class="dpp-stats">
                    <div class="dpp-stat"><label>Championship Pos</label><strong style="color:var(--f1-red);">${posText}</strong></div>
                    <div class="dpp-stat"><label>Points</label><strong>${driver.points || 0}</strong></div>
                    <div class="dpp-stat"><label>Wins</label><strong>${driver.wins || 0}</strong></div>
                    <div class="dpp-stat"><label>Poles</label><strong>${driver.poles || 0}</strong></div>
                    <div class="dpp-stat"><label>Races</label><strong>${driver.races || 0}</strong></div>
                    ${formArr.length ? `<div class="dpp-stat"><label>Form (last 5)</label><div class="form-guide" style="margin-top:0.4rem;">${formHTML}</div></div>` : ''}
                </div>
                ${raceRows ? `<div class="dpp-races">
                    <h2>Race Results</h2>
                    <table class="results-table">
                        <thead><tr><th>Date</th><th>Race</th><th>Pos</th><th>Pts</th></tr></thead>
                        <tbody>${raceRows}</tbody>
                    </table>
                </div>` : ''}
            </div>
        </div>`);
}

// ==================== FANTASY ====================
const FANTASY_DRIVERS = 3; // drivers to pick
const FANTASY_BIN = "https://api.jsonbin.io/v3/b/" + BIN_ID;
const FANTASY_KEY = ACCESS_KEY;

function fantasyUsername() { try { return localStorage.getItem('ff_fantasy_user') || null; } catch(e) { return null; } }
function fantasySetUser(u) { try { localStorage.setItem('ff_fantasy_user', u); } catch(e) {} }
function fantasyClearUser() { try { localStorage.removeItem('ff_fantasy_user'); } catch(e) {} }

function calcFantasyPts(team) {
    let total = 0;
    const completedRaces = races.filter(r => r.results && r.results.length);
    completedRaces.forEach(r => {
        (team.drivers || []).forEach(dName => {
            const res = r.results.find(x => x.driver === dName);
            if (res && !res.dnf) total += (res.pts || 0);
        });
        if (team.constructor) {
            const constTeam = teams.find(t => t.name === team.constructor);
            if (constTeam) {
                (constTeam.drivers || []).forEach(dName => {
                    const res = r.results.find(x => x.driver === dName);
                    if (res && !res.dnf) total += Math.round((res.pts || 0) * 0.5);
                });
            }
        }
    });
    return total;
}

async function fantasySave() {
    if (!JSON_CONFIGURED) { alert('JSONBin not configured'); return false; }
    try {
        // Read current bin, update fantasy array, write back
        const getRes = await fetch(FANTASY_BIN + '/latest', { headers: { 'X-Access-Key': FANTASY_KEY } });
        const json = await getRes.json();
        const record = json.record || {};
        record.fantasy = fantasyTeams;
        const putRes = await fetch(FANTASY_BIN, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': '$2a$10$bHb8I.kdqaJKAUK/D6Ta2.z4U8kN.7gNKNFv2NDGDXQ5lDG21LS6a' },
            body: JSON.stringify(record)
        });
        return putRes.ok;
    } catch(e) { console.error('Fantasy save error:', e); return false; }
}

function renderFantasy() {
    const username = fantasyUsername();
    const joinEl = document.getElementById('fantasyJoin');
    const teamEl = document.getElementById('fantasyMyTeam');
    if (!joinEl || !teamEl) return;

    if (!username) {
        joinEl.classList.remove('hidden');
        teamEl.classList.add('hidden');
    } else {
        joinEl.classList.add('hidden');
        teamEl.classList.remove('hidden');
        document.getElementById('fantasyWelcome').textContent = username.toUpperCase() + "'S TEAM";
        renderFantasyPicker(username);
    }
    renderFantasyLeaderboard();
}

function fantasyJoin() {
    const input = document.getElementById('fjUsername');
    const u = (input.value || '').trim();
    if (!u) { input.focus(); return; }
    // Check if username taken
    if (fantasyTeams.find(t => t.username.toLowerCase() === u.toLowerCase() && !fantasyTeams.find(x => x.username === u))) {
        alert('That username is taken — try another.');
        return;
    }
    fantasySetUser(u);
    // Create team if new
    if (!fantasyTeams.find(t => t.username === u)) {
        fantasyTeams.push({ username: u, drivers: [], constructor: null });
    }
    renderFantasy();
}

function fantasyLogout() {
    fantasyClearUser();
    renderFantasy();
}

let pickedDrivers = [];
let pickedConstructor = null;

function renderFantasyPicker(username) {
    const myTeam = fantasyTeams.find(t => t.username === username) || { drivers: [], constructor: null };
    pickedDrivers = [...(myTeam.drivers || [])];
    pickedConstructor = myTeam.constructor || null;

    const pts = calcFantasyPts(myTeam);
    document.getElementById('fantasySubtitle').textContent = pts + ' PTS THIS SEASON';

    // Driver grid
    const dGrid = document.getElementById('driverPickGrid');
    const cGrid = document.getElementById('constructorPickGrid');
    if (!dGrid || !cGrid) return;

    dGrid.innerHTML = [...drivers].sort((a,b)=>(b.points||0)-(a.points||0)).map(d => {
        const c = colourFor(d.team, teams);
        const picked = pickedDrivers.includes(d.name);
        return `<div class="ftp-card ${picked ? 'picked' : ''}" style="--tc:${c}" onclick="fantasyToggleDriver('${d.name.replace(/'/g,"\\'")}')">
            <div class="ftpc-name">${d.name}</div>
            <div class="ftpc-team">${d.team}</div>
            <div class="ftpc-pts">${d.points || 0} pts</div>
            ${picked ? '<div class="ftpc-check">✓</div>' : ''}
        </div>`;
    }).join('');

    cGrid.innerHTML = [...teams].sort((a,b)=>(b.points||0)-(a.points||0)).map(t => {
        const c = t.color || colourFor(t.name, teams);
        const picked = pickedConstructor === t.name;
        return `<div class="ftp-card ${picked ? 'picked' : ''}" style="--tc:${c}" onclick="fantasyToggleConstructor('${t.name.replace(/'/g,"\\'")}')">
            <div class="ftpc-name">${t.name}</div>
            <div class="ftpc-pts">${t.points || 0} pts</div>
            ${picked ? '<div class="ftpc-check">✓</div>' : ''}
        </div>`;
    }).join('');

    updatePickCount();
    renderMyPicks(username);
}

function updatePickCount() {
    const el = document.getElementById('driverPickCount');
    if (el) el.textContent = `(${pickedDrivers.length}/${FANTASY_DRIVERS})`;
    const btn = document.getElementById('fantasySubmitBtn');
    if (btn) btn.disabled = pickedDrivers.length !== FANTASY_DRIVERS || !pickedConstructor;
}

function fantasyToggleDriver(name) {
    if (pickedDrivers.includes(name)) {
        pickedDrivers = pickedDrivers.filter(d => d !== name);
    } else {
        if (pickedDrivers.length >= FANTASY_DRIVERS) {
            // swap oldest pick
            pickedDrivers.shift();
        }
        pickedDrivers.push(name);
    }
    renderFantasyPicker(fantasyUsername());
}

function fantasyToggleConstructor(name) {
    pickedConstructor = pickedConstructor === name ? null : name;
    renderFantasyPicker(fantasyUsername());
}

async function fantasySubmit() {
    const username = fantasyUsername();
    if (!username) return;
    const idx = fantasyTeams.findIndex(t => t.username === username);
    if (idx >= 0) {
        fantasyTeams[idx].drivers = [...pickedDrivers];
        fantasyTeams[idx].constructor = pickedConstructor;
    } else {
        fantasyTeams.push({ username, drivers: [...pickedDrivers], constructor: pickedConstructor });
    }
    const btn = document.getElementById('fantasySubmitBtn');
    if (btn) { btn.textContent = 'SAVING...'; btn.disabled = true; }
    const ok = await fantasySave();
    if (btn) { btn.textContent = ok ? 'SAVED ✓' : 'ERROR — TRY AGAIN'; btn.disabled = false; }
    setTimeout(() => { if (btn) btn.textContent = 'SAVE TEAM'; }, 2000);
    renderFantasyLeaderboard();
}

function renderMyPicks(username) {
    const el = document.getElementById('fantasyMyPicks');
    if (!el) return;
    const myTeam = fantasyTeams.find(t => t.username === username);
    if (!myTeam || (!myTeam.drivers.length && !myTeam.constructor)) { el.innerHTML = ''; return; }
    const pts = calcFantasyPts(myTeam);
    el.innerHTML = `<div class="fmp-box">
        <h3>YOUR CURRENT PICKS</h3>
        <div class="fmp-grid">
            ${myTeam.drivers.map(d => {
                const drv = drivers.find(x => x.name === d);
                const c = drv ? colourFor(drv.team, teams) : '#888';
                return `<div class="fmp-item" style="border-left:3px solid ${c};">
                    <span>${d}</span><small>${drv ? drv.team : ''}</small>
                </div>`;
            }).join('')}
            ${myTeam.constructor ? `<div class="fmp-item" style="border-left:3px solid ${teams.find(t=>t.name===myTeam.constructor)?.color||'#888'};">
                <span>${myTeam.constructor}</span><small>Constructor</small>
            </div>` : ''}
        </div>
        <div class="fmp-pts">Total Points: <strong>${pts}</strong></div>
    </div>`;
}

function renderFantasyLeaderboard() {
    const el = document.getElementById('fantasyLeaderboard');
    if (!el || !fantasyTeams.length) return;
    const ranked = [...fantasyTeams]
        .map(t => ({ ...t, pts: calcFantasyPts(t) }))
        .sort((a,b) => b.pts - a.pts);
    const me = fantasyUsername();
    el.innerHTML = `<table class="results-table">
        <thead><tr><th>POS</th><th>MANAGER</th><th>DRIVERS</th><th>CONSTRUCTOR</th><th>PTS</th></tr></thead>
        <tbody>${ranked.map((t,i) => `<tr ${t.username===me?'style="background:rgba(225,6,0,0.08);"':''}>
            <td class="rt-pos">${i+1}</td>
            <td class="rt-winner">${t.username}${t.username===me?' 👤':''}</td>
            <td class="rt-team" style="font-size:0.82rem;">${(t.drivers||[]).join(', ')||'—'}</td>
            <td class="rt-team">${t.constructor||'—'}</td>
            <td class="rt-time">${t.pts}</td>
        </tr>`).join('')}</tbody>
    </table>`;
}

// ==================== SERVICE WORKER ====================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
}
