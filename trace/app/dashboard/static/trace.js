// Trace dashboard — minimal. HTMX is loaded from CDN; this adds:
// 1) CSRF token auto-injection on all HTMX requests.
// 2) A simple live-run poller for in-progress pipelines.
// 3) Signal-row editor delegated handlers (add / remove / suggested-add).
//
// All event wiring is here so CSP can drop `'unsafe-inline'` on script-src.

(function () {
  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  }

  document.body.addEventListener("htmx:configRequest", function (evt) {
    var token = getCookie("trace_csrf");
    if (token) evt.detail.headers["X-CSRF-Token"] = token;
  });

  // ---- Signals editor: read CANON from a data attribute on the table. ----
  function getCanon() {
    var tbl = document.getElementById("signals-table");
    if (!tbl) return [];
    try {
      return JSON.parse(tbl.getAttribute("data-canonical") || "[]");
    } catch (_) {
      return [];
    }
  }

  function updateWeightSum() {
    var weights = document.querySelectorAll(
      '#signals-body input[name="sig_weight"]'
    );
    var sum = 0;
    weights.forEach(function (w) {
      var n = parseFloat(w.value);
      if (!isNaN(n)) sum += n;
    });
    var el = document.getElementById("weight-sum");
    if (el) el.textContent = sum.toFixed(1);
  }

  function makeSelect(name) {
    var sel = document.createElement("select");
    sel.name = "sig_name";
    getCanon().forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      if (c === name) opt.selected = true;
      sel.appendChild(opt);
    });
    return sel;
  }

  function addSignalRow(name, weight, desc) {
    var tbody = document.getElementById("signals-body");
    if (!tbody) return;
    var tr = document.createElement("tr");

    var tdName = document.createElement("td");
    tdName.appendChild(makeSelect(name));

    var tdWeight = document.createElement("td");
    var inpWeight = document.createElement("input");
    inpWeight.name = "sig_weight";
    inpWeight.type = "number";
    inpWeight.min = "0";
    inpWeight.max = "10";
    inpWeight.step = "0.1";
    inpWeight.value = (weight === undefined || weight === null)
      ? "1.0"
      : String(weight);
    tdWeight.appendChild(inpWeight);

    var tdDesc = document.createElement("td");
    var inpDesc = document.createElement("input");
    inpDesc.name = "sig_desc";
    inpDesc.type = "text";
    inpDesc.value = desc || "";
    tdDesc.appendChild(inpDesc);

    var tdRm = document.createElement("td");
    var btnRm = document.createElement("button");
    btnRm.type = "button";
    btnRm.className = "btn ghost";
    btnRm.setAttribute("data-action", "remove-signal-row");
    btnRm.textContent = "\u00d7";
    tdRm.appendChild(btnRm);

    tr.appendChild(tdName);
    tr.appendChild(tdWeight);
    tr.appendChild(tdDesc);
    tr.appendChild(tdRm);
    tbody.appendChild(tr);
    updateWeightSum();
  }

  // Delegate clicks for data-action buttons.
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!(t instanceof Element)) return;
    var btn = t.closest("[data-action]");
    if (!btn) return;
    var action = btn.getAttribute("data-action");
    if (action === "remove-signal-row") {
      var row = btn.closest("tr");
      if (row) row.remove();
      updateWeightSum();
    } else if (action === "add-signal-row") {
      addSignalRow();
    } else if (action === "add-suggested-signal") {
      var name = btn.getAttribute("data-signal-name") || "";
      var wRaw = btn.getAttribute("data-signal-weight");
      var w = wRaw === null ? 1.0 : parseFloat(wRaw);
      if (isNaN(w)) w = 1.0;
      addSignalRow(name, w, btn.getAttribute("data-signal-desc") || "");
    }
  });

  document.addEventListener("input", function (e) {
    if (e.target && e.target.name === "sig_weight") updateWeightSum();
  });

  // Initial render
  updateWeightSum();

  // ---- Live run status poller: any element with data-run-status-url + data-run-status.
  var pollTargets = document.querySelectorAll("[data-run-status]");
  pollTargets.forEach(function (el) {
    var status = el.getAttribute("data-run-status");
    if (status === "pending" || status === "running") {
      var url = el.getAttribute("data-run-status-url");
      setTimeout(function () { window.location.reload(); }, 4000);
      if (url) {
        setTimeout(function () {
          fetch(url, { credentials: "same-origin" })
            .then(function (r) { return r.text(); })
            .then(function (html) { el.innerHTML = html; })
            .catch(function () {});
        }, 2000);
      }
    }
  });
})();
