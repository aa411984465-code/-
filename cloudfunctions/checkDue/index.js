const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

/**
 * 定时扫描到期且已订阅、未通知的备忘，调用 sendReminder
 * 在云开发控制台为本函数配置「定时触发器」，建议每 1 分钟：
 *   0 * * * * * *
 *
 * 环境变量（云函数配置）：
 *   SUBSCRIBE_TEMPLATE_ID  订阅消息模板 ID
 */
exports.main = async () => {
  const templateId = process.env.SUBSCRIBE_TEMPLATE_ID || ''
  if (!templateId) {
    return { ok: false, err: '请配置环境变量 SUBSCRIBE_TEMPLATE_ID' }
  }

  const now = Date.now()
  // 扫描窗口：已到期且未通知；限制单次批量避免超时
  const { data } = await db
    .collection('memos')
    .where({
      done: false,
      notified: false,
      subscribed: true,
      remindAt: _.lte(now).and(_.gt(now - 24 * 60 * 60 * 1000))
    })
    .limit(50)
    .get()

  const results = []
  for (const memo of data || []) {
    const openid = memo._openid
    if (!openid) {
      results.push({ id: memo._id, ok: false, err: 'no openid' })
      continue
    }

    try {
      const sendRes = await cloud.callFunction({
        name: 'sendReminder',
        data: {
          openid,
          templateId,
          title: memo.title,
          content: memo.content,
          remindAt: memo.remindAt,
          page: `pages/detail/detail?id=${memo.clientId || ''}`
        }
      })

      const ok = !!(sendRes.result && sendRes.result.ok)
      if (ok) {
        await db.collection('memos').doc(memo._id).update({
          data: { notified: true, notifiedAt: now }
        })
      }
      results.push({ id: memo._id, ok, detail: sendRes.result })
    } catch (e) {
      results.push({ id: memo._id, ok: false, err: e.message })
    }
  }

  return { ok: true, count: results.length, results }
}
