/* Calculadoras FIRE y coast FIRE: resultados, tabla y gráfico SVG. tools/generar.js usa las mismas funciones para dejar
   el ejemplo ya calculado en el HTML; en el navegador solo se repinta al cambiar un dato o si la URL trae un escenario (#...). */
(function (root, f) { if (typeof module === "object") module.exports = f(require("./engine.js"), require("../lib/scf.js"), require("../lib/irs.js"), require("../lib/cpi.js")); else root.EP_CALC = f(root.EP_ENGINE, root.EP_SCF, root.EP_IRS, root.EP_CPI); })(this, function (E, SCF, IRS, CPI) {
  var DEFAULTS = {
    fire: { v: "fire", lean: 25000, fire: 40000, fat: 100000, p: 100000, s: 25000, age: 35, wr: 4, mode: "real", real: 5, nom: 7, inf: 3 },
    coast: { age: 35, ret: 65, spend: 40000, wr: 4, p: 100000, s: 15000, mode: "real", real: 5, nom: 7, inf: 3 },
    nw: { age: 35, nw: 150000 },
    last: { p: 1000000, w: 40000, age: 45, mode: "real", real: 3, nom: 6, inf: 3 },
    ci: { p: 10000, c: 500, rate: 7, t: 20, n: "12" },
    r72: { rate: 8, p: 10000 },
    nwc: { age: 35, cash: 15000, inv: 40000, ret: 90000, home: 350000, car: 20000, other: 0, mort: 250000, student: 20000, auto: 10000, cards: 3000, debt: 0 },
    ssb: { pia: 2000, a: 62, b: 67 },
    ef: { exp: 3000, m: "6", have: 5000, s: 500 },
    re: { age: 30, p: 50000, s: 30000, spend: 50000, wr: 3.5, mode: "real", real: 5, nom: 7, inf: 3 },
    bar: { age: 35, p: 150000, s: 20000, spend: 50000, inc: 25000, wr: 4, mode: "real", real: 5, nom: 7, inf: 3 },
    rmd: { age: 75, bal: 500000, rate: 5 },
    sepp: { age: 50, bal: 500000, rate: 5 },
    inf: { amt: 1000, from: 2000, to: 2025 },
    int: { p: 10000, rate: 5, t: 5 },
    inv: { p: 10000, c: 6000, g: 3, rate: 7, fee: 0.5, t: 25, inf: 3 },
    fv: { pv: 1000, rate: 5, n: 10, pmt: 100, due: "end" },
    apy: { apr: 5, cmp: "12", dep: 10000 }
  };
  var CHOICES = { v: ["lean", "fire", "fat"], mode: ["real", "nominal"], n: ["12", "1"], m: ["3", "6", "9", "12"], due: ["end", "begin"], cmp: ["1", "4", "12", "365", "cont"] };
  var NAME = { lean: "Lean FIRE", fire: "FIRE", fat: "Fat FIRE" };

  var SIGNED = { nw: 1 }; // el patrimonio puede ser negativo (más deudas que bienes)
  function snum(s) { var n = parseFloat(String(s).replace(/[^0-9.\-]/g, "")); return isFinite(n) ? n : 0; }
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
      out[k] = x == null ? d : CHOICES[k] ? (CHOICES[k].indexOf(x) >= 0 ? x : d) : (SIGNED[k] ? /^-?\d+(\.\d+)?$/ : /^\d+(\.\d+)?$/).test(x) ? +x : d;
    });
    return out;
  }
  function read(form, kind) { var out = {}; Object.keys(DEFAULTS[kind]).forEach(function (k) { out[k] = CHOICES[k] ? form.elements[k].value : SIGNED[k] ? snum(form.elements[k].value) : num(form.elements[k].value); }); return out; }
  // ---------- ¿Cuánto dura mi dinero? Rentabilidad fija y prueba con dos años malos al principio ----------
  var BAD = [-0.2, -0.1];
  function lastFor(v) { var r = rate(v); return { r: r, t: E.yearsLasts(v.p, v.w, r), ts: E.yearsOnPath(v.p, v.w, BAD.concat(Array(98).fill(r))) }; }
  function howLong(t) { return !isFinite(t) ? "Indefinitely" : t > 100 ? "More than 100 years" : yrs(t); }
  function lastHTML(v) {
    var L = lastFor(v), ok = v.w > 0 && v.p > 0, fin = isFinite(L.t) && L.t <= 100;
    var tab = !ok ? "Not set" : fin ? "Until about age " + Math.floor(v.age + L.t) : "Lasts";
    var dist = !ok ? (v.p > 0 ? "Enter how much you take out each year." : "Enter how much you have invested.") : usd(v.w) + " a year, " + pct(v.p > 0 ? v.w / v.p : 0) + " of " + usd(v.p) + ", with " + pct(L.r) + " a year after inflation.";
    var fine = !ok ? "Amounts are in today's dollars." : "If the first two years fall 20% and 10% and later years earn the same: " + howLong(L.ts).toLowerCase() + ".";
    var end = Math.max(isFinite(L.t) ? L.t : 0, isFinite(L.ts) ? L.ts : 0), H = Math.min(60, Math.max(10, Math.ceil(end) + 3));
    if (!isFinite(L.t) && !isFinite(L.ts)) H = 40;
    var a = E.withdrawPath(v.p, v.w, Array(H).fill(L.r)), b = E.withdrawPath(v.p, v.w, BAD.concat(Array(H).fill(L.r)).slice(0, H));
    var top = Math.max.apply(null, a.concat(b, [1])) * 1.1;
    var at = function (path, i) { return i < path.length ? usd(path[i]) : usd(0); };
    var rows = []; for (var i = 0; i <= H; i += 10) rows.push(i);
    return {
      sign: sign(tab, "Your money lasts", ok ? howLong(L.t) : "—", dist, fine),
      chart: chart({ id: "lc", x0: v.age, x1: v.age + H, ymax: top, area: false, lines: [{ pts: a.map(function (x, i) { return [v.age + i, x]; }), cls: "you" }, { pts: b.map(function (x, i) { return [v.age + i, x]; }), cls: "need" }], hl: [], marks: [],
        title: "Portfolio by age with a steady return and with two bad years first", desc: "With a steady return the money lasts " + howLong(L.t).toLowerCase() + "; with two bad years first, " + howLong(L.ts).toLowerCase() + "." }),
      table: '<table class="t"><thead><tr><th scope="col">After</th><th scope="col">Age</th><th scope="col">Steady return</th><th scope="col">Two bad years first</th></tr></thead><tbody>' +
        rows.map(function (i) { return '<tr><th scope="row">' + (i ? i + " years" : "Today") + "</th><td>" + (v.age + i) + "</td><td>" + at(a, i) + "</td><td>" + at(b, i) + "</td></tr>"; }).join("") + "</tbody></table>",
      data: "", note: rateNote(v)
    };
  }
  // ---------- Patrimonio por edad (SCF 2025 de la Reserva Federal) ----------
  var GROUPS = [["under-35", "under 35", 34], ["35-44", "35 to 44", 44], ["45-54", "45 to 54", 54], ["55-64", "55 to 64", 64], ["65-74", "65 to 74", 74], ["75-plus", "75 or older", Infinity]];
  function group(age) { for (var i = 0; i < GROUPS.length; i++) if (age <= GROUPS[i][2]) return GROUPS[i]; }
  function ordinal(n) { var t = n % 100, u = n % 10; return n + (t >= 11 && t <= 13 ? "th" : u === 1 ? "st" : u === 2 ? "nd" : u === 3 ? "rd" : "th"); }
  function rank(q) { return q <= 0 ? "Below the 1st" : q >= 100 ? "Above the 99th" : ordinal(Math.min(99, Math.max(1, Math.round(q)))); }
  function money(n) { return n < 0 ? "−" + usd(-n) : usd(n); }
  function nw(v) { var g = group(v.age), p = SCF.p[g[0]]; return { g: g, p: p, q: E.percentileOf(p, v.nw), all: E.percentileOf(SCF.p.all, v.nw), median: SCF.official.median[g[0]]["2025"] * 1000 }; }
  function nwHTML(v) {
    var r = nw(v), share = Math.min(99, Math.max(1, Math.round(r.q)));
    var dist = "Median for families headed by someone " + r.g[1] + ": " + usd(r.median) + ". The top 10% start at " + usd(r.p[89]) + ".";
    var fine = r.q <= 0 || r.q >= 100 ? "Among all US families: " + rank(r.all).toLowerCase() + " percentile." : "Higher than about " + share + "% of families your age. Among all US families: " + rank(r.all) + " percentile.";
    var rows = [[10, "10th"], [25, "25th"], [50, "50th (median)"], [75, "75th"], [90, "90th"], [95, "95th"], [99, "99th"]].map(function (x) { return [x[1], r.p[x[0] - 1], false]; });
    rows.push(["Your net worth", v.nw, true]); rows.sort(function (a, b) { return a[1] - b[1] || (a[2] ? 1 : -1); });
    var at = Math.min(100, Math.max(0, r.q));
    return {
      sign: sign(r.g[0] === "under-35" ? "Under 35" : "Ages " + r.g[1], "Your net worth percentile", rank(r.q), dist, fine),
      chart: '<div class="pbar" role="img" aria-label="Your net worth is at about the ' + rank(r.q) + ' percentile of families headed by someone ' + r.g[1] + '"><p><i class="med" style="left:50%"></i><b style="left:clamp(24px, ' + at.toFixed(1) + '%, calc(100% - 24px))">You</b></p><span>0</span><span>Median</span><span>100</span></div>',
      table: '<table class="t"><thead><tr><th scope="col">Percentile, ages ' + r.g[1] + '</th><th scope="col">Net worth (2025 dollars)</th><th scope="col">How far from you</th></tr></thead><tbody>' +
        rows.map(function (x) { var d = x[1] - v.nw; return "<tr" + (x[2] ? ' class="on"' : "") + '><th scope="row">' + x[0] + "</th><td>" + money(x[1]) + "</td><td>" + (x[2] ? "" : d > 0 ? usd(d) + " more" : "Reached") + "</td></tr>"; }).join("") + "</tbody></table>",
      data: "", note: ""
    };
  }
  // ---------- Oleada 3 ----------
  function tbl(head, rows) { return '<table class="t"><thead><tr>' + head.map(function (h) { return '<th scope="col">' + h + "</th>"; }).join("") + "</tr></thead><tbody>" + rows.map(function (r) { return "<tr" + (r.on ? ' class="on"' : "") + ">" + r.map(function (c, i) { return i ? "<td>" + c + "</td>" : '<th scope="row">' + c + "</th>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>"; }
  function onRow(r, on) { r.on = on; return r; }
  function bars(items) { var m = Math.max.apply(null, items.map(function (x) { return Math.abs(x[1]); }).concat([1])); return '<div class="bars">' + items.map(function (x) { return "<div><span>" + x[0] + '</span><p><i style="width:' + (Math.abs(x[1]) / m * 100).toFixed(1) + '%"><b>' + short(Math.abs(x[1])) + "</b></i></p></div>"; }).join("") + "</div>"; }

  // Interés compuesto: aportación mensual; con capitalización anual se aportan 12 meses de golpe al final del año
  function ci(v) { var n = +v.n, c = n === 1 ? v.c * 12 : v.c, r = v.rate / 100, at = function (t) { return E.compound(v.p, c, r, t, n); }; return { r: r, n: n, at: at, end: at(v.t), paid: v.p + v.c * 12 * Math.round(v.t) }; }
  function ciHTML(v) {
    var x = ci(v), T = Math.max(1, Math.round(v.t)), pts = [], put = [], rows = [];
    for (var t = 0; t <= T; t++) { pts.push([t, x.at(t)]); put.push([t, v.p + v.c * 12 * t]); }
    for (var y = 0; y <= T; y += T > 20 ? 10 : 5) rows.push(y); if (rows[rows.length - 1] !== T) rows.push(T);
    var gain = x.end - x.paid;
    return {
      sign: sign("After " + T + (T === 1 ? " year" : " years"), "Your balance", usd(x.end), "You put in " + usd(x.paid) + "; interest adds " + usd(gain) + ".", "At " + pct(x.r) + " a year, compounded " + (x.n === 12 ? "monthly" : "yearly") + ". Before taxes, fees and inflation."),
      chart: chart({ id: "ci", x0: 0, x1: T, ymax: Math.max(x.end, 1) * 1.1, lines: [{ pts: pts, cls: "you" }, { pts: put, cls: "need" }], hl: [], marks: [], title: "Balance and money put in over " + T + " years", desc: "The balance reaches " + usd(x.end) + " after " + T + " years, of which " + usd(x.paid) + " is money put in." }),
      table: tbl(["Year", "Money put in", "Interest earned", "Balance"], rows.map(function (y) { var b = x.at(y), p = v.p + v.c * 12 * y; return onRow([y, usd(p), usd(b - p), usd(b)], y === T); })),
      data: "", note: "Contributions are added at the end of each " + (x.n === 12 ? "month" : "year") + "."
    };
  }
  // Regla del 72 frente al cálculo exacto
  function r72HTML(v) {
    var r = v.rate / 100, ex = E.doubling(r), q = E.rule72(r), ok = r > 0, H = ok ? Math.min(80, Math.ceil(ex * 3)) : 30, pts = [];
    for (var t = 0; t <= H; t++) pts.push([t, v.p * Math.pow(1 + r, t)]);
    var marks = ok ? [1, 2, 3].map(function (k) { return { x: ex * k, y: v.p * Math.pow(2, k), label: (ex * k).toFixed(1) }; }) : [];
    return {
      sign: sign(ok ? "72 ÷ " + +v.rate.toFixed(2) : "Not set", "Your money doubles in about", ok ? yrs(q) : "—", ok ? "Exact answer: " + ex.toFixed(2) + " years, " + Math.abs(q - ex).toFixed(2) + (q >= ex ? " more" : " less") + " than the rule." : "Enter a return above 0%.", ok ? usd(v.p) + " becomes " + usd(2 * v.p) + " in " + yrs(ex) + " and " + usd(4 * v.p) + " in " + yrs(2 * ex) + ", compounding once a year." : "Amounts are before inflation unless you enter a return after inflation."),
      chart: chart({ id: "r72", x0: 0, x1: H, ymax: Math.max(pts[H][1], 1) * 1.1, lines: [{ pts: pts, cls: "you" }], hl: ok ? [{ y: 2 * v.p, label: "Doubled " + short(2 * v.p), cls: "on" }] : [], marks: marks, title: "Growth of " + usd(v.p) + " at " + pct(r) + " a year", desc: ok ? "It doubles every " + yrs(ex) + "." : "No growth." }),
      table: tbl(["Return a year", "Rule of 72", "Exact", "Difference"], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map(function (k) { var e = E.doubling(k / 100), g = 72 / k; return onRow([k + "%", yrs(g), yrs(e), (g - e >= 0 ? "+" : "−") + Math.abs(g - e).toFixed(2)], k === +v.rate); })),
      data: "", note: "Exact = ln 2 ÷ ln(1 + return), with one compounding a year."
    };
  }
  // Patrimonio neto con desglose y percentil de la SCF 2025
  var NWA = [["cash", "Cash and savings"], ["inv", "Investments"], ["ret", "Retirement accounts"], ["home", "Home"], ["car", "Vehicles"], ["other", "Other assets"]],
    NWL = [["mort", "Mortgage"], ["student", "Student loans"], ["auto", "Car loans"], ["cards", "Credit cards"], ["debt", "Other debts"]];
  function nwc(v) { var a = NWA.reduce(function (s, k) { return s + v[k[0]]; }, 0), l = NWL.reduce(function (s, k) { return s + v[k[0]]; }, 0); return { a: a, l: l, nw: a - l, rank: nw({ age: v.age, nw: a - l }) }; }
  function nwcHTML(v) {
    var x = nwc(v), r = x.rank;
    return {
      sign: sign(r.g[0] === "under-35" ? "Under 35" : "Ages " + r.g[1], "Your net worth", money(x.nw), usd(x.a) + " owned minus " + usd(x.l) + " owed.", rank(r.q) + " percentile among US families your age; the median is " + usd(r.median) + "."),
      chart: bars([["What you own", x.a], ["What you owe", x.l], ["Net worth", x.nw]]),
      table: tbl(["Item", "Amount"], NWA.map(function (k) { return [k[1], usd(v[k[0]])]; }).concat([onRow(["Total assets", usd(x.a)], true)], NWL.map(function (k) { return [k[1], usd(v[k[0]])]; }), [onRow(["Total debts", usd(x.l)], true), onRow(["Net worth", money(x.nw)], true)])),
      data: "", note: "Percentile from the Federal Reserve's 2025 Survey of Consumer Finances, by age of the head of the family."
    };
  }
  // Social Security: punto de equilibrio entre dos edades de cobro (edad completa 67, nacidos en 1960 o después)
  function ssMonthly(pia, age) { return pia * E.ssFactor(Math.round((age - 67) * 12)); }
  function ssb(v) { var a = Math.min(v.a, v.b), b = Math.max(v.a, v.b), ma = ssMonthly(v.pia, a), mb = ssMonthly(v.pia, b); return { a: a, b: b, ma: ma, mb: mb, be: mb > ma ? (b * mb - a * ma) / (mb - ma) : NaN }; }
  function ssbHTML(v) {
    var x = ssb(v), ok = v.pia > 0 && x.a >= 62 && x.b <= 70 && x.b > x.a && isFinite(x.be), cum = function (m, start, age) { return Math.max(0, age - start) * 12 * m; };
    var pa = [], pb = []; for (var age = 62; age <= 95; age++) { pa.push([age, cum(x.ma, x.a, age)]); pb.push([age, cum(x.mb, x.b, age)]); }
    return {
      sign: sign(ok ? x.a + " vs " + x.b : "Not set", "Break-even age", ok ? x.be.toFixed(1) : "—", ok ? "Claiming at " + x.b + " (" + usd(x.mb) + " a month) pays more in total than at " + x.a + " (" + usd(x.ma) + " a month) if you live past " + x.be.toFixed(1) + "." : "Enter your full benefit and two claiming ages from 62 to 70.", "Full retirement age 67, for anyone born in 1960 or later. Amounts in today's dollars."),
      chart: chart({ id: "ssb", x0: 62, x1: 95, ymax: Math.max(pa[33][1], pb[33][1], 1) * 1.1, area: false, lines: [{ pts: pa, cls: "need" }, { pts: pb, cls: "you" }], hl: [], marks: ok && x.be <= 95 ? [{ x: x.be, y: cum(x.mb, x.b, x.be), label: x.be.toFixed(1) }] : [], title: "Total benefits received by age, claiming at " + x.a + " and at " + x.b, desc: ok ? "The two totals meet at age " + x.be.toFixed(1) + "." : "" }),
      table: tbl(["Claim at", "Share of full benefit", "A month", "Total by 80", "Total by 90"], [62, 63, 64, 65, 66, 67, 68, 69, 70].map(function (age) { var m = ssMonthly(v.pia, age); return onRow([age, pct(E.ssFactor(Math.round((age - 67) * 12))), usd(m), usd(cum(m, age, 80)), usd(cum(m, age, 90))], age === x.a || age === x.b); })),
      data: "", note: "Reduction before 67: 5/9 of 1% a month for the first 36 months and 5/12 of 1% after that. Credits after 67: 2/3 of 1% a month up to 70."
    };
  }
  // Fondo de emergencia
  function efHTML(v) {
    var m = +v.m, need = v.exp * m, gap = Math.max(0, need - v.have), cover = v.exp > 0 ? v.have / v.exp : 0, months = gap === 0 ? 0 : v.s > 0 ? Math.ceil(gap / v.s) : Infinity;
    return {
      sign: sign(m + " months", "Your emergency fund target", usd(need), v.exp > 0 ? "You have " + usd(v.have) + ", enough for " + cover.toFixed(1) + " months of essential costs." : "Enter your essential costs a month.", gap === 0 ? "You have reached it." : isFinite(months) ? "Saving " + usd(v.s) + " a month, you reach it in " + months + (months === 1 ? " month." : " months.") : "Add a monthly saving amount to see when you reach it."),
      chart: bars([["You have", v.have], ["Target", need]]),
      table: tbl(["Months covered", "Target", "Still to save", "Time at your saving"], [3, 6, 9, 12].map(function (k) { var g = Math.max(0, v.exp * k - v.have), t = g === 0 ? 0 : v.s > 0 ? Math.ceil(g / v.s) : Infinity; return onRow([k + " months", usd(v.exp * k), usd(g), t === 0 ? "Reached" : isFinite(t) ? t + " months" : "—"], k === m); })),
      data: "", note: "Essential costs: housing, food, utilities, insurance, transport and minimum debt payments."
    };
  }
  // Jubilación anticipada: edad a la que llegas y años de puente hasta los 59½ y Social Security
  function re(v) { var r = rate(v), t = E.fireNumber(v.spend, v.wr / 100), n = E.yearsToTarget(v.p, v.s, r, t); return { r: r, target: t, years: n, age: v.age + n }; }
  function reHTML(v) {
    var x = re(v), ok = isFinite(x.years), H = ok ? Math.min(60, Math.max(10, Math.ceil(x.years) + 4)) : 40, pts = [];
    for (var t = 0; t <= H; t++) pts.push([v.age + t, E.balance(v.p, v.s, x.r, t)]);
    var bridge = ok ? Math.max(0, 59.5 - x.age) : NaN;
    return {
      sign: sign(ok ? "Age " + x.age.toFixed(1) : "Not reached", "You could retire at", ok ? x.age.toFixed(1) : "—", "When your portfolio reaches " + usd(x.target) + ": " + usd(v.spend) + " a year at a " + pct(v.wr / 100) + " withdrawal rate.", ok ? (bridge > 0 ? "That leaves " + yrs(bridge) + " before 59½, when retirement accounts open without the 10% additional tax." : "You would be past 59½ by then.") : "At these numbers the portfolio never gets there. Try a higher saving or a lower budget."),
      chart: chart({ id: "re", x0: v.age, x1: v.age + H, ymax: Math.max(pts[H][1], x.target, 1) * 1.1, lines: [{ pts: pts, cls: "you" }], hl: [{ y: x.target, label: "Target " + short(x.target), cls: "on" }], marks: ok ? [{ x: x.age, y: x.target, label: x.age.toFixed(1) }] : [], title: "Portfolio growth from age " + v.age + " against the early retirement target", desc: ok ? "The portfolio reaches " + usd(x.target) + " at age " + x.age.toFixed(1) + "." : "The portfolio does not reach the target." }),
      table: tbl(["Saving a year", "Retire at", "Years before 59½", "Years before 62"], [0.5, 1, 1.5, 2].map(function (k) { var n = E.yearsToTarget(v.p, v.s * k, x.r, x.target), a = v.age + n; return onRow([usd(v.s * k), isFinite(n) ? a.toFixed(1) : "Not reached", isFinite(n) ? Math.max(0, 59.5 - a).toFixed(1) : "—", isFinite(n) ? Math.max(0, 62 - a).toFixed(1) : "—"], k === 1); })),
      data: "", note: rateNote(v)
    };
  }
  // Barista FIRE: la cartera paga el gasto menos el ingreso a tiempo parcial
  function bar(v) { var r = rate(v), t = E.baristaNumber(v.spend, v.inc, v.wr / 100), n = E.yearsToTarget(v.p, v.s, r, t), full = E.fireNumber(v.spend, v.wr / 100); return { r: r, target: t, years: n, age: v.age + n, full: full, fullYears: E.yearsToTarget(v.p, v.s, r, full) }; }
  function barHTML(v) {
    var x = bar(v), ok = isFinite(x.years), H = ok ? Math.min(60, Math.max(10, Math.ceil(isFinite(x.fullYears) ? x.fullYears : x.years) + 4)) : 40, pts = [];
    for (var t = 0; t <= H; t++) pts.push([v.age + t, E.balance(v.p, v.s, x.r, t)]);
    var marks = [[x.years, x.target], [x.fullYears, x.full]].filter(function (m) { return isFinite(m[0]) && m[0] <= H; }).map(function (m) { return { x: v.age + m[0], y: m[1], label: (v.age + m[0]).toFixed(1) }; });
    return {
      sign: sign(ok ? "Age " + x.age.toFixed(1) : "Not reached", "Barista FIRE number", usd(x.target), "(" + usd(v.spend) + " − " + usd(v.inc) + " part-time income) ÷ " + pct(v.wr / 100) + ".", ok ? "You reach it at " + x.age.toFixed(1) + (isFinite(x.fullYears) ? ", " + yrs(x.fullYears - x.years) + " before full FIRE at " + (v.age + x.fullYears).toFixed(1) + "." : ".") : "At these numbers the portfolio never gets there."),
      chart: chart({ id: "bar", x0: v.age, x1: v.age + H, ymax: Math.max(pts[H][1], x.full, 1) * 1.1, lines: [{ pts: pts, cls: "you" }], hl: [{ y: x.target, label: "Barista " + short(x.target), cls: "on" }, { y: x.full, label: "Full FIRE " + short(x.full), cls: "" }], marks: marks, title: "Portfolio growth against the barista and full FIRE numbers", desc: ok ? "Barista FIRE at " + x.age.toFixed(1) + "." : "" }),
      table: tbl(["Part-time income a year", "Portfolio needed", "Reached at"], [0, 10000, 20000, 30000, 40000].concat(v.inc).filter(function (k, i, a) { return a.indexOf(k) === i && k < v.spend; }).sort(function (a, b) { return a - b; }).map(function (k) { var tg = E.baristaNumber(v.spend, k, v.wr / 100), n = E.yearsToTarget(v.p, v.s, x.r, tg); return onRow([usd(k), usd(tg), isFinite(n) ? (v.age + n).toFixed(1) : "Not reached"], k === v.inc); })),
      data: "", note: rateNote(v)
    };
  }
  // RMD: saldo a 31 de diciembre ÷ divisor de la Uniform Lifetime Table (IRS Pub. 590-B, apéndice B, tabla III)
  function div(table, age) { return table[String(Math.min(Math.round(age), 120))]; }
  function rmdHTML(v) {
    var ok = v.age >= 72 && v.bal > 0, d = ok ? div(IRS.uniform, v.age) : NaN, amt = v.bal / d, r = v.rate / 100, rows = [], b = v.bal, pts = [];
    for (var a = Math.round(v.age), i = 0; ok && i <= 20 && a <= 120; a++, i++) { var dd = div(IRS.uniform, a), m = b / dd; pts.push([a, b]); if (i % 2 === 0 || i < 5) rows.push(onRow([a, dd.toFixed(1), usd(b), usd(m), pct(m / b)], i === 0)); b = (b - m) * (1 + r); }
    return {
      sign: sign(ok ? "Age " + Math.round(v.age) : "Not set", "Required minimum distribution", ok ? usd(amt) : "—", ok ? usd(v.bal) + " ÷ " + d.toFixed(1) + ", the IRS divisor for age " + Math.round(v.age) + "." : "The IRS table starts at age 72. RMDs begin at 73, or 75 depending on your date of birth.", ok ? "That is " + pct(amt / v.bal) + " of the balance this year; the share rises every year." : "Use the balance on December 31 of last year."),
      chart: ok ? chart({ id: "rmd", x0: pts[0][0], x1: pts[pts.length - 1][0], ymax: Math.max.apply(null, pts.map(function (p) { return p[1]; }).concat([1])) * 1.1, lines: [{ pts: pts, cls: "you" }], hl: [], marks: [], title: "Account balance taking only the RMD each year", desc: "With " + pct(r) + " growth a year after each withdrawal." }) : "",
      table: ok ? tbl(["Age", "IRS divisor", "Balance on Dec 31 before", "RMD", "Share"], rows) : "",
      data: "", note: "Balance projected at " + pct(r) + " a year after each RMD, for illustration. Spouses more than 10 years younger use a different IRS table."
    };
  }
  // 72(t): métodos de RMD y de amortización fija (IRS Notice 2022-6), con la esperanza de vida de la Single Life Table
  function seppHTML(v) {
    var ok = v.age >= 1 && v.age < 59.5 && v.bal > 0, le = ok ? div(IRS.single, v.age) : NaN, r = v.rate / 100, am = E.amortPayment(v.bal, r, le), rm = v.bal / le, years = Math.max(5, 59.5 - v.age);
    return {
      sign: sign(ok ? "Age " + v.age : "Not set", "Fixed amortization payment", ok ? usd(am) + " a year" : "—", ok ? "RMD method: " + usd(rm) + " in the first year, recalculated each year. Life expectancy used: " + le.toFixed(1) + " years." : "72(t) payments are for withdrawals before 59½. Enter an age under 59½.", ok ? "Payments must continue for " + yrs(years) + ", until " + (v.age + years).toFixed(1) + ". Changing them earlier brings back the 10% tax on past payments, plus interest." : "Single Life Expectancy Table, IRS Publication 590-B."),
      chart: ok ? bars([["Amortization", am], ["RMD method", rm]]) : "",
      table: ok ? tbl(["Interest rate", "Amortization a year", "A month"], [3, 4, 5, 6].concat(v.rate).filter(function (k, i, a) { return a.indexOf(k) === i; }).sort(function (a, b) { return a - b; }).map(function (k) { var p = E.amortPayment(v.bal, k / 100, le); return onRow([pct(k / 100), usd(p), usd(p / 12)], k === v.rate); })) : "",
      data: "", note: "Illustration only. The rate may not exceed the greater of 5% or 120% of the federal mid-term rate for either of the two months before the first payment."
    };
  }
  // Inflación: índice CPI-U de la BLS, media anual
  function infHTML(v) {
    var A = CPI.annual, y0 = Math.round(v.from), y1 = Math.round(v.to), ok = A[y0] && A[y1] && v.amt > 0, val = ok ? v.amt * A[y1] / A[y0] : NaN, n = y1 - y0;
    var cum = ok ? A[y1] / A[y0] - 1 : NaN, avg = ok && n ? Math.pow(A[y1] / A[y0], 1 / n) - 1 : 0, pts = [], lo = Math.min(y0, y1), hi = Math.max(y0, y1);
    for (var y = lo; ok && y <= hi; y++) pts.push([y, v.amt * A[y] / A[y0]]);
    var step = hi - lo > 40 ? 10 : 5, rows = []; for (var yy = Math.ceil(lo / step) * step; ok && yy <= hi; yy += step) rows.push(yy); if (ok && rows.indexOf(hi) < 0) rows.push(hi);
    return {
      sign: sign(ok ? y0 + " → " + y1 : "Not set", usd(v.amt) + " in " + y0 + " equals", ok ? usd(val) : "—", ok ? "Prices " + (cum >= 0 ? "rose " : "fell ") + pct(Math.abs(cum)) + " in total" + (n ? ", " + pct(Math.abs(avg)) + " a year on average." : ".") : "Enter years from " + CPI.first + " to " + CPI.last + ".", "US consumer price index (CPI-U), annual averages from the Bureau of Labor Statistics."),
      chart: ok && pts.length > 1 ? chart({ id: "inf", x0: lo, x1: hi, xstep: hi - lo > 40 ? 20 : hi - lo > 15 ? 5 : 2, ymax: Math.max.apply(null, pts.map(function (p) { return p[1]; }).concat([1])) * 1.1, lines: [{ pts: pts, cls: "you" }], hl: [], marks: [], title: "What " + usd(v.amt) + " of " + y0 + " is worth in each year's dollars", desc: ok ? usd(v.amt) + " in " + y0 + " is " + usd(val) + " in " + y1 + "." : "" }) : "",
      table: ok ? tbl(["Year", "CPI-U", "Same buying power"], rows.map(function (y) { return onRow([y, A[y].toFixed(1), usd(v.amt * A[y] / A[y0])], y === y1); })) : "",
      data: "", note: "Latest monthly figure: " + CPI.latest.value + " (" + CPI.latest.period + ")."
    };
  }
  // Interés simple frente a compuesto
  function intHTML(v) {
    var r = v.rate / 100, T = Math.max(1, Math.round(v.t)), si = E.simpleInterest(v.p, r, v.t), ciy = E.compound(v.p, 0, r, v.t, 1) - v.p, a = [], b = [];
    for (var t = 0; t <= T; t++) { a.push([t, v.p + E.simpleInterest(v.p, r, t)]); b.push([t, E.compound(v.p, 0, r, t, 1)]); }
    return {
      sign: sign(T + (T === 1 ? " year" : " years"), "Simple interest", usd(si), usd(v.p) + " × " + pct(r) + " × " + +v.t + (v.t === 1 ? " year" : " years") + " = " + usd(si) + ", for a total of " + usd(v.p + si) + ".", "Compounded yearly instead, the interest would be " + usd(ciy) + ", " + usd(ciy - si) + " more."),
      chart: chart({ id: "int", x0: 0, x1: T, ymax: Math.max(b[T][1], 1) * 1.1, area: false, lines: [{ pts: a, cls: "you" }, { pts: b, cls: "need" }], hl: [], marks: [], title: "Balance with simple and with compound interest", desc: "After " + T + " years: " + usd(a[T][1]) + " with simple interest and " + usd(b[T][1]) + " compounded yearly." }),
      table: tbl(["Year", "Simple interest", "Balance", "Compounded yearly"], a.filter(function (x, i) { return T <= 10 || i % 5 === 0 || i === T; }).map(function (x) { return onRow([x[0], usd(x[1] - v.p), usd(x[1]), usd(b[x[0]][1])], x[0] === T); })),
      data: "", note: "Simple interest is paid on the original amount only. Black line: simple; grey dashed: compounded yearly."
    };
  }
  // Inversión con aportación que sube cada año, comisión y resultado en dólares de hoy
  function inv(v) { var T = Math.max(1, Math.round(v.t)), r = v.rate / 100, path = E.invest(v.p, v.c, v.g / 100, r, v.fee / 100, T), noFee = E.invest(v.p, v.c, v.g / 100, r, 0, T), put = v.p; for (var t = 1; t <= T; t++) put += v.c * Math.pow(1 + v.g / 100, t - 1); return { T: T, path: path, end: path[T], real: path[T] / Math.pow(1 + v.inf / 100, T), put: put, feeCost: noFee[T] - path[T] }; }
  function invHTML(v) {
    var x = inv(v), put = [], acc = v.p; put.push([0, v.p]); for (var t = 1; t <= x.T; t++) { acc += v.c * Math.pow(1 + v.g / 100, t - 1); put.push([t, acc]); }
    var rows = []; for (var y = 0; y <= x.T; y += x.T > 20 ? 5 : x.T > 10 ? 2 : 1) rows.push(y); if (rows[rows.length - 1] !== x.T) rows.push(x.T);
    return {
      sign: sign("After " + x.T + " years", "Your investment", usd(x.end), "You put in " + usd(x.put) + "; growth adds " + usd(x.end - x.put) + ". In today's dollars: " + usd(x.real) + ".", "Fees of " + pct(v.fee / 100) + " a year cost " + usd(x.feeCost) + " over the period."),
      chart: chart({ id: "inv", x0: 0, x1: x.T, ymax: Math.max(x.end, 1) * 1.1, lines: [{ pts: x.path.map(function (b, i) { return [i, b]; }), cls: "you" }, { pts: put, cls: "need" }], hl: [], marks: [], title: "Investment balance and money put in", desc: "The balance reaches " + usd(x.end) + " after " + x.T + " years." }),
      table: tbl(["Year", "Money put in", "Balance", "In today's dollars"], rows.map(function (y) { return onRow([y, usd(put[y][1]), usd(x.path[y]), usd(x.path[y] / Math.pow(1 + v.inf / 100, y))], y === x.T); })),
      data: "", note: "Contributions are added at the end of each year and rise by " + pct(v.g / 100) + " a year. The return is before inflation; fees come out of it."
    };
  }
  // Valor futuro de una cantidad y de pagos periódicos
  function fvHTML(v) {
    var r = v.rate / 100, n = Math.max(0, Math.round(v.n)), due = v.due === "begin", tot = E.fv(v.pv, r, n, v.pmt, due), a = E.fv(v.pv, r, n, 0, false), pts = [];
    for (var t = 0; t <= n; t++) pts.push([t, E.fv(v.pv, r, t, v.pmt, due)]);
    return {
      sign: sign(n + " periods", "Future value", usd(tot), "The lump sum grows to " + usd(a) + " and the payments to " + usd(tot - a) + ".", "At " + pct(r) + " per period, payments at the " + (due ? "start" : "end") + " of each period."),
      chart: n ? chart({ id: "fv", x0: 0, x1: n, ymax: Math.max(tot, 1) * 1.1, lines: [{ pts: pts, cls: "you" }], hl: [], marks: [], title: "Future value by period", desc: "The future value after " + n + " periods is " + usd(tot) + "." }) : "",
      table: tbl(["Period", "Future value"], pts.filter(function (p, i) { return n <= 12 || i % 5 === 0 || i === n; }).map(function (p) { return onRow([p[0], usd(p[1])], p[0] === n); })),
      data: "", note: "FV = PV × (1 + r)ⁿ + PMT × [(1 + r)ⁿ − 1] ÷ r" + (due ? " × (1 + r), because payments come at the start of each period." : ".")
    };
  }
  // APY a partir del APR según la frecuencia de capitalización
  var CMP = { "1": ["Yearly", 1], "4": ["Quarterly", 4], "12": ["Monthly", 12], "365": ["Daily", 365], cont: ["Continuous", Infinity] };
  function apyHTML(v) {
    var r = v.apr / 100, c = CMP[v.cmp] || CMP["12"], y = E.apy(r, c[1]);
    return {
      sign: sign(c[0], "APY", pct(Math.round(y * 1e6) / 1e6), "An APR of " + pct(r) + " compounded " + c[0].toLowerCase() + " earns " + pct(Math.round(y * 1e6) / 1e6) + " in a year.", usd(v.dep) + " earns " + usd(v.dep * y) + " in interest in the first year."),
      chart: bars(Object.keys(CMP).map(function (k) { return [CMP[k][0], v.dep * E.apy(r, CMP[k][1])]; })),
      table: tbl(["Compounding", "APY", "Interest on " + usd(v.dep) + " in a year"], Object.keys(CMP).map(function (k) { var a = E.apy(r, CMP[k][1]); return onRow([CMP[k][0], pct(Math.round(a * 1e6) / 1e6), usd(v.dep * a)], k === v.cmp); })),
      data: "", note: "APY = (1 + APR ÷ n)ⁿ − 1, where n is the number of compounding periods in a year."
    };
  }
  var HTML = { int: intHTML, inv: invHTML, fv: fvHTML, apy: apyHTML, fire: fireHTML, coast: coastHTML, nw: nwHTML, last: lastHTML, rmd: rmdHTML, sepp: seppHTML, inf: infHTML, ci: ciHTML, r72: r72HTML, nwc: nwcHTML, ssb: ssbHTML, ef: efHTML, re: reHTML, bar: barHTML };

  if (typeof document !== "undefined") Array.prototype.forEach.call(document.querySelectorAll("form[data-calc]"), function (f) {
    var kind = f.getAttribute("data-calc"), timer, sent = false;
    var render = function (v) { var h = HTML[kind](v); for (var k in h) { var el = document.getElementById(kind + "-" + k); if (el && el.innerHTML !== h[k]) el.innerHTML = h[k]; } };
    var write = function (v) { Object.keys(v).forEach(function (k) { var e = f.elements[k]; if (CHOICES[k]) Array.prototype.forEach.call(e, function (r) { r.checked = r.value === v[k]; }); else e.value = /^(p|s|w|lean|fire|fat|spend|nw|c|cash|inv|ret|home|car|other|mort|student|auto|cards|debt|pia|exp|have|inc|bal|amt|pv|pmt|dep)$/.test(k) ? v[k].toLocaleString("en-US") : v[k]; }); };
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

  return { intHTML: intHTML, invHTML: invHTML, fvHTML: fvHTML, apyHTML: apyHTML, inv: inv, ciHTML: ciHTML, r72HTML: r72HTML, nwcHTML: nwcHTML, ssbHTML: ssbHTML, efHTML: efHTML, reHTML: reHTML, barHTML: barHTML, rmdHTML: rmdHTML, seppHTML: seppHTML, infHTML: infHTML, ci: ci, nwc: nwc, ssb: ssb, ssMonthly: ssMonthly, re: re, bar: bar, lastFor: lastFor, lastHTML: lastHTML, howLong: howLong, BAD: BAD, nw: nw, nwHTML: nwHTML, GROUPS: GROUPS, rank: rank, chart: chart, short: short, DEFAULTS: DEFAULTS, num: num, usd: usd, pct: pct, yrs: yrs, rate: rate, fire: fire, fireHTML: fireHTML, coast: coast, coastHTML: coastHTML, toHash: toHash, fromHash: fromHash };
});
