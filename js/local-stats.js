// Простая локальная статистика на случай, если Apps Script ещё не подключён:
// каждое прохождение теста в этом браузере добавляется в localStorage,
// и results.html может её показать вместо демо-чисел.
var LOCAL_STATS_KEY = "psychtest_local_stats";

function readLocalStats() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STATS_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function addLocalResult(testId, average) {
  var stats = readLocalStats();
  var entry = stats[testId] || { count: 0, sum: 0 };
  entry.count += 1;
  entry.sum += average;
  stats[testId] = entry;
  try {
    localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Не удалось сохранить локальную статистику", e);
  }
}
