import test from 'node:test';
import assert from 'node:assert/strict';
import { createSchedule, getWeekDates, getDisplayContent } from '../src/schedule.js';
import { wrapText } from '../src/render.js';

test('選択した日を含む月曜〜日曜を返す', () => {
  assert.deepEqual(getWeekDates('2026-11-08'), [
    '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05',
    '2026-11-06', '2026-11-07', '2026-11-08',
  ]);
  assert.equal(getWeekDates('2026-11-02')[0], '2026-11-02');
});

test('年末をまたいでも月曜から7日間になる', () => {
  assert.deepEqual(getWeekDates('2027-01-01'), [
    '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31',
    '2027-01-01', '2027-01-02', '2027-01-03',
  ]);
});

test('うるう日の週と100年単位の平年を扱う', () => {
  assert.equal(getWeekDates('2028-02-29')[1], '2028-02-29');
  assert.equal(getWeekDates('2100-03-01')[0], '2100-03-01');
});

test('夏時間の切り替えでも日付を飛ばさない', () => {
  const previous = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    assert.deepEqual(getWeekDates('2026-03-08'), [
      '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05',
      '2026-03-06', '2026-03-07', '2026-03-08',
    ]);
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('休みの表示に切り替えても入力した内容を失わない', () => {
  const schedule = createSchedule('2026-11-06');
  const day = schedule.days[0];
  day.content = '19:00〜20:00 参加型配信';
  day.off = true;
  assert.equal(getDisplayContent(day), 'お休み');
  day.off = false;
  assert.equal(getDisplayContent(day), '19:00〜20:00 参加型配信');
  assert.equal(getDisplayContent(schedule.days[6]), 'お休み');
});

test('別の予定表の編集が他方に影響しない', () => {
  const first = createSchedule('2026-11-06');
  const second = createSchedule('2026-11-06');
  first.days[0].content = '変更済み';
  first.days[0].off = true;
  assert.notEqual(second.days[0].content, '変更済み');
  assert.equal(second.days[0].off, false);
});

test('日本語と絵文字の長文を文字欠けなく幅以内に折り返す', () => {
  const text = '参加型配信🎮みんなで楽しく遊ぼう'.repeat(4);
  const measure = (value) => [...value].length * 24;
  const lines = wrapText(text, 144, measure);
  assert.equal(lines.join(''), text);
  assert.ok(lines.every((line) => measure(line) <= 144));
  assert.ok(lines.every((line) => !/[\uD800-\uDBFF]$/.test(line)));
});

test('改行を保持し、空の内容も描画可能な行にする', () => {
  assert.deepEqual(wrapText('配信\n交流会', 100, (value) => value.length * 10), ['配信', '交流会']);
  assert.deepEqual(wrapText('', 100, (value) => value.length * 10), ['']);
});
