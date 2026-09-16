(function () {
  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");

  var titleEl = document.getElementById("test-title");
  var descEl = document.getElementById("test-description");
  var formEl = document.getElementById("test-form");
  var questionsEl = document.getElementById("questions");
  var progressEl = document.getElementById("progress");
  var submitBtn = document.getElementById("submit-btn");
  var resultEl = document.getElementById("test-result");

  var answers = {};
  var currentTest = null;

  if (!id) {
    titleEl.textContent = "Тест не выбран";
    descEl.textContent = "Вернитесь к списку и выберите один из тестов.";
    return;
  }

  fetchTests()
    .then(function (tests) {
      var test = tests.filter(function (t) { return t.id === id; })[0];
      if (!test) {
        titleEl.textContent = "Тест не найден";
        descEl.textContent = "Такого теста нет в списке — возможно, ссылка устарела.";
        return;
      }
      currentTest = test;
      renderTest(test);
    })
    .catch(function (err) {
      titleEl.textContent = "Ошибка загрузки";
      descEl.textContent = "Не получилось загрузить данные теста.";
      console.error(err);
    });

  function renderTest(test) {
    titleEl.textContent = test.title;
    descEl.textContent = test.description;
    questionsEl.innerHTML = test.questions.map(questionHTML).join("");
    formEl.style.display = "";
    updateProgress();

    questionsEl.addEventListener("click", function (e) {
      var btn = e.target.closest(".scale-btn");
      if (!btn) return;

      var qid = btn.dataset.qid;
      var value = Number(btn.dataset.value);
      answers[qid] = value;

      var group = questionsEl.querySelector('[data-group="' + qid + '"]');
      group.querySelectorAll(".scale-btn").forEach(function (b) {
        b.classList.toggle("selected", b === btn);
      });

      updateProgress();
    });

    submitBtn.addEventListener("click", handleSubmit);
  }

  function questionHTML(q) {
    return (
      '<div class="question-block">' +
      "<p class=\"question-text\">" + escapeHTML(q.text) + "</p>" +
      '<div class="scale-row" data-group="' + q.id + '">' +
      [1, 2, 3, 4, 5].map(function (v) {
        return '<button type="button" class="scale-btn" data-qid="' + q.id + '" data-value="' + v + '">' + v + "</button>";
      }).join("") +
      "</div></div>"
    );
  }

  function updateProgress() {
    var total = currentTest.questions.length;
    var answered = Object.keys(answers).length;
    progressEl.textContent = "Отвечено: " + answered + " из " + total;
    submitBtn.disabled = answered < total;
  }

  function handleSubmit() {
    var values = currentTest.questions.map(function (q) { return answers[q.id]; });
    var average = values.reduce(function (a, b) { return a + b; }, 0) / values.length;

    addLocalResult(currentTest.id, average);
    submitToAppsScript(currentTest.id, average);

    formEl.style.display = "none";
    resultEl.style.display = "";
    resultEl.innerHTML = resultHTML(average);
  }

  function resultHTML(average) {
    var rounded = Math.round(average * 10) / 10;
    var level = rounded < 2.34 ? "Ниже среднего" : rounded < 3.67 ? "Средний" : "Выше среднего";
    return (
      '<div class="result-score">' + rounded.toFixed(1) + " / 5</div>" +
      '<div class="result-level">' + level + " показатель по этому тесту</div>" +
      "<p class=\"lede\">Это самооценочный показатель, а не медицинский диагноз. " +
      "Ваш результат добавлен в общую статистику.</p>" +
      '<a class="btn" href="results.html">Смотреть статистику</a> ' +
      '<a class="btn secondary" href="index.html">К списку тестов</a>'
    );
  }

  function submitToAppsScript(testId, average) {
    if (!APPS_SCRIPT_URL) return;
    // no-cors + text/plain намеренно: так запрос уходит без CORS preflight,
    // это стандартный приём для отправки данных в Apps Script со статичной
    // страницы. Ответ прочитать нельзя, но это и не нужно для fire-and-forget.
    fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ testId: testId, average: average })
    }).catch(function (err) {
      console.error("Не удалось отправить результат в Apps Script:", err);
    });
  }

  function escapeHTML(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : str;
    return div.innerHTML;
  }
})();
