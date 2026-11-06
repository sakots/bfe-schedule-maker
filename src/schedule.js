export const WEEKDAYS = ['月', '火', '水', '木', '金', '土', '日'];

export function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getWeekDates(selectedDate) {
  // Local noon avoids UTC date shifts and midnight daylight-saving transitions.
  const date = new Date(`${selectedDate}T12:00:00`);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return WEEKDAYS.map(() => {
    const value = formatDate(date);
    date.setDate(date.getDate() + 1);
    return value;
  });
}

export function createSchedule(selectedDate = formatDate(new Date())) {
  const activities = ['雀魂参加型配信', 'Fortnite参加型配信', '雀魂参加型配信', 'Fortnite参加型配信', 'Fall Guys参加型配信', '', ''];
  return {
    dates: getWeekDates(selectedDate),
    days: activities.map((activity, index) => ({
      content: activity ? `11:00〜12:00 ${activity}` : '',
      off: index >= 5,
    })),
  };
}

export function getDisplayContent(day) {
  return day.off ? 'お休み' : day.content;
}

export function shortDate(value) {
  const [, month, day] = value.split('-');
  return `${Number(month)}/${Number(day)}`;
}
