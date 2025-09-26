// calendar.js - Исправленная версия
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const pad2 = (n) => String(n).padStart(2, "0");
const iso = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

function fmtDateShortNoYear(dt) {
  const dd = String(dt.getDate()).padStart(2, "0");
  const mon = MONTHS_SHORT[dt.getMonth()];
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${dd} ${mon}, ${hh}:${mm}`;
}

function initCalendar(root) {
  console.log('Initializing calendar:', root);
  
  const grid = root.querySelector('[data-el="grid"]');
  const monthEl = root.querySelector('[data-el="month"]');
  const yearEl = root.querySelector('[data-el="year"]');
  const matchesWrap = root.querySelector('[data-el="matches"]');
  const matchesDate = root.querySelector('[data-el="matches-date"]');

  if (!grid || !monthEl || !yearEl || !matchesWrap || !matchesDate) {
    console.error('Calendar: Missing required elements');
    return;
  }

  let matchesByDate = {};
  try {
    const rawData = root.dataset.matches || "{}";
    console.log('Raw matches data:', rawData);
    matchesByDate = JSON.parse(rawData);
    console.log('Parsed matches data:', matchesByDate);
    console.log('Dates with matches:', Object.keys(matchesByDate));
  } catch (e) {
    console.error('Error parsing matches data:', e);
    matchesByDate = {};
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = new Date(today);

  // Navigation
  const prevBtn = root.querySelector("[data-prev-month]");
  const nextBtn = root.querySelector("[data-next-month]");
  const todayBtn = root.querySelector("[data-go-today]");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
      render();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
      render();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const now = new Date();
      view = new Date(now.getFullYear(), now.getMonth(), 1);
      selected = new Date(now);
      render();
    });
  }

  render();

  function render() {
    renderTitle();
    renderGrid();
    renderMatches();
  }

  function renderTitle() {
    monthEl.textContent = MONTHS[view.getMonth()];
    yearEl.textContent = view.getFullYear();
  }

  function renderGrid() {
    grid.innerHTML = "";

    // Days of week header
    const dow = document.createElement("div");
    dow.className = "calendar__dow";
    DOW.forEach((d) => {
      const s = document.createElement("span");
      s.textContent = d;
      dow.appendChild(s);
    });
    grid.appendChild(dow);

    const y = view.getFullYear();
    const m = view.getMonth();
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const startIndex = (first.getDay() + 6) % 7;

    // Previous month tail
    const prevMonthDays = new Date(y, m, 0).getDate();
    for (let i = 0; i < startIndex; i++) {
      const d = prevMonthDays - startIndex + 1 + i;
      grid.appendChild(dayCell(new Date(y, m - 1, d), true));
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      grid.appendChild(dayCell(new Date(y, m, d), false));
    }

    // Next month head
    const totalCells = startIndex + daysInMonth;
    const tail = (7 - (totalCells % 7)) % 7;
    for (let d = 1; d <= tail; d++) {
      grid.appendChild(dayCell(new Date(y, m + 1, d), true));
    }
  }

  function dayCell(dateObj, muted) {
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth();
    const d = dateObj.getDate();
    const key = iso(y, m, d);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar__cell" + (muted ? " calendar__cell--muted" : "");
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-selected", String(isSameDay(dateObj, selected)));
    cell.dataset.date = key;

    if (isSameDay(dateObj, today)) cell.classList.add("calendar__today");

    const num = document.createElement("div");
    num.className = "calendar__daynum";
    num.textContent = d;
    cell.appendChild(num);

    // Badge: number of matches
    const matchesForDate = matchesByDate[key] || [];
    const n = matchesForDate.length;
    
    console.log(`Date ${key}: ${n} matches`, matchesForDate);
    
    if (n > 0) {
      const badge = document.createElement("div");
      badge.className = "calendar__badge";
      badge.textContent = n;
      cell.appendChild(badge);
    }

    cell.addEventListener("click", () => {
      selected = new Date(y, m, d);
      if (muted) {
        view = new Date(y, m, 1);
        render();
      } else {
        grid
          .querySelectorAll('.calendar__cell[aria-selected="true"]')
          .forEach((el) => el.setAttribute("aria-selected", "false"));
        cell.setAttribute("aria-selected", "true");
        renderMatches();
      }
    });

    return cell;
  }

  function isSameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function createCardMatch(matchData) {
    console.log('Creating card for match:', matchData);
    
    const cardMatch = document.createElement('article');
    cardMatch.className = 'card-match';
    
    // ИСПРАВЛЕНО: Проверяем правильные поля score_home/score_away
    const hasScore = matchData.score_home !== null && 
                     matchData.score_away !== null && 
                     matchData.score_home !== undefined &&
                     matchData.score_away !== undefined &&
                     matchData.score_home !== '—' && 
                     matchData.score_away !== '—';
    
    const w1 = hasScore && Number(matchData.score_home) > Number(matchData.score_away);
    const w2 = hasScore && Number(matchData.score_away) > Number(matchData.score_home);
    
    // Format date - ИСПРАВЛЕНО: используем date_value
    const d = matchData.date_value ? new Date(matchData.date_value) : null;
    const dateText = d ? fmtDateShortNoYear(d) : 'TBD';
    const isLive = matchData.status?.toLowerCase() === 'live';
    
    // Determine status class
    let statusClass = 'card-match__status';
    const status = matchData.status?.toLowerCase() || 'scheduled';
    if (['live', 'ongoing'].includes(status)) {
      statusClass += ' card-match__status--live';
    } else if (['finished', 'final', 'ft'].includes(status)) {
      statusClass += ' card-match__status--finished';
    } else {
      statusClass += ' card-match__status--scheduled';
    }

    // Auto-generate button based on status if not provided
    let buttonData = matchData.button;
    if (!buttonData || !buttonData.label) {
      const href = matchData.href || '#';
      if (['live', 'ongoing'].includes(status)) {
        buttonData = {
          label: 'Watch Live',
          url: href,
          icon: 'play_arrow'
        };
      } else if (['finished', 'final', 'ft'].includes(status)) {
        buttonData = {
          label: 'Match Report',
          url: href,
          icon: 'article'
        };
      } else if (['scheduled', 'upcoming'].includes(status)) {
        buttonData = {
          label: 'Preview',
          url: href,
          icon: 'visibility'
        };
      } else {
        buttonData = {
          label: 'Match Center',
          url: href,
          icon: 'sports_soccer'
        };
      }
    }

    // Build the HTML - ИСПРАВЛЕНО: используем правильные поля
    cardMatch.innerHTML = `
      <div class="card-match__top">
        <a href="${matchData.league?.href || '#'}" class="card-match__league-link">
          <img
            src="${matchData.league?.logo || '/assets/images/leagues/default.webp'}"
            alt="${matchData.league?.name || 'League'}"
            class="card-match__league-img"
            loading="lazy"
            decoding="async">
          <span>${matchData.league?.name || 'League'}</span>
        </a>
      </div>

      <div class="card-match__teams-section">
        <a href="${matchData.home?.href || '#'}" class="card-match__team">
          <img
            src="${matchData.home?.logo || '/assets/images/teams/default.webp'}"
            alt="${matchData.home?.name || 'Team 1'}"
            class="card-match__team-logo"
            loading="lazy"
            decoding="async">
          <span class="card-match__team-name">${matchData.home?.name || 'Team 1'}</span>
        </a>

        <div class="card-match__center">
          ${hasScore ? `
            <div class="card-match__score">
              <span class="card-match__score-num${w1 ? ' card-match__score-num--winner' : ''}">${matchData.score_home}</span>
              <span class="card-match__score-dash">-</span>
              <span class="card-match__score-num${w2 ? ' card-match__score-num--winner' : ''}">${matchData.score_away}</span>
            </div>
          ` : `
            <div class="card-match__vs">vs</div>
          `}
        </div>

        <a href="${matchData.away?.href || '#'}" class="card-match__team">
          <img
            src="${matchData.away?.logo || '/assets/images/teams/default.webp'}"
            alt="${matchData.away?.name || 'Team 2'}"
            class="card-match__team-logo"
            loading="lazy"
            decoding="async">
          <span class="card-match__team-name">${matchData.away?.name || 'Team 2'}</span>
        </a>
      </div>

      <div class="card-match__bottom">
        <div class="card-match__date">
          <span class="material-symbols-outlined">
            ${isLive ? 'schedule' : 'calendar_today'}
          </span>
          <span>${isLive ? 'Live' : dateText}</span>
        </div>
        
        <div class="${statusClass}">${matchData.status || 'Scheduled'}</div>

        ${buttonData?.label ? `
          <a href="${buttonData.url || buttonData.href || '#'}" class="btn btn--match">
            <span>${buttonData.label}</span>
            <span class="material-symbols-outlined">${buttonData.icon || 'arrow_forward'}</span>
          </a>
        ` : ''}
      </div>
    `;

    return cardMatch;
  }

  function renderMatches() {
    const k = iso(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate()
    );
    
    console.log('Rendering matches for date:', k);
    
    if (matchesDate) matchesDate.textContent = k;
    const data = matchesByDate[k] || [];
    
    console.log('Matches for this date:', data);
    
    matchesWrap.innerHTML = "";

    if (!data.length) {
      matchesWrap.innerHTML = `<p class="muted">No matches scheduled for this date.</p>`;
      return;
    }

    // Create card-match elements for each match
    data.forEach((matchData) => {
      const cardMatch = createCardMatch(matchData);
      matchesWrap.appendChild(cardMatch);
    });
    
    console.log('Rendered', data.length, 'matches');
  }
}

// Default export для when() системы
export default function() {
  console.log('Calendar module loaded, looking for [data-calendar] elements...');
  const calendars = document.querySelectorAll("[data-calendar]");
  console.log('Found', calendars.length, 'calendar elements');
  calendars.forEach(initCalendar);
}