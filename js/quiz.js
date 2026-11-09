(function () {
  // Two-attempt quiz with spaced review (day 1/3/7/21). Data: window.CM_QUIZ
  const D = window.CM_QUIZ; if (!D) return;
  const KEY = "cm-" + D.key + "-quiz";
  const RKEY = "cm-review";
  const state = D.items.map(() => ({ tries: 0, first: null, done: false }));
  const root = document.getElementById("quiz");
  const L = "ABCD";
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  D.items.forEach((it, i) => {
    const q = el("div", "quiz-q"); q.id = "q" + (i + 1);
    const meta = el("div", "qmeta", '<span class="qnum">Question ' + (i + 1) + ' of ' + D.items.length + '</span>' + (it.safety ? '<span class="sc">safety-critical</span>' : ''));
    q.appendChild(meta);
    q.appendChild(el("h3", null, esc(it.q)));
    const opts = el("div", "quiz-options"); opts.setAttribute("role", "radiogroup");
    it.opts.forEach((o, j) => {
      const lab = el("label");
      lab.innerHTML = '<input type="radio" name="q' + i + '" value="' + j + '"><span><strong>' + L[j] + '.</strong> ' + esc(o) + '</span>';
      opts.appendChild(lab);
    });
    q.appendChild(opts);
    const btns = el("div", "qbtns");
    const check = el("button", "btn btn-primary", "Check"); check.type = "button";
    const reveal = el("button", "btn btn-ghost", "Reveal"); reveal.type = "button";
    btns.appendChild(check); btns.appendChild(reveal); q.appendChild(btns);
    const hint = el("div", "hint"); q.appendChild(hint);
    const ex = el("div", "quiz-explain"); q.appendChild(ex);
    root.appendChild(q);

    function finish(ok) {
      const st = state[i]; st.done = true;
      q.querySelectorAll("label").forEach((lab, j) => {
        if (j === it.c) lab.classList.add("correct-reveal");
      });
      ex.innerHTML = "<strong>Answer key:</strong> " + esc(it.explain) + (it.sec ? ' <a href="index.html#' + (it.sec ? 's' + it.sec : 'start') + '">Review section ' + it.sec + '</a>' : ' <a href="index.html#start">Review the opening</a>');
      ex.classList.add("show"); hint.classList.remove("show");
      q.classList.add(ok ? "done-ok" : "done-miss");
      q.querySelectorAll("input").forEach(x => x.disabled = true);
      check.disabled = true; reveal.disabled = true;
      if (!st.first) addReview(i);
    }
    check.addEventListener("click", () => {
      const st = state[i]; if (st.done) return;
      const ch = q.querySelector("input:checked");
      if (!ch) { hint.textContent = "Pick an answer first."; hint.classList.add("show"); return; }
      const v = +ch.value; st.tries++;
      const ok = v === it.c;
      if (st.tries === 1) st.first = ok;
      if (ok) { finish(true); return; }
      ch.closest("label").classList.add("wrong-reveal");
      if (st.tries === 1) {
        hint.innerHTML = "Not yet. Hint: re-read " + (it.sec ? '<a href="index.html#s' + it.sec + '">section ' + it.sec + '</a>' : '<a href="index.html#start">the opening section</a>') + " and try once more.";
        hint.classList.add("show");
      } else { finish(false); }
    });
    reveal.addEventListener("click", () => { const st = state[i]; if (st.done) return; if (st.first === null) st.first = false; finish(false); });
  });

  function addReview(i) {
    let r = {}; try { r = JSON.parse(localStorage.getItem(RKEY) || "{}"); } catch (_) {}
    const id = D.key + "-" + (i + 1); const now = Date.now(); const day = 864e5;
    r[id] = { m: D.module, title: D.title, q: D.items[i].q, url: location.pathname, due: [1, 3, 7, 21].map(d => now + d * day), added: now };
    try { localStorage.setItem(RKEY, JSON.stringify(r)); } catch (_) {}
  }
  function showReview() {
    const box = document.getElementById("review-queue"); if (!box) return;
    let r = {}; try { r = JSON.parse(localStorage.getItem(RKEY) || "{}"); } catch (_) {}
    const now = Date.now(); const due = [];
    Object.keys(r).forEach(k => { const x = r[k]; const next = (x.due || []).find(t => t > now - 864e5 && t <= now + 864e5 * 0.5); if (next) due.push(x); });
    if (!due.length) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = "<h2>Spaced review due today (" + due.length + ")</h2><p class='muted'>Misses come back on day 1, 3, 7 and 21. Answer these from memory first.</p><ul>" +
      due.map(x => "<li>Module " + x.m + ": " + esc(x.q) + " — <a href='" + esc(x.url) + "'>open quiz</a></li>").join("") + "</ul>";
  }

  document.getElementById("grade-quiz").addEventListener("click", () => {
    let first = 0, safetyOk = true, answered = 0;
    state.forEach((s, i) => { if (s.first) first++; if (s.first !== null) answered++; if (D.items[i].safety && !s.first) safetyOk = false; });
    const res = document.getElementById("quiz-result");
    document.getElementById("score-big").textContent = first + " / " + D.items.length;
    const pass = first >= 10 && safetyOk && answered === D.items.length;
    let msg;
    if (answered < D.items.length) msg = "Answer all " + D.items.length + " questions first (" + answered + " done).";
    else if (pass) msg = "PASS — every safety-critical item right first time. Now do the teach-back and rehearse the protocol on a model.";
    else if (!safetyOk) msg = "Not yet — a safety-critical item was missed. Review those sections; misses are queued for day 1/3/7/21 review.";
    else msg = "Not yet — aim for 10/12 on first attempts. Misses are queued for spaced review.";
    document.getElementById("score-msg").textContent = msg;
    res.classList.add("show");
    try { localStorage.setItem(KEY, JSON.stringify({ first, total: D.items.length, pass, at: Date.now() })); } catch (_) {}
    res.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  document.getElementById("reset-quiz").addEventListener("click", () => location.reload());
  showReview();
})();
