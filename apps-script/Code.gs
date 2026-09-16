/**
 * Как это работает
 * -----------------
 * Один Apps Script, привязанный к одной Google Таблице, служит и точкой
 * приёма результатов, и точкой выдачи статистики:
 *
 *   test.html --(POST { testId, average })--> doPost --> новая строка в листе "Responses"
 *   results.html --(GET)--> doGet --> [{ id, count, avg }, ...] по всем тестам
 *
 * Установка
 * ---------
 * 1. Создайте новую Google Таблицу. На первом листе назовите вкладку Responses
 *    (Google создаёт лист "Лист1" по умолчанию — переименуйте его).
 * 2. В таблице: Расширения → Apps Script, вставьте этот код полностью
 *    (замените содержимое файла).
 * 3. Deploy → New deployment → тип: Web app.
 *      Execute as: Me
 *      Who has access: Anyone
 * 4. Скопируйте URL веб-приложения и вставьте его в js/config.js
 *    как значение APPS_SCRIPT_URL.
 */

var SHEET_NAME = "Responses";

function doPost(e) {
  var sheet = getSheet();
  var body = JSON.parse(e.postData.contents);

  sheet.appendRow([new Date(), body.testId, body.average]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  var sheet = getSheet();
  var rows = sheet.getDataRange().getValues();
  rows.shift(); // убираем строку заголовка

  var byTest = {};
  rows.forEach(function (row) {
    var testId = row[1];
    var average = Number(row[2]);
    if (!testId || isNaN(average)) return;

    if (!byTest[testId]) byTest[testId] = { id: testId, count: 0, sum: 0 };
    byTest[testId].count += 1;
    byTest[testId].sum += average;
  });

  var result = Object.keys(byTest).map(function (id) {
    var t = byTest[id];
    return { id: t.id, count: t.count, avg: t.sum / t.count };
  });

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["timestamp", "testId", "average"]);
  }
  return sheet;
}
