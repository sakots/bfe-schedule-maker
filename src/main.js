import './style.css';
import defaultHeaderUrl from '../images/image.png';
import { WEEKDAYS, createSchedule, getWeekDates, getDisplayContent, shortDate } from './schedule.js';
import { drawSchedule } from './render.js';

const schedule = createSchedule();
const canvas = document.querySelector('#schedule-canvas');
const weekInput = document.querySelector('#week-date');
const headerSelect = document.querySelector('#header-select');
const fileInput = document.querySelector('#header-file');
const downloadButton = document.querySelector('#download');
const status = document.querySelector('#status');
const error = document.querySelector('#error');
const fields = document.querySelector('#day-fields');
let header = null;
let customHeader = null;
let defaultHeader = null;
let headerMode = 'default';
let imageRequest = 0;
let imageLoading = false;
let fontsReady = false;
let exporting = false;

schedule.days.forEach((day, index) => {
  const row = document.createElement('div');
  row.className = `day-row${day.off ? ' is-off' : ''}`;
  row.innerHTML = `<div class="day-row-heading"><label for="content-${index}" class="day-label"><span class="weekday">${WEEKDAYS[index]}</span><span class="day-date"></span><span class="sr-only">の予定</span></label><label class="off-control"><input type="checkbox" id="off-${index}" aria-label="${WEEKDAYS[index]}曜日を休みにする" /><span class="switch" aria-hidden="true"></span>休み</label></div><input type="text" id="content-${index}" maxlength="80" placeholder="例：11:00〜12:00 参加型配信" />`;
  const contentInput = row.querySelector('input[type="text"]');
  const offInput = row.querySelector('input[type="checkbox"]');
  contentInput.value = day.content;
  contentInput.disabled = day.off;
  offInput.checked = day.off;
  contentInput.addEventListener('input', () => {
    day.content = contentInput.value;
    render();
  });
  offInput.addEventListener('change', () => {
    day.off = offInput.checked;
    contentInput.disabled = day.off;
    row.classList.toggle('is-off', day.off);
    render();
  });
  fields.append(row);
});

function render() {
  weekInput.value = schedule.dates[0];
  fields.querySelectorAll('.day-date').forEach((element, index) => {
    element.textContent = shortDate(schedule.dates[index]);
  });
  document.querySelector('#preview-range').textContent = `${schedule.dates[0].replaceAll('-', '/')} — ${schedule.dates[6].replaceAll('-', '/')}`;
  canvas.setAttribute('aria-label', schedule.days.map((day, index) => `${schedule.dates[index]} ${WEEKDAYS[index]}曜日 ${getDisplayContent(day)}`).join('、'));
  drawSchedule(canvas, schedule, header);
}

function updateDownloadState() {
  downloadButton.disabled = imageLoading || !fontsReady || exporting;
  canvas.setAttribute('aria-busy', String(imageLoading || !fontsReady));
}

function showError(message) {
  error.textContent = message;
  error.hidden = !message;
}

async function loadImage(url) {
  const image = new Image();
  image.src = url;
  await image.decode();
  return image;
}

async function changeHeader(mode, file) {
  const request = ++imageRequest;
  let objectUrl;
  imageLoading = true;
  showError('');
  status.textContent = 'ヘッダーを読み込んでいます…';
  updateDownloadState();
  try {
    let nextHeader = null;
    if (mode === 'default') {
      nextHeader = defaultHeader ?? await loadImage(defaultHeaderUrl);
      defaultHeader = nextHeader;
    } else if (mode === 'custom') {
      if (file) {
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
          throw new Error('unsupported image');
        }
        objectUrl = URL.createObjectURL(file);
        nextHeader = await loadImage(objectUrl);
      } else {
        nextHeader = customHeader;
      }
    }
    if (request !== imageRequest) return;
    if (mode === 'custom') {
      customHeader = nextHeader;
      headerSelect.querySelector('[value="custom"]').disabled = false;
    }
    header = nextHeader;
    headerMode = mode;
    headerSelect.value = mode;
    render();
    status.textContent = '編集内容はプレビューに反映されます。';
  } catch {
    if (request !== imageRequest) return;
    headerSelect.value = headerMode;
    showError('画像を読み込めませんでした。PNG・JPEG・WebPの画像を選び直してください。');
    status.textContent = 'ヘッダーは変更していません。';
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    if (request === imageRequest) {
      imageLoading = false;
      updateDownloadState();
    }
  }
}

weekInput.addEventListener('change', () => {
  if (!weekInput.value || !weekInput.validity.valid) return;
  schedule.dates = getWeekDates(weekInput.value);
  render();
});
headerSelect.addEventListener('change', () => changeHeader(headerSelect.value));
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) changeHeader('custom', file);
  fileInput.value = '';
});

downloadButton.addEventListener('click', async () => {
  exporting = true;
  updateDownloadState();
  showError('');
  const filename = `bfe-schedule-${schedule.dates[0]}.png`;
  try {
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('PNG export failed')), 'image/png');
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    // Give the browser time to consume the download URL before releasing it.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = `${filename} のダウンロードを開始しました。`;
  } catch {
    showError('PNGを保存できませんでした。もう一度ダウンロードしてください。');
  } finally {
    exporting = false;
    updateDownloadState();
  }
});

render();
changeHeader('default');
document.fonts.ready.then(() => {
  fontsReady = true;
  render();
  updateDownloadState();
});
