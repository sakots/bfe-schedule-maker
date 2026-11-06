import { WEEKDAYS, getDisplayContent, shortDate } from './schedule.js';

export const SIZE = 1200;
const FONT = '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';

export function wrapText(text, maxWidth, measure) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const character of paragraph) {
      if (line && measure(line + character) > maxWidth) {
        lines.push(line);
        line = '';
      }
      line += character;
    }
    lines.push(line);
  }
  return lines;
}

function roundedRect(ctx, x, y, width, height, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

export function drawSchedule(canvas, schedule, header) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  const background = ctx.createLinearGradient(0, 0, 0, SIZE);
  background.addColorStop(0, '#fff2cd');
  background.addColorStop(1, '#ece3ff');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, SIZE, SIZE);

  if (header) {
    const cropWidth = Math.min(header.naturalWidth, header.naturalHeight * 3);
    const cropHeight = cropWidth / 3;
    ctx.drawImage(header, (header.naturalWidth - cropWidth) / 2, (header.naturalHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, SIZE, 400);
  } else {
    ctx.fillStyle = '#126f71';
    ctx.fillRect(0, 0, SIZE, 400);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 68px ${FONT}`;
    ctx.fillText('WEEKLY SCHEDULE', 600, 170);
    ctx.font = `500 36px ${FONT}`;
    ctx.fillText(`${schedule.dates[0].replaceAll('-', '/')} — ${schedule.dates[6].replaceAll('-', '/')}`, 600, 265);
  }

  schedule.days.forEach((day, index) => {
    const y = 414 + index * 110;
    roundedRect(ctx, 15, y + 5, 1170, 102, 28, '#00000022');
    roundedRect(ctx, 12, y, 1170, 102, 28, '#fffffff5');
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(12, y, 1170, 102, 28);
    ctx.clip();
    ctx.fillStyle = index >= 5 ? '#eb579d' : '#18bcb6';
    ctx.beginPath();
    ctx.moveTo(12, y);
    ctx.lineTo(290, y);
    ctx.lineTo(228, y + 102);
    ctx.lineTo(12, y + 102);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 42px ${FONT}`;
    ctx.fillText(WEEKDAYS[index], 55, y + 51);
    ctx.font = `750 38px ${FONT}`;
    ctx.fillText(shortDate(schedule.dates[index]), 157, y + 51);

    const content = getDisplayContent(day);
    let fontSize = day.off ? 48 : 44;
    let lines;
    do {
      ctx.font = `800 ${fontSize}px ${FONT}`;
      lines = wrapText(content, 864, (text) => ctx.measureText(text).width);
      if (lines.length <= 3 && lines.length * fontSize * 1.15 <= 88) break;
      fontSize -= 2;
    } while (fontSize >= 18);
    ctx.fillStyle = '#18292d';
    const lineHeight = fontSize * 1.15;
    lines.forEach((line, lineIndex) => {
      ctx.fillText(line, 727, y + 51 + (lineIndex - (lines.length - 1) / 2) * lineHeight);
    });
  });
}
