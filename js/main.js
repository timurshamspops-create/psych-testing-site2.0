// Загружает список тестов из data/tests.json.
// Используется главной страницей (рендер карточек), а также
// test.js и results.js — чтобы не дублировать fetch-логику.
function fetchTests() {
  return fetch("data/tests.json").then(function (res) {
    if (!res.ok) throw new Error("Не удалось загрузить список тестов");
    return res.json();
  });
}

// Рендер карточек тестов на главной странице.
// Если элемент #test-list отсутствует на странице — просто ничего не делаем.
(function renderTestList() {
  var listEl = document.getElementById("test-list");
  if (!listEl) return;

  fetchTests()
    .then(function (tests) {
      listEl.innerHTML = tests.map(testCardHTML).join("");
    })
    .catch(function (err) {
      listEl.innerHTML =
        '<p class="lede">Не получилось загрузить список тестов. Проверьте, что файл data/tests.json доступен.</p>';
      console.error(err);
    });
})();

function testCardHTML(test) {
  return (
    '<article class="test-card">' +
    '<span class="tag">' + escapeHTML(test.category) + "</span>" +
    "<h2>" + escapeHTML(test.title) + "</h2>" +
    "<p>" + escapeHTML(test.description) + "</p>" +
    '<div class="meta">' + test.questions.length + " вопросов · " + escapeHTML(test.duration) + "</div>" +
    '<a class="btn" href="test.html?id=' + encodeURIComponent(test.id) + '">Пройти тест</a>' +
    "</article>"
  );
}

function escapeHTML(str) {
  var div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}
