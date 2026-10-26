const {
  getMemo,
  markDone,
  removeMemo,
  removeMemoCloud,
  saveMemo,
  syncMemoToCloud
} = require('../../utils/storage')
const { formatDateTime, requestSubscribe } = require('../../utils/reminder')
const { relativeLabel } = require('../../utils/time')

Page({
  data: {
    id: '',
    memo: null
  },

  onLoad(query) {
    this.setData({ id: query.id || '' })
  },

  onShow() {
    this.load()
  },

  load() {
    const memo = getMemo(this.data.id)
    if (!memo) {
      this.setData({ memo: null })
      wx.showToast({ title: '备忘不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 500)
      return
    }
    const now = Date.now()
    this.setData({
      memo: {
        ...memo,
        isDue: !!(memo.remindAt && memo.remindAt <= now && !memo.done),
        remindLabel: memo.remindAt ? formatDateTime(memo.remindAt) : '',
        relative: relativeLabel(memo.remindAt)
      }
    })
  },

  onEdit() {
    wx.navigateTo({ url: `/pages/edit/edit?id=${this.data.id}` })
  },

  async onToggle() {
    const memo = this.data.memo
    if (!memo) return
    const updated = markDone(memo.id, !memo.done)
    if (updated) await syncMemoToCloud(updated)
    this.load()
  },

  async onResubscribe() {
    const app = getApp()
    const templateId =
      (app && app.globalData && app.globalData.subscribeTemplateId) ||
      wx.getStorageSync('subscribeTemplateId') ||
      ''
    if (!templateId) {
      wx.showModal({
        title: '未配置模板',
        content: '请先在「设置」中填写订阅消息模板 ID，并在公众平台开通订阅消息。',
        showCancel: false
      })
      return
    }
    const res = await requestSubscribe(templateId)
    if (res.ok) {
      const updated = saveMemo({ id: this.data.id, subscribed: true })
      await syncMemoToCloud(updated)
      wx.showToast({ title: '已授权', icon: 'success' })
      this.load()
    } else {
      wx.showToast({ title: '未授权订阅', icon: 'none' })
    }
  },

  onDelete() {
    wx.showModal({
      title: '删除备忘',
      content: '确定删除？',
      success: async (res) => {
        if (!res.confirm) return
        removeMemo(this.data.id)
        await removeMemoCloud(this.data.id)
        wx.navigateBack()
      }
    })
  }
})
