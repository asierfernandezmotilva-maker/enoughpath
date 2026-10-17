/* Motor de cálculo FIRE. Lo usan las calculadoras en el navegador, tools/generar.js (cifras de las páginas) y
   tools/test-engine.js. Tasas en tanto por uno (0.04 = 4 %). Todo en dólares de hoy salvo futureDollars(). */
(function (root, f) { if (typeof module === "object") module.exports = f(); else root.EP_ENGINE = f(); })(this, function () {
  // FIRE number: gasto anual / tasa de retirada (con 4 %, 25 veces el gasto)
  function fireNumber(spending, wr) { return wr > 0 ? spending / wr : Infinity; }
  // Barista FIRE: la cartera solo cubre lo que no cubre el trabajo a tiempo parcial
  function baristaNumber(spending, income, wr) { return fireNumber(Math.max(0, spending - income), wr); }
  // Ecuación de Fisher exacta: 7 % nominal y 3 % de inflación = 3,88 % real, no 4 %
  function realRate(nominal, inflation) { return (1 + nominal) / (1 + inflation) - 1; }
  function futureDollars(amount, inflation, years) { return amount * Math.pow(1 + inflation, years); }
  // Saldo a los t años con aportación anual a final de año (t fraccionario: interpolación de la misma fórmula)
  function balance(p0, save, r, t) {
    if (r === 0) return p0 + save * t;
    var g = Math.pow(1 + r, t); return p0 * g + save * (g - 1) / r;
  }
  // Años hasta que balance() llega a target: (1+r)^n = (target·r + S) / (p0·r + S). Infinity si no llega nunca.
  function yearsToTarget(p0, save, r, target) {
    if (!(target < Infinity)) return Infinity;
    if (p0 >= target) return 0;
    if (r === 0) return save > 0 ? (target - p0) / save : Infinity;
    var n = Math.log((target * r + save) / (p0 * r + save)) / Math.log(1 + r);
    return n >= 0 ? n : Infinity; // NaN (rentabilidad negativa que nunca llega) también da Infinity
  }
  // Coast FIRE: lo que hace falta hoy para llegar a target en `years` años sin aportar más
  function coastNumber(target, r, years) { return target / Math.pow(1 + r, Math.max(0, years)); }
  // Años ahorrando hasta tener el coast number de ese momento (dejar de aportar y aun así llegar a target a la edad fijada).
  // Con C = coast number de hoy: (1+r)^-t = 1 - r·(C - p0)/S. Infinity si no se llega antes de la edad fijada.
  function yearsToCoast(p0, save, r, target, years) {
    var c = coastNumber(target, r, years);
    if (p0 >= c) return 0;
    if (!(save > 0)) return Infinity;
    var t = r === 0 ? (c - p0) / save : -Math.log(1 - r * (c - p0) / save) / Math.log(1 + r);
    return t >= 0 && t <= years ? t : Infinity;
  }
  // Años que dura una cartera p retirando w al principio de cada año (w constante en dólares de hoy) con rentabilidad real r.
  // Saldo cero cuando (1+r)^t = w(1+r) / (w(1+r) − p·r). Infinity si los rendimientos cubren la retirada para siempre.
  function yearsLasts(p, w, r) {
    if (!(w > 0)) return Infinity;
    if (r === 0) return p / w;
    var wg = w * (1 + r);
    return wg > p * r ? Math.log(wg / (wg - p * r)) / Math.log(1 + r) : Infinity;
  }
  // Ahorro anual (a final de año) para llegar a target en n años partiendo de p0: S = (target − p0·g^n)·r / (g^n − 1)
  function savingNeeded(p0, r, target, n) {
    if (r === 0) return Math.max(0, (target - p0) / n);
    var g = Math.pow(1 + r, n); return Math.max(0, (target - p0 * g) * r / (g - 1));
  }
  // Percentil de v en una lista ordenada de percentiles p1..p99 (índice 0 = p1), con interpolación lineal.
  // 0 = por debajo del p1; 100 = por encima del p99. Con valores repetidos (p. ej. varios 0) toma el percentil más alto.
  function percentileOf(p, v) {
    if (v < p[0]) return 0;
    if (v >= p[98]) return v > p[98] ? 100 : 99;
    var k = 0; while (k < 98 && p[k + 1] <= v) k++;
    return k + 1 + (v - p[k]) / (p[k + 1] - p[k]);
  }
  // Retirada año a año con una lista de rentabilidades reales: saldo = (saldo − w) × (1 + r). Devuelve el saldo al empezar
  // cada año (el primero es p); si el saldo no llega para la retirada, la cartera se agota y la lista acaba en 0.
  function withdrawPath(p, w, returns) {
    var out = [p];
    for (var i = 0; i < returns.length; i++) { if (p < w) { out.push(0); break; } p = (p - w) * (1 + returns[i]); out.push(p); }
    return out;
  }
  // Media geométrica (la rentabilidad anual compuesta equivalente)
  function geoMean(returns) { return Math.pow(returns.reduce(function (a, r) { return a * (1 + r); }, 1), 1 / returns.length) - 1; }
  // Años que dura p retirando w al principio de cada año con una lista de rentabilidades. El último año parcial cuenta como
  // la fracción de retirada que aún se puede pagar (saldo / w). Infinity si la lista se acaba y todavía queda para retirar.
  function yearsOnPath(p, w, returns) {
    if (!(w > 0)) return Infinity;
    for (var i = 0; i < returns.length; i++) { if (p < w) return i + p / w; p = (p - w) * (1 + returns[i]); }
    return p < w ? returns.length + p / w : Infinity;
  }
  return { yearsOnPath: yearsOnPath, withdrawPath: withdrawPath, geoMean: geoMean, percentileOf: percentileOf, savingNeeded: savingNeeded, yearsLasts: yearsLasts, fireNumber: fireNumber, baristaNumber: baristaNumber, realRate: realRate, futureDollars: futureDollars,
    balance: balance, yearsToTarget: yearsToTarget, coastNumber: coastNumber, yearsToCoast: yearsToCoast };
});
