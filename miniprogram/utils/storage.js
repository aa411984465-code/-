const STORAGE_KEY = 'memo_list_v1'

function uid() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function readAll() {
  try {
    const list = wx.getStorageSync(STORAGE_KEY)
    return Array.isArray(list) ? list : []
  } catch (e) {
    return []
  }
}

function writeAll(list) {
  wx.setStorageSync(STORAGE_KEY, list)
}

function listMemos({ includeDone = true } = {}) {
  const list = readAll().slice().sort((a, b) => {
    const ta = a.remindAt || a.updatedAt || 0
    const tb = b.remindAt || b.updatedAt || 0
    return ta - tb
  })
  if (includeDone) return list
  return list.filter((m) => !m.done)
}

function getMemo(id) {
  return readAll().find((m) => m.id === id) || null
}

function saveMemo(payload) {
  const list = readAll()
  const now = Date.now()
  if (payload.id) {
    const idx = list.findIndex((m) => m.id === payload.id)
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        ...payload,
        updatedAt: now,
        // 修改提醒时间后重置推送状态，便于再次订阅/发送
        notified:
          payload.remindAt && payload.remindAt !== list[idx].remindAt
            ? false
            : payload.notified !== undefined
              ? payload.notified
              : list[idx].notified
      }
      writeAll(list)
      return list[idx]
    }
  }
  const item = {
    id: uid(),
    title: '',
    content: '',
    remindAt: 0,
    done: false,
    notified: false,
    subscribed: false,
    createdAt: now,
    updatedAt: now,
    ...payload
  }
  list.unshift(item)
  writeAll(list)
  return item
}

function removeMemo(id) {
  writeAll(readAll().filter((m) => m.id !== id))
}

function markDone(id, done = true) {
  const list = readAll()
  const idx = list.findIndex((m) => m.id === id)
  if (idx < 0) return null
  list[idx] = { ...list[idx], done: !!done, updatedAt: Date.now() }
  writeAll(list)
  return list[idx]
}

function markNotified(id) {
  const list = readAll()
  const idx = list.findIndex((m) => m.id === id)
  if (idx < 0) return null
  list[idx] = { ...list[idx], notified: true, updatedAt: Date.now() }
  writeAll(list)
  return list[idx]
}

/**
 * 同步到云数据库 memos 集合（可选，需开通云开发）
 * 失败时静默，本地仍可用
 */
async function syncMemoToCloud(memo) {
  if (!wx.cloud) return false
  try {
    const db = wx.cloud.database()
    const openid = wx.getStorageSync('openid') || ''
    const doc = {
      ...memo,
      _openid: openid,
      clientId: memo.id
    }
    const exist = await db
      .collection('memos')
      .where({ clientId: memo.id })
      .limit(1)
      .get()
    if (exist.data && exist.data.length) {
      const cloudId = exist.data[0]._id
      const { _id, ...rest } = doc
      await db.collection('memos').doc(cloudId).update({ data: rest })
    } else {
      await db.collection('memos').add({ data: doc })
    }
    return true
  } catch (e) {
    console.warn('云同步失败（本地仍已保存）', e)
    return false
  }
}

async function removeMemoCloud(clientId) {
  if (!wx.cloud) return
  try {
    const db = wx.cloud.database()
    const exist = await db
      .collection('memos')
      .where({ clientId })
      .limit(1)
      .get()
    if (exist.data && exist.data.length) {
      await db.collection('memos').doc(exist.data[0]._id).remove()
    }
  } catch (e) {
    console.warn('云删除失败', e)
  }
}

module.exports = {
  listMemos,
  getMemo,
  saveMemo,
  removeMemo,
  markDone,
  markNotified,
  syncMemoToCloud,
  removeMemoCloud
}
