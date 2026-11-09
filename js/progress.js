(function () {
  // Per-week storage key: set <body data-progress-key="aox-weekN-done">; defaults to Week 1.
  const KEY = (document.body && document.body.getAttribute("data-progress-key")) || "aox-week1-done";
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch { return {}; }
  }
  function save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) {}
  }
  function updateBar() {
    const sections = document.querySelectorAll("[data-section]");
    if (!sections.length) return;
    const done = load();
    let n = 0;
    sections.forEach((el) => {
      const id = el.getAttribute("data-section");
      const btn = el.querySelector(".mark-done");
      if (done[id]) {
        n++;
        if (btn) {
          btn.classList.add("done");
          btn.textContent = "Done ✓";
          btn.setAttribute("aria-pressed", "true");
        }
      }
    });
    const fill = document.getElementById("progress-fill");
    const label = document.getElementById("progress-label");
    const pct = Math.round((n / sections.length) * 100);
    if (fill) fill.style.width = pct + "%";
    if (label) label.textContent = n + "/" + sections.length;
  }
  function __aoxInit(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }
  __aoxInit(() => {
    document.querySelectorAll(".mark-done").forEach((btn) => {
      btn.addEventListener("click", () => {
        const section = btn.closest("[data-section]");
        if (!section) return;
        const id = section.getAttribute("data-section");
        const done = load();
        if (done[id]) {
          delete done[id];
          btn.classList.remove("done");
          btn.textContent = "Mark done";
          btn.setAttribute("aria-pressed", "false");
        } else {
          done[id] = true;
          btn.classList.add("done");
          btn.textContent = "Done ✓";
          btn.setAttribute("aria-pressed", "true");
        }
        save(done);
        updateBar();
      });
    });
    updateBar();
  });
})();
