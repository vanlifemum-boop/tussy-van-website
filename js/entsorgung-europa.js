/* Europa-Entsorgungskarte mit Länder-Clustern, Suche und Ergebnisliste.
   Die große Bordatlas-Datenmenge wird erst nach Länderwahl als Pins gerendert,
   damit die Seite auch auf Mobilgeräten flüssig bleibt. */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var stage = document.querySelector("[data-eu-map]");
  var chipRow = document.querySelector("[data-eu-filter]");
  var countEl = document.querySelector("[data-eu-count]");
  var searchEl = document.querySelector("[data-eu-search]");
  var listEl = document.querySelector("[data-eu-list]");
  var data = window.EU_STATIONEN || [];
  var names = window.EU_LAENDER || {};
  var state = { cc: "alle", query: "", limit: 60 };
  var chipButtons = {};

  if (!stage || !data.length) return;

  function countryName(cc) {
    return names[cc] || cc;
  }

  function countryNamePlain(cc) {
    var label = countryName(cc);
    var separator = label.indexOf(" ");
    return separator === -1 ? label : label.slice(separator + 1);
  }

  function stationAddress(station) {
    return station.a || (station.city + ", " + station.name);
  }

  function stationPostcode(station) {
    return station.z || "";
  }

  function stationQuery(station) {
    return station.q || [stationPostcode(station), stationAddress(station), countryNamePlain(station.cc)]
      .filter(Boolean)
      .join(" ");
  }

  function mapsUrl(station) {
    return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(stationQuery(station));
  }

  function normalizeSearch(value) {
    var normalized = String(value || "").toLocaleLowerCase("de");
    if (normalized.normalize) {
      normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    return normalized;
  }

  function stationHaystack(station) {
    return normalizeSearch([
      stationPostcode(station),
      stationAddress(station),
      station.t || "",
      countryName(station.cc)
    ].join(" "));
  }

  function matchingStations() {
    var terms = normalizeSearch(state.query).trim().split(/\s+/).filter(Boolean);
    return data.filter(function (station) {
      if (state.cc !== "alle" && station.cc !== state.cc) return false;
      if (!terms.length) return true;
      var haystack = stationHaystack(station);
      return terms.every(function (term) { return haystack.indexOf(term) !== -1; });
    });
  }

  fetch(stage.getAttribute("data-eu-map"))
    .then(function (response) { return response.text(); })
    .then(function (svgText) {
      var holder = document.createElement("div");
      holder.innerHTML = svgText;
      var svg = holder.querySelector("svg");
      svg.setAttribute("class", "pl-map eu-map");
      stage.appendChild(svg);

      var layer = document.createElementNS(NS, "g");
      layer.setAttribute("class", "eu-pins-layer");
      svg.appendChild(layer);

      var countryCounts = {};
      data.forEach(function (station, index) {
        station._euIndex = index;
        countryCounts[station.cc] = (countryCounts[station.cc] || 0) + 1;
      });

      Object.keys(countryCounts).forEach(function (cc) {
        var path = svg.querySelector("#c-" + cc);
        if (path) path.classList.add("eu-land");
      });

      var viewAll = boundsFor("alle");
      svg.setAttribute("viewBox", viewAll);
      buildChips();
      bindSearch();
      bindMapClicks();
      apply(false);

      function includeBounds(bounds, x, y) {
        bounds.x1 = Math.min(bounds.x1, x);
        bounds.y1 = Math.min(bounds.y1, y);
        bounds.x2 = Math.max(bounds.x2, x);
        bounds.y2 = Math.max(bounds.y2, y);
      }

      function boundsFor(cc) {
        var bounds = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
        var selectedCountries = cc === "alle" ? Object.keys(countryCounts) : [cc];

        selectedCountries.forEach(function (countryCode) {
          var path = svg.querySelector("#c-" + countryCode);
          if (path) {
            var box = path.getBBox();
            includeBounds(bounds, box.x, box.y);
            includeBounds(bounds, box.x + box.width, box.y + box.height);
          }
        });

        data.forEach(function (station) {
          if (cc === "alle" || station.cc === cc) includeBounds(bounds, station.x, station.y);
        });

        if (!isFinite(bounds.x1)) return "0 0 820 940";
        var margin = cc === "alle" ? 18 : 14;
        var width = bounds.x2 - bounds.x1 + 2 * margin;
        var height = bounds.y2 - bounds.y1 + 2 * margin;
        if (cc !== "alle" && width < 90) {
          bounds.x1 -= (90 - width) / 2;
          width = 90;
        }
        if (cc !== "alle" && height < 90) {
          bounds.y1 -= (90 - height) / 2;
          height = 90;
        }
        return [bounds.x1 - margin, bounds.y1 - margin, width, height].join(" ");
      }

      var animation = null;
      function zoomTo(viewBox, animate) {
        if (!animate) {
          svg.setAttribute("viewBox", viewBox);
          return;
        }
        var from = svg.getAttribute("viewBox").split(" ").map(Number);
        var to = viewBox.split(" ").map(Number);
        var started = null;
        if (animation) cancelAnimationFrame(animation);

        function step(timestamp) {
          if (!started) started = timestamp;
          var progress = Math.min((timestamp - started) / 350, 1);
          var eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
          svg.setAttribute("viewBox", from.map(function (value, index) {
            return value + (to[index] - value) * eased;
          }).join(" "));
          if (progress < 1) animation = requestAnimationFrame(step);
        }
        animation = requestAnimationFrame(step);
      }

      function countryCenter(cc) {
        var path = svg.querySelector("#c-" + cc);
        if (path) {
          var box = path.getBBox();
          return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        }
        var stations = data.filter(function (station) { return station.cc === cc; });
        return {
          x: stations.reduce(function (sum, station) { return sum + station.x; }, 0) / stations.length,
          y: stations.reduce(function (sum, station) { return sum + station.y; }, 0) / stations.length
        };
      }

      function addTitle(element, text) {
        var title = document.createElementNS(NS, "title");
        title.textContent = text;
        element.appendChild(title);
      }

      function renderCountryClusters() {
        Object.keys(countryCounts).forEach(function (cc) {
          var center = countryCenter(cc);
          var group = document.createElementNS(NS, "g");
          group.setAttribute("class", "eu-cluster");
          group.setAttribute("data-cc", cc);
          group.setAttribute("role", "button");
          group.setAttribute("tabindex", "0");
          group.setAttribute("transform", "translate(" + center.x + "," + center.y + ")");
          group.setAttribute("aria-label", countryName(cc) + ": " + countryCounts[cc] + " Stationen anzeigen");

          var circle = document.createElementNS(NS, "circle");
          circle.setAttribute("r", String(10 + Math.min(5, Math.log(countryCounts[cc] + 1))));
          group.appendChild(circle);

          var label = document.createElementNS(NS, "text");
          label.setAttribute("text-anchor", "middle");
          label.setAttribute("y", "2.5");
          label.textContent = countryCounts[cc];
          group.appendChild(label);
          addTitle(group, countryName(cc) + " — " + countryCounts[cc] + " Stationen");
          layer.appendChild(group);
        });
      }

      function renderStationPins() {
        var fragment = document.createDocumentFragment();
        var stationCount = countryCounts[state.cc] || 0;
        var radius = stationCount > 1500 ? 0.9
          : stationCount > 600 ? 1.1
          : stationCount > 250 ? 1.4
          : stationCount > 80 ? 1.8
          : stationCount > 20 ? 2.4
          : 3;
        data.forEach(function (station) {
          if (station.cc !== state.cc) return;
          var group = document.createElementNS(NS, "g");
          group.setAttribute("class", "eu-pin");
          group.setAttribute("data-index", station._euIndex);
          group.setAttribute("transform", "translate(" + station.x + "," + station.y + ")");

          var circle = document.createElementNS(NS, "circle");
          circle.setAttribute("r", radius);
          circle.setAttribute("vector-effect", "non-scaling-stroke");
          group.appendChild(circle);
          addTitle(group, stationAddress(station) + " — in Google Maps öffnen");
          fragment.appendChild(group);
        });
        layer.appendChild(fragment);
      }

      function renderPins() {
        while (layer.firstChild) layer.removeChild(layer.firstChild);
        if (state.cc === "alle") renderCountryClusters();
        else renderStationPins();
      }

      function updateCount(matches) {
        if (!countEl) return;
        if (state.query) {
          countEl.textContent = matches.length + " Treffer"
            + (state.cc === "alle" ? " in Europa" : " · " + countryName(state.cc));
        } else if (state.cc === "alle") {
          countEl.textContent = data.length + " Stationen in " + Object.keys(countryCounts).length
            + " Ländern — Land wählen oder unten nach Ort und PLZ suchen";
        } else {
          countEl.textContent = matches.length + (matches.length === 1 ? " Station" : " Stationen")
            + " · " + countryName(state.cc) + " — Pin anklicken, um Google Maps zu öffnen";
        }
      }

      function appendResultList(matches) {
        if (!listEl) return;
        while (listEl.firstChild) listEl.removeChild(listEl.firstChild);

        if (!state.query && state.cc === "alle") {
          var hint = document.createElement("p");
          hint.className = "eu-results-empty";
          hint.textContent = "Wähle ein Land oder suche nach Ort, Postleitzahl oder Stationsname.";
          listEl.appendChild(hint);
          return;
        }

        if (!matches.length) {
          var empty = document.createElement("p");
          empty.className = "eu-results-empty";
          empty.textContent = "Keine passende Station gefunden.";
          listEl.appendChild(empty);
          return;
        }

        var summary = document.createElement("p");
        summary.className = "eu-results-summary";
        summary.textContent = matches.length + (matches.length === 1 ? " Ergebnis" : " Ergebnisse");
        listEl.appendChild(summary);

        var list = document.createElement("ul");
        list.className = "eu-station-list";
        matches.slice(0, state.limit).forEach(function (station) {
          var item = document.createElement("li");
          var link = document.createElement("a");
          link.href = mapsUrl(station);
          link.target = "_blank";
          link.rel = "noopener";
          link.textContent = [stationPostcode(station), stationAddress(station)].filter(Boolean).join(" · ");
          item.appendChild(link);

          var meta = document.createElement("span");
          meta.className = "eu-station-meta";
          meta.textContent = [
            state.cc === "alle" ? countryName(station.cc) : "",
            station.t && station.t !== "andere" ? station.t : ""
          ]
            .filter(Boolean)
            .join(" · ");
          if (meta.textContent) item.appendChild(meta);
          list.appendChild(item);
        });
        listEl.appendChild(list);

        if (matches.length > state.limit) {
          var more = document.createElement("button");
          more.type = "button";
          more.className = "chip eu-more";
          more.textContent = "Weitere " + Math.min(60, matches.length - state.limit) + " anzeigen";
          more.addEventListener("click", function () {
            state.limit += 60;
            appendResultList(matches);
          });
          listEl.appendChild(more);
        }
      }

      function renderList() {
        var matches = matchingStations().sort(function (left, right) {
          return stationAddress(left).localeCompare(stationAddress(right), "de");
        });
        updateCount(matches);
        appendResultList(matches);
      }

      function apply(animate) {
        renderPins();
        renderList();
        zoomTo(state.cc === "alle" ? viewAll : boundsFor(state.cc), animate);
      }

      function setCountry(cc, animate) {
        state.cc = cc;
        state.limit = 60;
        Object.keys(chipButtons).forEach(function (key) {
          chipButtons[key].classList.toggle("active", key === cc);
        });
        apply(animate);
      }

      function buildChips() {
        if (!chipRow) return;
        var allButton = document.createElement("button");
        allButton.type = "button";
        allButton.className = "chip active";
        allButton.textContent = "Ganz Europa";
        allButton.addEventListener("click", function () { setCountry("alle", true); });
        chipButtons.alle = allButton;
        chipRow.appendChild(allButton);

        Object.keys(countryCounts)
          .sort(function (left, right) { return countryNamePlain(left).localeCompare(countryNamePlain(right), "de"); })
          .forEach(function (cc) {
            var button = document.createElement("button");
            button.type = "button";
            button.className = "chip";
            button.textContent = countryName(cc) + " (" + countryCounts[cc] + ")";
            button.addEventListener("click", function () { setCountry(cc, true); });
            chipButtons[cc] = button;
            chipRow.appendChild(button);
          });
      }

      function bindSearch() {
        if (!searchEl) return;
        searchEl.addEventListener("input", function () {
          state.query = searchEl.value;
          state.limit = 60;
          renderList();
        });
      }

      function mapTarget(element) {
        var target = element;
        while (target && target !== layer) {
          if (target.hasAttribute("data-index") || target.hasAttribute("data-cc")) return target;
          target = target.parentNode;
        }
        return null;
      }

      function activateMapTarget(target) {
        if (!target) return;
        var cc = target.getAttribute("data-cc");
        if (cc) {
          setCountry(cc, true);
          return;
        }
        var index = Number(target.getAttribute("data-index"));
        if (isFinite(index) && data[index]) {
          window.open(mapsUrl(data[index]), "_blank", "noopener");
        }
      }

      function bindMapClicks() {
        layer.addEventListener("click", function (event) {
          activateMapTarget(mapTarget(event.target));
        });
        layer.addEventListener("keydown", function (event) {
          if (event.key !== "Enter" && event.key !== " ") return;
          var target = mapTarget(event.target);
          if (!target) return;
          event.preventDefault();
          activateMapTarget(target);
        });
      }
    })
    .catch(function (error) {
      console.error("Europakarte konnte nicht geladen werden:", error);
      if (countEl) countEl.textContent = "Die Europakarte konnte nicht geladen werden.";
    });
})();
