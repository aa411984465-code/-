function pad(n) {
  return n < 10 ? `0${n}` : `${n}`
}

function toDateValue(ts) {
  const d = new Date(ts || Date.now())
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function toTimeValue(ts) {
  const d = new Date(ts || Date.now())
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function combineDateTime(dateStr, timeStr) {
  if (!dateStr) return 0
  const t = timeStr || '09:00'
  const iso = `${dateStr}T${t}:00`
  const ms = new Date(iso).getTime()
  return Number.isNaN(ms) ? 0 : ms
}

function relativeLabel(ts) {
  if (!ts) return '未设置提醒'
  const now = Date.now()
  const diff = ts - now
  if (diff <= 0) return '已到期'
  const min = Math.round(diff / 60000)
  if (min < 60) return `${min} 分钟后`
  const hour = Math.round(min / 60)
  if (hour < 48) return `${hour} 小时后`
  const day = Math.round(hour / 24)
  return `${day} 天后`
}

module.exports = {
  toDateValue,
  toTimeValue,
  combineDateTime,
  relativeLabel
}
