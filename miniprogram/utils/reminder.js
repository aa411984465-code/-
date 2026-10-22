const { listMemos, markNotified, saveMemo, syncMemoToCloud } = require('./storage')

const PROMPTED_KEY = 'reminder_prompted_ids'

function formatDateTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getPromptedSet() {
  try {
    const arr = wx.getStorageSync(PROMPTED_KEY) || []
    return new Set(Array.isArray(arr) ? arr : [])
  } catch (e) {
    return new Set()
  }
}

function addPrompted(id) {
  const set = getPromptedSet()
  set.add(id)
  wx.setStorageSync(PROMPTED_KEY, Array.from(set))
}

/**
 * 前台到期检查：用微信对话框 wx.showModal 弹出
 * 说明：小程序无法在真正后台常驻弹窗；合规方案是：
 * 1) 打开/回到前台时弹窗
 * 2) 已授权订阅消息时，由云函数下发微信服务通知
 */
function checkDueReminders({ forceModal = false } = {}) {
  const now = Date.now()
  const due = listMemos({ includeDone: false }).filter(
    (m) => m.remindAt && m.remindAt <= now && !m.notified
  )
  if (!due.length) return

  const prompted = getPromptedSet()
  const target = due.find((m) => forceModal || !prompted.has(m.id)) || due[0]
  if (!target) return

  addPrompted(target.id)

  wx.showModal({
    title: '备忘提醒',
    content: `${target.title || '未命名事项'}\n${target.content || ''}\n时间：${formatDateTime(target.remindAt)}`.slice(
      0,
      200
    ),
    confirmText: '知道了',
    cancelText: '稍后',
    success(res) {
      if (res.confirm) {
        markNotified(target.id)
        const memo = listMemos().find((m) => m.id === target.id)
        if (memo) syncMemoToCloud(memo)
      }
      // 若还有下一条，短暂延迟后继续弹
      const rest = listMemos({ includeDone: false }).filter(
        (m) => m.remindAt && m.remindAt <= Date.now() && !m.notified && m.id !== target.id
      )
      if (rest.length) {
        setTimeout(() => checkDueReminders({ forceModal: true }), 400)
      }
    }
  })
}

/**
 * 请求订阅消息授权（用户点击手势内调用）
 * 模板需在公众平台配置；iOS 上架必须走订阅消息，不可伪后台推送
 */
function requestSubscribe(templateId) {
  return new Promise((resolve) => {
    if (!templateId) {
      resolve({ ok: false, reason: 'no_template' })
      return
    }
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success(res) {
        const status = res[templateId]
        resolve({
          ok: status === 'accept',
          status,
          reason: status === 'accept' ? '' : status || 'reject'
        })
      },
      fail(err) {
        resolve({ ok: false, reason: err.errMsg || 'fail', err })
      }
    })
  })
}

/**
 * 创建/更新备忘时：本地保存 + 请求订阅 + 可选写入云库供定时任务发送
 */
async function saveWithSubscribe(payload, { requestSub = true } = {}) {
  const app = getApp()
  const templateId =
    (app && app.globalData && app.globalData.subscribeTemplateId) ||
    wx.getStorageSync('subscribeTemplateId') ||
    ''

  let subscribed = false
  if (requestSub && payload.remindAt && templateId) {
    const sub = await requestSubscribe(templateId)
    subscribed = !!sub.ok
    if (!sub.ok && sub.reason === 'no_template') {
      // 未配置模板：仅本地弹窗提醒
    } else if (!sub.ok) {
      wx.showToast({ title: '未授权订阅，仅前台弹窗提醒', icon: 'none' })
    }
  }

  const memo = saveMemo({ ...payload, subscribed })
  await syncMemoToCloud(memo)

  // 若已过期，立即弹窗
  if (memo.remindAt && memo.remindAt <= Date.now() && !memo.done) {
    setTimeout(() => checkDueReminders({ forceModal: true }), 300)
  }

  return memo
}

module.exports = {
  formatDateTime,
  checkDueReminders,
  requestSubscribe,
  saveWithSubscribe
}
