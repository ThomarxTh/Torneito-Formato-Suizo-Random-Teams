let players = [];
let teams = []; 
let historyStack = [];

// Función para añadir jugadores
function addTeam() {
    const input = document.getElementById('teamInput');
    if (!input) return;
    const val = input.value.trim();
    
    if (val) {
        if (players.length < 16) {
            players.push(val);
            input.value = '';
            input.focus();
            renderSidebar();
        } else {
            alert("Ya tienes los 16 jugadores.");
        }
    }
}

function renderSidebar() {
    const list = document.getElementById('teamsAddedList');
    const count = document.getElementById('playerCount');
    if (list) list.innerHTML = players.map((p, idx) => `<li>${idx + 1}. ${p}</li>`).join('');
    if (count) count.innerText = `(${players.length} / 16)`;
}

// Lógica de Doble Eliminación
function shuffleAndAssign() {
    if (players.length < 16) return alert(`Necesitas 16 jugadores (tienes ${players.length}).`);
    
    let shuffled = [...players].sort(() => Math.random() - 0.5);
    teams = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        teams.push(`${shuffled[i]} & ${shuffled[i+1]}`);
    }
    
    historyStack = []; 
    initBrackets();
}

function initBrackets() {
    const mainContainer = document.getElementById('mainBracket');
    if (!mainContainer) return;

    mainContainer.innerHTML = `
        <div class="column">
            <h2 class="bracket-label">RONDA 1</h2>
            <div class="round" id="u-r1"><h3>UPPER CUARTOS</h3><div class="matches"></div></div>
            <div class="spacing-r1"></div>
            <div class="round" id="l-r1"><h3>LOWER R1</h3><div class="matches"></div></div>
        </div>
        <div class="column">
            <h2 class="bracket-label">RONDA 2</h2>
            <div class="round" id="u-r2"><h3>UPPER SEMIS</h3><div class="matches"></div></div>
            <div class="spacing-r2"></div>
            <div class="round" id="l-r2"><h3>LOWER R2</h3><div class="matches"></div></div>
        </div>
        <div class="column">
            <h2 class="bracket-label">RONDA 3</h2>
            <div class="round" id="u-r3"><h3>UPPER FINAL</h3><div class="matches"></div></div>
            <div class="spacing-r3"></div>
            <div class="round" id="l-semi"><h3>LOWER SEMI</h3><div class="matches"></div></div>
        </div>
        <div class="column">
            <h2 class="bracket-label">RONDA 4</h2>
            <div class="spacing-r4"></div>
            <div class="round" id="l-r3"><h3>LOWER FINAL</h3><div class="matches"></div></div>
        </div>
        <div class="column final-col">
            <h2 class="bracket-label gold">GRAND FINAL</h2>
            <div class="round" id="g-final"><div class="matches"></div></div>
        </div>
    `;

    if (teams.length === 8) {
        for (let i = 0; i < 8; i += 2) createMatch('u-r1', teams[i], teams[i+1], i/2);
    } else {
        for (let i = 0; i < 4; i++) createMatch('u-r1', null, null, i);
    }

    const rounds = ['u-r2', 'u-r3', 'l-r1', 'l-r2', 'l-semi', 'l-r3', 'g-final'];
    rounds.forEach(r => {
        const count = (r === 'u-r2' || r === 'l-r1' || r === 'l-r2') ? 2 : 1;
        for(let i=0; i<count; i++) createMatch(r, null, null, i);
    });
}

function createMatch(roundId, t1, t2, matchIndex) {
    const container = document.querySelector(`#${roundId} .matches`);
    if(!container) return;
    const div = document.createElement('div');
    div.className = 'match-card';
    div.dataset.index = matchIndex;
    div.innerHTML = `
        <div class="team-slot ${t1 ? '' : 'empty'}" onclick="handleMatch(this, '${roundId}', true)">${t1 || '---'}</div>
        <div class="team-slot ${t2 ? '' : 'empty'}" onclick="handleMatch(this, '${roundId}', false)">${t2 || '---'}</div>
    `;
    container.appendChild(div);
}

function handleMatch(el, roundId, isFirst) {
    const parent = el.parentElement;
    const teamName = el.innerText;
    const opponentName = isFirst ? parent.children[1].innerText : parent.children[0].innerText;
    const mIdx = parseInt(parent.dataset.index);

    if (teamName === '---' || opponentName === '---') return;

    saveHistory();

    if (roundId === 'u-r1') {
        advanceTo('u-r2', Math.floor(mIdx / 2), mIdx % 2, teamName);
        advanceTo('l-r1', Math.floor(mIdx / 2), mIdx % 2, opponentName);
    } else if (roundId === 'u-r2') {
        advanceTo('u-r3', 0, mIdx, teamName);
        advanceTo('l-r2', mIdx, 1, opponentName); 
    } else if (roundId === 'u-r3') {
        advanceTo('g-final', 0, 0, teamName);
        advanceTo('l-r3', 0, 1, opponentName); 
    } else if (roundId === 'l-r1') {
        advanceTo('l-r2', mIdx, 0, teamName);
    } else if (roundId === 'l-r2') {
        advanceTo('l-semi', 0, mIdx, teamName);
    } else if (roundId === 'l-semi') {
        advanceTo('l-r3', 0, 0, teamName);
    } else if (roundId === 'l-r3') {
        advanceTo('g-final', 0, 1, teamName);
    } else if (roundId === 'g-final') {
        alert("🏆 ¡CAMPEONES!: " + teamName.toUpperCase());
    }

    parent.style.opacity = '0.3';
    parent.style.pointerEvents = 'none';
    el.style.color = 'var(--vlr-green)';
}

function advanceTo(roundId, mIdx, sIdx, name) {
    const container = document.querySelector(`#${roundId} .matches`);
    if (!container) return;
    const matches = container.querySelectorAll('.match-card');
    const targetMatch = matches[mIdx];
    if (targetMatch) {
        const slot = targetMatch.children[sIdx];
        slot.innerText = name;
        slot.classList.remove('empty');
    }
}

function saveHistory() {
    historyStack.push(document.getElementById('mainBracket').innerHTML);
}

function undoAction() {
    if (historyStack.length === 0) return;
    document.getElementById('mainBracket').innerHTML = historyStack.pop();
}

function resetTournament() {
    if (confirm("¿Reiniciar todo?")) {
        players = []; teams = []; historyStack = [];
        renderSidebar();
        initBrackets();
    }
}

window.onload = initBrackets;