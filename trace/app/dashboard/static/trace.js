// Trace dashboard — minimal. HTMX is loaded from CDN; this adds:
// 1) CSRF token auto-injection on all HTMX requests.
// 2) A simple live-run poller for in-progress pipelines.

(function () {
  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  }

  document.body.addEventListener("htmx:configRequest", function (evt) {
    var token = getCookie("trace_csrf");
    if (token) evt.detail.headers["X-CSRF-Token"] = token;
  });

  // Live run status poller: any element with data-run-status-url + data-run-status
  var pollTargets = document.querySelectorAll("[data-run-status]");
  pollTargets.forEach(function (el) {
    var status = el.getAttribute("data-run-status");
    if (status === "pending" || status === "running") {
      var url = el.getAttribute("data-run-status-url");
      setTimeout(function () { window.location.reload(); }, 4000);
      // light ping for display consistency
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
