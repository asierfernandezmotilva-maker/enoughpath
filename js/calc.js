/* Calculadoras FIRE y coast FIRE: resultados, tabla y gráfico SVG. tools/generar.js usa las mismas funciones para dejar
   el ejemplo ya calculado en el HTML; en el navegador solo se repinta al cambiar un dato o si la URL trae un escenario (#...). */
(function (root, f) { if (typeof module === "object") module.exports = f(require("./engine.js")); else root.EP_CALC = f(root.EP_ENGINE); })(this, function (E) {
  var DEFAULTS = {
    fire: { v: "fire", lean: 25000, fire: 40000, fat: 100000, p: 100000, s: 25000, age: 35, wr: 4, mode: "real", real: 5, nom: 7, inf: 3 },
    coast: { age: 35, ret: 65, spend: 40000, wr: 4, p: 100000, s: 15000, mode: "real", real: 5, nom: 7, inf: 3 }
  };
  var CHOICES = { v: ["lean", "fire", "fat"], mode: ["real", "nominal"] };
  var NAME = { lean: "Lean FIRE", fire: "FIRE", fat: "Fat FIRE" };

  function num(s) { var n = parseFloat(String(s).replace(/[^0-9.\-]/g, "")); return isFinite(n) && n > 0 ? n : 0; }
  function usd(n) { return isFinite(n) ? "$" + Math.round(n).toLocaleString("en-US") : "—"; }
  function short(n) { return n >= 1e6 ? "$" + +(n / 1e6).toFixed(2) + "M" : n >= 1e3 ? "$" + Math.round(n / 1e3) + "k" : "$" + Math.round(n); }
  function pct(r) { return (r * 100).toFixed(2).replace(/\.?0+$/, "") + "%"; }
  function yrs(n) { return n.toFixed(1) + (n.toFixed(1) === "1.0" ? " year" : " years"); }
  function rate(v) { return v.mode === "nominal" ? E.realRate(v.nom / 100, v.inf / 100) : v.real / 100; }
  function rateNote(v) {
    return v.mode === "nominal" ? "Real return used: <b>" + pct(rate(v)) + "</b> = (1 + " + pct(v.nom / 100) + ") ÷ (1 + " + pct(v.inf / 100) + ") − 1."
      : "Real return used: <b>" + pct(rate(v)) + "</b> a year after inflation.";
  }

  // ---------- Gráfico: líneas de cartera frente a objetivos, eje x en años de edad ----------
  function niceStep(raw) { var p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }
  function chart(o) {
    var W = 520, H = 300, L = 54, R = 10, T = 14, B = 32, pw = W - L - R, ph = H - T - B, s = [];
    var X = function (x) { return (L + (x - o.x0) / (o.x1 - o.x0) * pw).toFixed(1); }, Y = function (y) { return (T + ph - Math.min(y, o.ymax) / o.ymax * ph).toFixed(1); };
    var step = niceStep(o.ymax / 4), xs = o.xstep || (o.x1 - o.x0 > 30 ? 10 : 5), xf = o.xfmt || String;
    for (var y = 0; y <= o.ymax; y += step) s.push('<line class="g" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(y) + '" y2="' + Y(y) + '"/><text class="tk" x="' + (L - 6) + '" y="' + (+Y(y) + 5) + '" text-anchor="end">' + short(y) + "</text>");
    for (var x = Math.ceil(o.x0 / xs) * xs; x <= o.x1; x += xs) s.push('<text class="tk" x="' + X(x) + '" y="' + (H - 10) + '" text-anchor="middle">' + xf(x) + "</text>");
    var line = function (pts) { return pts.map(function (p, i) { return (i ? "L" : "M") + X(p[0]) + " " + Y(p[1]); }).join(""); };
    var a = o.lines[0].pts;
    if (o.area !== false) s.push('<path class="area" d="' + line(a) + "L" + X(a[a.length - 1][0]) + " " + Y(0) + "L" + X(a[0][0]) + " " + Y(0) + 'Z"/>');
    o.hl.forEach(function (h) { if (h.y > o.ymax) return; s.push('<line class="hl ' + h.cls + '" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(h.y) + '" y2="' + Y(h.y) + '"/><text class="hlt ' + h.cls + '" x="' + (L + 6) + '" y="' + (+Y(h.y) - 6) + '">' + h.label + "</text>"); });
    o.lines.forEach(function (l) { s.push('<path class="ln ' + l.cls + '" d="' + line(l.pts) + '"/>'); });
    // Etiqueta al final de la línea (gráficos de los artículos con varias líneas)
    o.lines.forEach(function (l) { if (!l.label) return; var p = l.pts[l.pts.length - 1]; s.push('<text class="lnt" x="' + (+X(p[0]) - 4) + '" y="' + (+Y(p[1]) - 8) + '" text-anchor="end">' + l.label + "</text>"); });
    // Hito: placa verde con la edad, como un poste kilométrico, sobre el punto donde la cartera cruza el objetivo
    o.marks.forEach(function (m) {
      if (!(m.x <= o.x1)) return;
      var cx = Math.min(Math.max(+X(m.x), L + 28), W - R - 28), cy = Math.max(+Y(m.y) - 34, T + 2);
      s.push('<circle class="pt" cx="' + X(m.x) + '" cy="' + Y(m.y) + '" r="5"/><rect class="mk" x="' + (cx - 28) + '" y="' + cy + '" width="56" height="26" rx="4"/><text class="mkt" x="' + cx + '" y="' + (cy + 19) + '" text-anchor="middle">' + m.label + "</text>");
    });
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-labelledby="' + o.id + "-t " + o.id + '-d"><title id="' + o.id + '-t">' + o.title + '</title><desc id="' + o.id + '-d">' + o.desc + "</desc>" + s.join("") + "</svg>";
  }
  function dataTable(rows, head) {
    return "<details><summary>Chart data</summary><table class=\"t\"><thead><tr>" + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></details>";
  }
  function sign(tab, dest, big, dist, fine) {
    return '<span class="tab">' + tab + '</span><div class="panel"><p class="dest">' + dest + '</p><p class="big">' + big + '</p><p class="dist">' + dist + '</p><p class="fine">' + fine + "</p></div>";
  }

  // ---------- FIRE (lean / regular / fat con los mismos supuestos) ----------
  function fire(v) {
    var r = rate(v), rows = {};
    CHOICES.v.forEach(function (k) { var t = E.fireNumber(v[k], v.wr / 100), n = E.yearsToTarget(v.p, v.s, r, t); rows[k] = { spend: v[k], target: t, years: n, age: v.age + n }; });
    var toCoast = 65 - v.age, coast = toCoast > 0 ? E.coastNumber(rows.fire.target, r, toCoast) : NaN, cy = toCoast > 0 ? E.yearsToCoast(v.p, v.s, r, rows.fire.target, toCoast) : NaN;
    return { r: r, rows: rows, sel: rows[v.v], coast: coast, coastYears: cy };
  }
  function fireHTML(v) {
    var f = fire(v), s = f.sel, ok = isFinite(s.years);
    var fine = v.mode === "nominal" && ok ? "In future dollars, with " + pct(v.inf / 100) + " inflation, that is " + usd(E.futureDollars(s.target, v.inf / 100, s.years)) + " when you get there."
      : "Amounts are in today's dollars.";
    var dist = !isFinite(s.target) ? "Enter a withdrawal rate above 0%." : usd(s.spend) + " a year ÷ " + pct(v.wr / 100) + " withdrawal rate. " +
      (s.years === 0 ? "Your portfolio is already there." : ok ? "At your saving rate you reach it in " + yrs(s.years) + "." : "At these numbers your portfolio never gets there. Try a lower budget, a higher saving or another return to see what moves it.");
    var tab = ok ? "Age " + s.age.toFixed(1) : "Not reached";
    // Gráfico: hasta 4 años después del objetivo elegido (mín. 10, máx. 60)
    var H = ok ? Math.min(60, Math.max(10, Math.ceil(s.years) + 4)) : 40, pts = [];
    for (var t = 0; t <= H; t++) pts.push([v.age + t, E.balance(v.p, v.s, f.r, t)]);
    var top = Math.max(pts[H][1], isFinite(s.target) ? s.target : 0, 1) * 1.1;
    var hl = CHOICES.v.filter(function (k) { return isFinite(f.rows[k].target); }).map(function (k) { return { y: f.rows[k].target, label: NAME[k] + " " + short(f.rows[k].target), cls: k === v.v ? "on" : "" }; });
    var marks = CHOICES.v.filter(function (k) { return isFinite(f.rows[k].years) && f.rows[k].target <= top; }).map(function (k) { return { x: f.rows[k].age, y: f.rows[k].target, label: f.rows[k].age.toFixed(1) }; });
    var row = function (k) { var x = f.rows[k]; return "<tr" + (k === v.v ? ' class="on"' : "") + "><th scope=\"row\">" + NAME[k] + "</th><td>" + usd(x.spend) + "</td><td>" + usd(x.target) + "</td><td>" + (isFinite(x.years) ? yrs(x.years) : "Not reached") + "</td><td>" + (isFinite(x.years) ? x.age.toFixed(1) : "—") + "</td></tr>"; };
    var coastRow = isFinite(f.coast) ? '<tr><th scope="row"><a href="/calculators/coast-fire-calculator/">Coast FIRE</a> by 65</th><td>' + usd(v.fire) + "</td><td>" + usd(f.coast) + " today</td><td>" + (isFinite(f.coastYears) ? yrs(f.coastYears) : "Not before 65") + "</td><td>" + (isFinite(f.coastYears) ? (v.age + f.coastYears).toFixed(1) : "—") + "</td></tr>" : "";
    return {
      sign: sign(tab, NAME[v.v] + " number", usd(s.target), dist, fine),
      table: '<table class="t goals"><thead><tr><th scope="col">Goal</th><th scope="col">Spending a year</th><th scope="col">Portfolio needed</th><th scope="col">Reached in</th><th scope="col">Age</th></tr></thead><tbody>' + CHOICES.v.map(row).join("") + coastRow + "</tbody></table>",
      chart: chart({ id: "fc", x0: v.age, x1: v.age + H, ymax: top, lines: [{ pts: pts, cls: "you" }], hl: hl, marks: marks,
        title: "Portfolio growth from age " + v.age + " to " + (v.age + H) + " against the lean, regular and fat FIRE numbers",
        desc: ok ? "The portfolio reaches the " + NAME[v.v] + " number of " + usd(s.target) + " at age " + s.age.toFixed(1) + "." : "The portfolio does not reach the " + NAME[v.v] + " number." }),
      data: dataTable(pts.filter(function (p, i) { return i % 5 === 0 || i === H; }).map(function (p) { return [p[0], usd(p[1])]; }), ["Age", "Portfolio (today's dollars)"]),
      note: rateNote(v)
    };
  }

  // ---------- Coast FIRE ----------
  function coast(v) {
    var r = rate(v), F = E.fireNumber(v.spend, v.wr / 100), N = Math.max(0, v.ret - v.age), C = E.coastNumber(F, r, N);
    return { r: r, F: F, N: N, coast: C, years: E.yearsToCoast(v.p, v.s, r, F, N), share: C > 0 ? v.p / C : 0 };
  }
  function coastHTML(v) {
    var c = coast(v), ok = isFinite(c.coast) && c.N > 0, done = ok && c.years === 0, reach = ok && isFinite(c.years);
    var tab = !ok ? "Not set" : done ? "Reached" : reach ? "Age " + (v.age + c.years).toFixed(1) : "Not before " + v.ret;
    var dist = !isFinite(c.F) ? "Enter a withdrawal rate above 0%." : c.N <= 0 ? "Set a retirement age above your age." :
      "Grows to your FIRE number of " + usd(c.F) + " by age " + v.ret + " with no more saving, at " + pct(c.r) + " a year after inflation.";
    var fine = !ok ? "Amounts are in today's dollars." : done ? "You have " + usd(v.p) + ": you are already there." :
      "You have " + Math.floor(c.share * 100) + "% of it. " + (reach ? "Saving " + usd(v.s) + " a year you get there in " + yrs(c.years) + "." : "Saving " + usd(v.s) + " a year you do not get there before " + v.ret + ". Raise your saving or push back the retirement age to see when you would.");
    var pts = [], need = [], tc = reach ? c.years : Infinity;
    for (var t = 0; t <= c.N; t++) {
      var bal = t <= tc ? E.balance(v.p, v.s, c.r, t) : E.balance(E.balance(v.p, v.s, c.r, tc), 0, c.r, t - tc);
      pts.push([v.age + t, bal]); need.push([v.age + t, E.coastNumber(c.F, c.r, c.N - t)]);
    }
    if (reach && tc % 1) { // punto exacto del cruce para que la línea pase por la placa
      var i = Math.ceil(tc); pts.splice(i, 0, [v.age + tc, E.balance(v.p, v.s, c.r, tc)]); need.splice(i, 0, [v.age + tc, E.coastNumber(c.F, c.r, c.N - tc)]);
    }
    var top = ok ? Math.max(c.F, pts[pts.length - 1][1]) * 1.1 : 1;
    var ages = []; for (var a = 25; a < v.ret; a += 5) ages.push(a);
    return {
      sign: sign(tab, "Coast FIRE number today", ok ? usd(c.coast) : "—", dist, fine),
      table: ok ? '<table class="t"><thead><tr><th scope="col">Age now</th><th scope="col">Years to ' + v.ret + '</th><th scope="col">Coast FIRE number</th></tr></thead><tbody>' +
        ages.map(function (a) { return "<tr" + (a === v.age ? ' class="on"' : "") + '><th scope="row">' + a + "</th><td>" + (v.ret - a) + "</td><td>" + usd(E.coastNumber(c.F, c.r, v.ret - a)) + "</td></tr>"; }).join("") + "</tbody></table>" : "",
      chart: ok ? chart({ id: "cc", x0: v.age, x1: v.ret, ymax: top, lines: [{ pts: pts, cls: "you" }, { pts: need, cls: "need" }],
        hl: [{ y: c.F, label: "FIRE number " + short(c.F), cls: "on" }], marks: reach && !done ? [{ x: v.age + tc, y: E.balance(v.p, v.s, c.r, tc), label: (v.age + tc).toFixed(1) }] : [],
        title: "Your portfolio and the coast FIRE number from age " + v.age + " to " + v.ret,
        desc: reach ? "Saving until age " + (v.age + tc).toFixed(1) + ", then letting the portfolio grow, reaches " + usd(c.F) + " at " + v.ret + "." : "The coast FIRE number rises to " + usd(c.F) + " at age " + v.ret + "." }) : "",
      data: ok ? dataTable(pts.filter(function (p) { return p[0] % 5 === 0 || p[0] === v.ret; }).map(function (p, i) { return [+p[0].toFixed(1), usd(p[1]), usd(E.coastNumber(c.F, c.r, v.ret - p[0]))]; }), ["Age", "Your portfolio", "Coast FIRE number"]) : "",
      note: rateNote(v)
    };
  }

  // ---------- Escenario en la URL (#clave=valor&...) ----------
  function toHash(v, kind) { return "#" + Object.keys(DEFAULTS[kind]).map(function (k) { return k + "=" + encodeURIComponent(v[k]); }).join("&"); }
  function fromHash(h, kind) {
    var q = {}, out = {}; String(h).replace(/^#/, "").split("&").forEach(function (p) { var i = p.indexOf("="); if (i > 0) q[p.slice(0, i)] = decodeURIComponent(p.slice(i + 1)); });
    Object.keys(DEFAULTS[kind]).forEach(function (k) {
      var d = DEFAULTS[kind][k], x = q[k];
      out[k] = x == null ? d : CHOICES[k] ? (CHOICES[k].indexOf(x) >= 0 ? x : d) : /^\d+(\.\d+)?$/.test(x) ? +x : d;
    });
    return out;
  }
  function read(form, kind) { var out = {}; Object.keys(DEFAULTS[kind]).forEach(function (k) { out[k] = CHOICES[k] ? form.elements[k].value : num(form.elements[k].value); }); return out; }
  var HTML = { fire: fireHTML, coast: coastHTML };

  if (typeof document !== "undefined") Array.prototype.forEach.call(document.querySelectorAll("form[data-calc]"), function (f) {
    var kind = f.getAttribute("data-calc"), timer, sent = false;
    var render = function (v) { var h = HTML[kind](v); for (var k in h) { var el = document.getElementById(kind + "-" + k); if (el && el.innerHTML !== h[k]) el.innerHTML = h[k]; } };
    var write = function (v) { Object.keys(v).forEach(function (k) { var e = f.elements[k]; if (CHOICES[k]) Array.prototype.forEach.call(e, function (r) { r.checked = r.value === v[k]; }); else e.value = /^(p|s|lean|fire|fat|spend)$/.test(k) ? v[k].toLocaleString("en-US") : v[k]; }); };
    if (location.hash.length > 1) { var v0 = fromHash(location.hash, kind); write(v0); render(v0); }
    f.addEventListener("input", function () {
      var v = read(f, kind); render(v); clearTimeout(timer);
      timer = setTimeout(function () { try { history.replaceState(null, "", toHash(v, kind)); } catch (e) {} }, 400);
      if (!sent && typeof gtag === "function") { sent = true; gtag("event", "calculation_completed", { calculator: kind }); } // nunca los valores
    });
    f.addEventListener("submit", function (e) { e.preventDefault(); });
    f.addEventListener("reset", function () { setTimeout(function () { render(DEFAULTS[kind]); try { history.replaceState(null, "", location.pathname); } catch (e) {} }, 0); });
    var copy = f.querySelector("[data-copy]"), label = copy && copy.textContent, said = f.querySelector("[data-copied]");
    if (copy) copy.addEventListener("click", function () {
      var u = location.origin + location.pathname + toHash(read(f, kind), kind), done = function () { copy.textContent = "Link copied"; if (said) said.textContent = "Link copied. It holds only the numbers you entered."; setTimeout(function () { copy.textContent = label; }, 2000); };
      if (navigator.clipboard) navigator.clipboard.writeText(u).then(done, function () { prompt("Copy this link", u); }); else prompt("Copy this link", u);
    });
  });
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator && /^(https:|http:\/\/localhost)/.test(location.href)) navigator.serviceWorker.register("/sw.js").catch(function () {});

  return { chart: chart, short: short, DEFAULTS: DEFAULTS, num: num, usd: usd, pct: pct, yrs: yrs, rate: rate, fire: fire, fireHTML: fireHTML, coast: coast, coastHTML: coastHTML, toHash: toHash, fromHash: fromHash };
});
