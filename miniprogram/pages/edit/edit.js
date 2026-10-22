const { getMemo, removeMemo, removeMemoCloud } = require('../../utils/storage')
const { saveWithSubscribe } = require('../../utils/reminder')
const { toDateValue, toTimeValue, combineDateTime } = require('../../utils/time')

Page({
  data: {
    id: '',
    title: '',
    content: '',
    date: '',
    time: '',
    minDate: '',
    saving: false
  },

  onLoad(query) {
    const now = Date.now()
    const minDate = toDateValue(now)
    if (query.id) {
      const memo = getMemo(query.id)
      if (!memo) {
        wx.showToast({ title: '备忘不存在', icon: 'none' })
        setTimeout(() => wx.navigateBack(), 500)
        return
      }
      const ts = memo.remindAt || now + 3600000
      this.setData({
        id: memo.id,
        title: memo.title || '',
        content: memo.content || '',
        date: toDateValue(ts),
        time: toTimeValue(ts),
        minDate
      })
    } else {
      const ts = now + 60 * 60 * 1000
      this.setData({
        date: toDateValue(ts),
        time: toTimeValue(ts),
        minDate
      })
    }
  },

  onTitle(e) {
    this.setData({ title: e.detail.value })
  },

  onContent(e) {
    this.setData({ content: e.detail.value })
  },

  onDate(e) {
    this.setData({ date: e.detail.value })
  },

  onTime(e) {
    this.setData({ time: e.detail.value })
  },

  async onSave() {
    const title = (this.data.title || '').trim()
    if (!title) {
      wx.showToast({ title: '请填写标题', icon: 'none' })
      return
    }
    const remindAt = combineDateTime(this.data.date, this.data.time)
    if (!remindAt) {
      wx.showToast({ title: '请设置提醒时间', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    try {
      await saveWithSubscribe(
        {
          id: this.data.id || undefined,
          title,
          content: (this.data.content || '').trim(),
          remindAt,
          done: false,
          notified: false
        },
        { requestSub: true }
      )
      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 450)
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      this.setData({ saving: false })
    }
  },

  onDelete() {
    const id = this.data.id
    if (!id) return
    wx.showModal({
      title: '删除备忘',
      content: '确定删除这条备忘吗？',
      success: async (res) => {
        if (!res.confirm) return
        removeMemo(id)
        await removeMemoCloud(id)
        wx.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => wx.navigateBack({ delta: 2 }), 400)
      }
    })
  }
})
