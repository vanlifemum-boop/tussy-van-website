(function () {
  "use strict";

  var COLS = 6;
  var ROWS = 8;

  var ITEM_LIBRARY = {
    water: item("water", "Wasserkanister", "💧", "#2f8ddd", 8, [[0,0],[1,0],[0,1],[1,1]], true),
    bag: item("bag", "Reisetasche", "👜", "#d47b51", 5, [[0,0],[1,0],[2,0],[0,1],[1,1]]),
    chair: item("chair", "Campingstuhl", "🪑", "#efb13e", 3, [[0,0],[0,1],[0,2],[1,2]]),
    boots: item("boots", "Boots", "🥾", "#a86c42", 2, [[0,0],[1,0],[0,1]]),
    cooler: item("cooler", "Kühlbox", "❄️", "#e34f50", 7, [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]], true),
    bedroll: item("bedroll", "Schlafsack", "🛏️", "#5d71d5", 2, [[0,0],[1,0],[2,0],[3,0]]),
    toolkit: item("toolkit", "Werkzeug", "🔧", "#787f8c", 6, [[0,0],[1,0],[0,1],[1,1],[0,2]]),
    tent: item("tent", "Vorzelt", "⛺", "#30a169", 5, [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]),
    drinks: item("drinks", "Getränkekiste", "🥤", "#2d87bd", 9, [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]]),
    grill: item("grill", "Campinggrill", "♨️", "#d85b47", 8, [[0,0],[1,0],[0,1],[1,1]]),
    table: item("table", "Klapptisch", "▤", "#e0a13b", 5, [[0,0],[1,0],[2,0],[0,1],[2,1]]),
    backpack: item("backpack", "Rucksack", "🎒", "#964fba", 4, [[1,0],[0,1],[1,1],[2,1],[1,2]], true),
    jacket: item("jacket", "Regenjacke", "🧥", "#f1d13e", 1, [[0,0],[1,0],[2,0]], true),
    cable: item("cable", "Kabeltrommel", "🔌", "#4b73dc", 3, [[0,0],[1,0],[0,1],[1,1],[2,1]]),
    toilet: item("toilet", "Campingtoilette", "🚽", "#df6d98", 6, [[0,0],[1,0],[0,1],[1,1],[0,2],[1,2]], true),
    hose: item("hose", "Wasserschlauch", "➰", "#36a9a5", 3, [[0,0],[1,0],[2,0],[0,1],[2,1]]),
    chemical: item("chemical", "Sanitärmittel", "🧴", "#9e68c7", 4, [[0,0],[1,0],[0,1],[1,1]]),
    gloves: item("gloves", "Handschuhe", "🧤", "#f0c33b", 1, [[0,0],[1,0],[2,0]], true),
    freshWater: item("freshWater", "Frischwasser", "🚰", "#287fbd", 10, [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]),
    trash: item("trash", "Abfallbox", "♻️", "#54a961", 3, [[0,0],[1,0],[0,1],[1,1]])
  };

  var LEVELS = [
    {
      name: "Wochenendtrip",
      seconds: 75,
      intro: "Pack alles ein. Wasser und Kühlbox sollen an der Hecktür griffbereit bleiben.",
      blocked: [[6,0],[7,0],[6,5],[7,5]],
      items: ["water", "bag", "chair", "boots", "cooler", "bedroll", "toolkit"]
    },
    {
      name: "Festival-Chaos",
      seconds: 90,
      intro: "Der Platz wird knapp. Rucksack und Regenjacke müssen trotzdem schnell erreichbar sein.",
      blocked: [[5,0],[6,0],[7,0],[5,5],[6,5],[7,5]],
      items: ["tent", "chair", "drinks", "grill", "table", "backpack", "jacket", "cable"]
    },
    {
      name: "Entsorgungs-Notfall",
      seconds: 100,
      intro: "Die Station schließt gleich. Toilette und Handschuhe gehören griffbereit an die Hecktür.",
      blocked: [[0,2],[0,3],[6,0],[7,0],[6,5],[7,5]],
      items: ["toilet", "hose", "freshWater", "chemical", "gloves", "toolkit", "cable", "trash"]
    }
  ];

  var els = {
    grid: document.getElementById("cargoGrid"),
    inventory: document.getElementById("inventory"),
    level: document.getElementById("levelValue"),
    score: document.getElementById("scoreValue"),
    time: document.getElementById("timeValue"),
    load: document.getElementById("loadValue"),
    mission: document.getElementById("missionTitle"),
    selectedHint: document.getElementById("selectedHint"),
    selectedIcon: document.getElementById("selectedIcon"),
    selectedName: document.getElementById("selectedName"),
    selectedMeta: document.getElementById("selectedMeta"),
    rotate: document.getElementById("rotateButton"),
    undo: document.getElementById("undoButton"),
    restart: document.getElementById("restartButton"),
    sound: document.getElementById("soundButton"),
    status: document.getElementById("gameStatus"),
    balanceMeter: document.getElementById("balanceMeter"),
    balanceValue: document.getElementById("balanceValue"),
    accessMeter: document.getElementById("accessMeter"),
    accessValue: document.getElementById("accessValue"),
    overlay: document.getElementById("gameOverlay"),
    overlayKicker: document.querySelector(".overlay-kicker"),
    overlayTitle: document.getElementById("overlayTitle"),
    overlayText: document.getElementById("overlayText"),
    howTo: document.getElementById("howTo"),
    overlayScore: document.getElementById("overlayScore"),
    overlayPrimary: document.getElementById("overlayPrimary"),
    share: document.getElementById("shareButton")
  };

  var state = {
    levelIndex: 0,
    items: [],
    placements: {},
    selectedId: null,
    selectedShape: null,
    history: [],
    secondsLeft: 0,
    score: 0,
    running: false,
    finished: false,
    timer: null,
    soundOn: true,
    lastResult: null
  };

  function item(id, name, icon, color, weight, shape, priority) {
    return { id: id, name: name, icon: icon, color: color, weight: weight, shape: shape, priority: !!priority };
  }

  function copyItem(id) {
    var source = ITEM_LIBRARY[id];
    return {
      id: source.id,
      name: source.name,
      icon: source.icon,
      color: source.color,
      weight: source.weight,
      priority: source.priority,
      shape: source.shape.map(function (cell) { return cell.slice(); })
    };
  }

  function currentLevel() { return LEVELS[state.levelIndex]; }

  function beginLevel(index) {
    window.clearInterval(state.timer);
    state.levelIndex = index;
    state.items = currentLevel().items.map(copyItem);
    state.placements = {};
    state.selectedId = null;
    state.selectedShape = null;
    state.history = [];
    state.secondsLeft = currentLevel().seconds;
    state.score = 0;
    state.running = false;
    state.finished = false;
    state.lastResult = null;
    updateAll();
    showIntro();
  }

  function startTimer() {
    state.running = true;
    state.finished = false;
    state.timer = window.setInterval(function () {
      state.secondsLeft -= 1;
      updateHud();
      if (state.secondsLeft <= 0) finishLevel(false);
    }, 1000);
  }

  function showIntro() {
    var level = currentLevel();
    els.overlayKicker.textContent = "Level " + (state.levelIndex + 1) + " von " + LEVELS.length;
    els.overlayTitle.textContent = level.name;
    els.overlayText.textContent = level.intro;
    els.howTo.hidden = false;
    els.overlayScore.hidden = true;
    els.share.hidden = true;
    els.overlayPrimary.textContent = state.levelIndex === 0 ? "Los geht’s" : "Level starten";
    els.overlayPrimary.onclick = function () {
      hideOverlay();
      startTimer();
      updateAll();
      announce("Los geht's. Wähle deine erste Ladung.");
      beep(520, 0.07);
    };
    showOverlay();
  }

  function showOverlay() {
    els.overlay.classList.add("show");
    window.setTimeout(function () { els.overlayPrimary.focus(); }, 40);
  }

  function hideOverlay() { els.overlay.classList.remove("show"); }

  function selectItem(id) {
    if (!state.running || state.finished || state.placements[id]) return;
    if (state.selectedId === id) {
      state.selectedId = null;
      state.selectedShape = null;
      announce("Auswahl aufgehoben.");
      updateAll();
      return;
    }
    var selected = state.items.find(function (entry) { return entry.id === id; });
    if (!selected) return;
    state.selectedId = id;
    state.selectedShape = selected.shape.map(function (cell) { return cell.slice(); });
    beep(610, 0.035);
    announce(selected.name + " gewählt. Tippe auf ein freies Feld im Laderaum.");
    updateAll();
  }

  function rotateSelected() {
    if (!state.selectedId || !state.selectedShape || !state.running) return;
    state.selectedShape = rotateShape(state.selectedShape);
    beep(720, 0.04);
    announce("Gegenstand gedreht.");
    updateSelected();
    renderInventory();
  }

  function rotateShape(shape) {
    var rotated = shape.map(function (cell) { return [-cell[1], cell[0]]; });
    var minX = Math.min.apply(null, rotated.map(function (cell) { return cell[0]; }));
    var minY = Math.min.apply(null, rotated.map(function (cell) { return cell[1]; }));
    return rotated.map(function (cell) { return [cell[0] - minX, cell[1] - minY]; });
  }

  function occupiedCells(ignoreId) {
    var occupied = {};
    Object.keys(state.placements).forEach(function (id) {
      if (id === ignoreId) return;
      state.placements[id].cells.forEach(function (cell) {
        occupied[cell[1] + ":" + cell[0]] = id;
      });
    });
    return occupied;
  }

  function blockedSet() {
    var set = {};
    currentLevel().blocked.forEach(function (cell) { set[cell[0] + ":" + cell[1]] = true; });
    return set;
  }

  function tryPlace(row, col) {
    if (!state.running || state.finished) return;

    var existing = findPlacementAt(row, col);
    if (!state.selectedId && existing) {
      saveHistory();
      delete state.placements[existing];
      state.selectedId = existing;
      state.selectedShape = state.items.find(function (entry) { return entry.id === existing; }).shape.map(function (cell) { return cell.slice(); });
      beep(390, 0.045);
      announce("Gegenstand zurückgenommen. Du kannst ihn neu platzieren.");
      updateAll();
      return;
    }

    if (!state.selectedId || !state.selectedShape) {
      announce("Wähle zuerst einen Gegenstand aus der Ladung.");
      flashCell(row, col);
      return;
    }

    var cells = state.selectedShape.map(function (cell) { return [col + cell[0], row + cell[1]]; });
    var occupied = occupiedCells(state.selectedId);
    var blocked = blockedSet();
    var valid = cells.every(function (cell) {
      var x = cell[0], y = cell[1];
      return x >= 0 && x < COLS && y >= 0 && y < ROWS && !occupied[y + ":" + x] && !blocked[y + ":" + x];
    });

    if (!valid) {
      beep(145, 0.09);
      announce("Das passt dort nicht. Versuche ein anderes Feld oder drehe den Gegenstand.");
      flashCell(row, col);
      return;
    }

    saveHistory();
    state.placements[state.selectedId] = {
      row: row,
      col: col,
      cells: cells,
      shape: state.selectedShape.map(function (cell) { return cell.slice(); })
    };
    var packedName = state.items.find(function (entry) { return entry.id === state.selectedId; }).name;
    state.selectedId = null;
    state.selectedShape = null;
    beep(460, 0.045);
    announce(packedName + " eingeladen.");
    updateAll();

    if (Object.keys(state.placements).length === state.items.length) {
      window.setTimeout(function () { finishLevel(true); }, 240);
    }
  }

  function findPlacementAt(row, col) {
    var found = null;
    Object.keys(state.placements).some(function (id) {
      var hit = state.placements[id].cells.some(function (cell) { return cell[0] === col && cell[1] === row; });
      if (hit) found = id;
      return hit;
    });
    return found;
  }

  function saveHistory() {
    state.history.push(JSON.stringify(state.placements));
    if (state.history.length > 30) state.history.shift();
  }

  function undo() {
    if (!state.running || !state.history.length) return;
    state.placements = JSON.parse(state.history.pop());
    state.selectedId = null;
    state.selectedShape = null;
    beep(310, 0.05);
    announce("Letzten Schritt rückgängig gemacht.");
    updateAll();
  }

  function restart() {
    window.clearInterval(state.timer);
    state.placements = {};
    state.selectedId = null;
    state.selectedShape = null;
    state.history = [];
    state.secondsLeft = currentLevel().seconds;
    state.score = 0;
    state.running = true;
    state.finished = false;
    hideOverlay();
    startTimer();
    beep(260, 0.07);
    announce("Level neu gestartet.");
    updateAll();
  }

  function finishLevel(success) {
    if (state.finished) return;
    window.clearInterval(state.timer);
    state.running = false;
    state.finished = true;

    if (!success) {
      els.overlayKicker.textContent = "Zeit vorbei";
      els.overlayTitle.textContent = "Der Van ist noch nicht voll";
      els.overlayText.textContent = "Kein Drama — beim nächsten Versuch sitzt jeder Handgriff besser.";
      els.howTo.hidden = true;
      els.overlayScore.hidden = false;
      els.overlayScore.innerHTML = "Eingeladen: <strong>" + Object.keys(state.placements).length + "/" + state.items.length + "</strong>";
      els.share.hidden = true;
      els.overlayPrimary.textContent = "Nochmal versuchen";
      els.overlayPrimary.onclick = restart;
      beep(120, 0.2);
      showOverlay();
      return;
    }

    var balance = getBalance();
    var access = getAccess();
    var stars = balance >= 78 && access === 100 ? 3 : (balance >= 55 && access >= 50 ? 2 : 1);
    state.score = state.items.length * 150 + state.secondsLeft * 8 + balance * 4 + access * 2;
    state.score = Math.round(state.score);
    state.lastResult = { score: state.score, stars: stars, level: currentLevel().name };
    updateHud();

    els.overlayKicker.textContent = "Level geschafft";
    els.overlayTitle.textContent = stars === 3 ? "Perfekt gepackt!" : (stars === 2 ? "Abfahrbereit!" : "Alles ist drin!");
    els.overlayText.textContent = access < 100 ? "Alles passt — aber die griffbereiten Sachen könnten noch näher an die Hecktür." : "Alles drin, gut ausbalanciert und die wichtigen Sachen sind erreichbar.";
    els.howTo.hidden = true;
    els.overlayScore.hidden = false;
    els.overlayScore.innerHTML = '<span class="stars" aria-label="' + stars + ' von 3 Campingsternen">' + "★".repeat(stars) + "☆".repeat(3 - stars) + "</span>Score <strong>" + padScore(state.score) + "</strong><br><small>Balance " + balance + "% · Zugriff " + access + "%</small>";
    els.share.hidden = false;

    if (state.levelIndex < LEVELS.length - 1) {
      els.overlayPrimary.textContent = "Nächstes Level";
      els.overlayPrimary.onclick = function () { beginLevel(state.levelIndex + 1); };
    } else {
      els.overlayPrimary.textContent = "Stationen entdecken";
      els.overlayPrimary.onclick = function () { window.location.href = "entsorgung.html"; };
      els.overlayText.textContent += " Jetzt kannst du auf der echten Tussy-Van-Karte eine Entsorgungsstation finden.";
    }

    beep(660, 0.08);
    window.setTimeout(function () { beep(840, 0.1); }, 100);
    showOverlay();
  }

  function renderGrid() {
    els.grid.innerHTML = "";
    var blocked = blockedSet();
    var occupied = occupiedCells();

    for (var row = 0; row < ROWS; row += 1) {
      for (var col = 0; col < COLS; col += 1) {
        var cell = document.createElement("button");
        var key = row + ":" + col;
        cell.type = "button";
        cell.className = "cargo-cell";
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.setAttribute("role", "gridcell");

        if (blocked[key]) {
          cell.classList.add("blocked");
          cell.disabled = true;
          cell.setAttribute("aria-label", "Radkasten, nicht belegbar");
        } else if (occupied[key]) {
          var id = occupied[key];
          var packedItem = state.items.find(function (entry) { return entry.id === id; });
          var placement = state.placements[id];
          cell.classList.add("filled");
          cell.style.setProperty("--item-color", packedItem.color);
          cell.setAttribute("aria-label", packedItem.name + ", antippen zum Herausnehmen");
          if (placement.cells[0][0] === col && placement.cells[0][1] === row) {
            cell.classList.add("item-origin");
            cell.dataset.icon = packedItem.icon;
          }
        } else {
          cell.classList.add("placeable");
          cell.setAttribute("aria-label", "Freies Feld, Reihe " + (row + 1) + ", Spalte " + (col + 1));
        }

        cell.addEventListener("click", function (event) {
          tryPlace(Number(event.currentTarget.dataset.row), Number(event.currentTarget.dataset.col));
        });
        els.grid.appendChild(cell);
      }
    }
  }

  function renderInventory() {
    els.inventory.innerHTML = "";
    state.items.forEach(function (entry) {
      var button = document.createElement("button");
      var packed = !!state.placements[entry.id];
      button.type = "button";
      button.className = "inventory-item" + (state.selectedId === entry.id ? " selected" : "") + (packed ? " packed" : "");
      button.disabled = packed || !state.running;
      button.setAttribute("aria-pressed", state.selectedId === entry.id ? "true" : "false");
      button.setAttribute("aria-label", entry.name + ", " + entry.weight + " Kilogramm" + (entry.priority ? ", griffbereit laden" : ""));

      var shape = state.selectedId === entry.id && state.selectedShape ? state.selectedShape : entry.shape;
      button.appendChild(makeMiniShape(shape, entry.color));
      var label = document.createElement("span");
      label.innerHTML = "<b>" + entry.icon + " " + entry.name + "</b><small class=\"" + (entry.priority ? "priority" : "") + "\">" + entry.weight + " kg" + (entry.priority ? " · griffbereit" : "") + "</small>";
      button.appendChild(label);
      button.addEventListener("click", function () { selectItem(entry.id); });
      els.inventory.appendChild(button);
    });
  }

  function makeMiniShape(shape, color) {
    var width = Math.max.apply(null, shape.map(function (cell) { return cell[0]; })) + 1;
    var height = Math.max.apply(null, shape.map(function (cell) { return cell[1]; })) + 1;
    var present = {};
    shape.forEach(function (cell) { present[cell[1] + ":" + cell[0]] = true; });
    var mini = document.createElement("span");
    mini.className = "mini-shape";
    mini.style.gridTemplateColumns = "repeat(" + width + ", 9px)";
    mini.style.gridTemplateRows = "repeat(" + height + ", 9px)";
    mini.style.setProperty("--item-color", color);
    for (var row = 0; row < height; row += 1) {
      for (var col = 0; col < width; col += 1) {
        var block = document.createElement("i");
        block.className = "mini-cell" + (present[row + ":" + col] ? "" : " empty");
        mini.appendChild(block);
      }
    }
    return mini;
  }

  function updateHud() {
    var packed = Object.keys(state.placements).length;
    var liveScore = state.finished && state.lastResult ? state.score : packed * 150 + Math.max(0, state.secondsLeft) * 3;
    els.level.textContent = (state.levelIndex + 1) + "/" + LEVELS.length;
    els.score.textContent = padScore(liveScore);
    els.time.textContent = formatTime(state.secondsLeft);
    els.time.parentElement.classList.toggle("urgent", state.running && state.secondsLeft <= 15);
    els.load.textContent = "Ladung " + packed + "/" + state.items.length;
    els.mission.textContent = currentLevel().name;
  }

  function updateSelected() {
    var selected = state.items.find(function (entry) { return entry.id === state.selectedId; });
    if (!selected) {
      els.selectedHint.textContent = "Wähle einen Gegenstand";
      els.selectedIcon.textContent = "☝";
      els.selectedName.textContent = "Noch nichts gewählt";
      els.selectedMeta.textContent = "Tippe zuerst auf einen Gegenstand.";
      els.rotate.disabled = true;
      return;
    }
    els.selectedHint.textContent = selected.name + " ist ausgewählt";
    els.selectedIcon.textContent = selected.icon;
    els.selectedName.textContent = selected.name;
    els.selectedMeta.textContent = selected.weight + " kg" + (selected.priority ? " · an der Hecktür einladen" : " · freien Platz antippen");
    els.rotate.disabled = !state.running;
  }

  function updateMeters() {
    var balance = getBalance();
    var access = getAccess();
    els.balanceMeter.style.width = balance + "%";
    els.balanceMeter.style.background = balance < 55 ? "#ed4b48" : "#fff500";
    els.balanceValue.textContent = balance + "%";
    els.accessMeter.style.width = access + "%";
    els.accessMeter.style.background = access < 50 ? "#ed4b48" : "#59d989";
    els.accessValue.textContent = access + "%";
  }

  function getBalance() {
    var weightedX = 0;
    var totalWeight = 0;
    state.items.forEach(function (entry) {
      var placement = state.placements[entry.id];
      if (!placement) return;
      var avgX = placement.cells.reduce(function (sum, cell) { return sum + cell[0]; }, 0) / placement.cells.length;
      weightedX += avgX * entry.weight;
      totalWeight += entry.weight;
    });
    if (!totalWeight) return 100;
    var center = (COLS - 1) / 2;
    return Math.max(0, Math.round(100 - Math.abs(weightedX / totalWeight - center) / center * 100));
  }

  function getAccess() {
    var priority = state.items.filter(function (entry) { return entry.priority; });
    var placedPriority = priority.filter(function (entry) {
      var placement = state.placements[entry.id];
      return placement && placement.cells.some(function (cell) { return cell[1] >= ROWS - 2; });
    });
    return priority.length ? Math.round(placedPriority.length / priority.length * 100) : 100;
  }

  function updateAll() {
    renderGrid();
    renderInventory();
    updateHud();
    updateSelected();
    updateMeters();
    els.undo.disabled = !state.running || !state.history.length;
  }

  function flashCell(row, col) {
    var cell = els.grid.querySelector('[data-row="' + row + '"][data-col="' + col + '"]');
    if (!cell) return;
    cell.classList.remove("invalid-flash");
    void cell.offsetWidth;
    cell.classList.add("invalid-flash");
  }

  function announce(message) { els.status.textContent = message; }

  function padScore(value) { return String(Math.max(0, value)).padStart(4, "0"); }

  function formatTime(seconds) {
    var safe = Math.max(0, seconds);
    return String(Math.floor(safe / 60)).padStart(2, "0") + ":" + String(safe % 60).padStart(2, "0");
  }

  function beep(frequency, duration) {
    if (!state.soundOn || !window.AudioContext && !window.webkitAudioContext) return;
    try {
      var AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!beep.context) beep.context = new AudioCtor();
      var oscillator = beep.context.createOscillator();
      var gain = beep.context.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.035, beep.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, beep.context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(beep.context.destination);
      oscillator.start();
      oscillator.stop(beep.context.currentTime + duration);
    } catch (error) {}
  }

  function shareResult() {
    if (!state.lastResult) return;
    var text = "Ich habe " + state.lastResult.score + " Punkte bei Tussy Van – Pack & Go geschafft! " + "★".repeat(state.lastResult.stars) + " #TussyVan";
    var data = { title: "Tussy Van – Pack & Go", text: text, url: window.location.href };
    if (navigator.share) {
      navigator.share(data).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text + " " + window.location.href).then(function () {
        announce("Ergebnis kopiert — jetzt kannst du es teilen.");
        els.share.textContent = "Kopiert!";
      });
    } else {
      announce("Teilen wird von diesem Browser leider nicht unterstützt.");
    }
  }

  els.rotate.addEventListener("click", rotateSelected);
  els.undo.addEventListener("click", undo);
  els.restart.addEventListener("click", restart);
  els.share.addEventListener("click", shareResult);
  els.sound.addEventListener("click", function () {
    state.soundOn = !state.soundOn;
    els.sound.setAttribute("aria-pressed", state.soundOn ? "true" : "false");
    els.sound.setAttribute("aria-label", state.soundOn ? "Ton ausschalten" : "Ton einschalten");
    els.sound.textContent = state.soundOn ? "♪" : "×";
    if (state.soundOn) beep(520, 0.05);
  });

  document.addEventListener("keydown", function (event) {
    if ((event.key === "r" || event.key === "R") && state.selectedId) rotateSelected();
    if (event.key === "Escape" && state.selectedId) {
      state.selectedId = null;
      state.selectedShape = null;
      announce("Auswahl aufgehoben.");
      updateAll();
    }
  });

  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    });
  }

  beginLevel(0);
}());
