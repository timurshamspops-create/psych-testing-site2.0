// Источник данных, по приоритету:
// 1. Apps Script (APPS_SCRIPT_URL в js/config.js) — реальная статистика по всем пользователям.
// 2. localStorage этого браузера — если вы уже проходили тесты локально.
// 3. Демонстрационные числа — если ничего из вышеперечисленного не доступно.
var DEMO_STATS = {
  stress: { count: 21, sum: 21 * 3.4 },
  social: { count: 18, sum: 18 * 3.7 },
  emotion: { count: 15, sum: 15 * 3.2 },
  selfesteem: { count: 19, sum: 19 * 3.5 },
  anxiety: { count: 24, sum: 24 * 2.9 }
};

var PALETTE = ["#b97a2b", "#4b7a72", "#6b6e66", "#2f5750", "#d9a463"];

Promise.all([fetchTests(), fetchStats()]).then(function (results) {
  var tests = results[0];
  var stats = results[1].data;
  var source = results[1].source;

  var notice = document.getElementById("data-notice");
  if (source !== "server") {
    notice.style.display = "";
    notice.textContent = source === "local"
      ? "Показана статистика по тестам, пройденным в этом браузере. Подключите Apps Script (js/config.js), чтобы собирать данные со всех посетителей."
      : "Показаны демонстрационные данные. Пройдите тест или подключите Apps Script (js/config.js), чтобы увидеть реальную статистику.";
  }

  var labels = tests.map(function (t) { return t.title; });
  var averages = tests.map(function (t) {
    var s = stats[t.id];
    return s && s.count ? s.sum / s.count : 0;
  });
  var totalCompletions = tests.reduce(function (sum, t) {
    var s = stats[t.id];
    return sum + (s ? s.count : 0);
  }, 0);
  var overallAvg = averages.reduce(function (a, b) { return a + b; }, 0) /
    averages.filter(function (v) { return v > 0; }).length || 0;

  renderStatCards(totalCompletions, tests.length, overallAvg);
  renderChart(labels, averages);
});

function fetchStats() {
  if (APPS_SCRIPT_URL) {
    return fetch(APPS_SCRIPT_URL)
      .then(function (res) {
        if (!res.ok) throw new Error("Apps Script вернул ошибку");
        return res.json();
      })
      .then(function (rows) {
        var byId = {};
        rows.forEach(function (r) { byId[r.id] = { count: r.count, sum: r.count * r.avg }; });
        return { data: byId, source: "server" };
      })
      .catch(function (err) {
        console.error("Apps Script недоступен, пробуем локальные данные:", err);
        return localOrDemo();
      });
  }
  return Promise.resolve(localOrDemo());
}

function localOrDemo() {
  var local = readLocalStats();
  var hasLocal = Object.keys(local).length > 0;
  return hasLocal ? { data: local, source: "local" } : { data: DEMO_STATS, source: "demo" };
}

function renderStatCards(totalCompletions, testCount, overallAvg) {
  var row = document.getElementById("stat-row");
  row.innerHTML =
    statCard(totalCompletions, "Всего прохождений") +
    statCard(testCount, "Тестов доступно") +
    statCard(overallAvg.toFixed(1) + " / 5", "Средний балл по всем тестам");
}

function statCard(num, label) {
  return (
    '<div class="stat-card"><div class="num">' + num + "</div>" +
    '<div class="label">' + label + "</div></div>"
  );
}

function renderChart(labels, averages) {
  var ctx = document.getElementById("results-chart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Средний балл",
        data: averages.map(function (v) { return Math.round(v * 100) / 100; }),
        backgroundColor: labels.map(function (_, i) { return PALETTE[i % PALETTE.length]; }),
        borderRadius: 4,
        maxBarThickness: 64
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: 5, ticks: { stepSize: 1 } }
      }
    }
  });
}
