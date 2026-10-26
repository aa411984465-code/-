const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

function formatDateTime(ts) {
  const d = new Date(ts)
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function clip(str, max) {
  const s = String(str || '').replace(/\s+/g, ' ').trim()
  if (s.length <= max) return s || '—'
  return `${s.slice(0, max - 1)}…`
}

/**
 * 发送单条订阅消息
 * event: { openid, templateId, title, content, remindAt, page? }
 *
 * 模板字段请与公众平台一致，默认按常见「待办提醒」：
 * thing1 事项名称 / time2 提醒时间 / thing3 备注
 * 若你的模板字段不同，请改 data 映射
 */
exports.main = async (event) => {
  const {
    openid,
    templateId,
    title,
    content,
    remindAt,
    page = 'pages/index/index'
  } = event

  if (!openid || !templateId) {
    return { ok: false, err: 'missing openid or templateId' }
  }

  try {
    const result = await cloud.openapi.subscribeMessage.send({
      touser: openid,
      templateId,
      page,
      data: {
        thing1: { value: clip(title, 20) },
        time2: { value: formatDateTime(remindAt || Date.now()) },
        thing3: { value: clip(content || '请打开小程序查看', 20) }
      },
      miniprogramState: 'formal'
    })
    return { ok: true, result }
  } catch (e) {
    console.error('subscribeMessage.send failed', e)
    return { ok: false, err: e.message || e.errMsg || String(e) }
  }
}
