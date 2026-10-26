const { listMemos, markDone, syncMemoToCloud } = require('../../utils/storage')
const { formatDateTime, checkDueReminders } = require('../../utils/reminder')
const { relativeLabel } = require('../../utils/time')

Page({
  data: {
    filter: 'todo',
    list: []
  },

  onShow() {
    this.refresh()
    checkDueReminders({ forceModal: true })
  },

  refresh() {
    const now = Date.now()
    const filter = this.data.filter
    let list = listMemos({ includeDone: true }).map((m) => ({
      ...m,
      isDue: !!(m.remindAt && m.remindAt <= now && !m.done),
      remindLabel: m.remindAt ? formatDateTime(m.remindAt) : '',
      relative: relativeLabel(m.remindAt)
    }))

    if (filter === 'todo') {
      list = list.filter((m) => !m.done)
    } else if (filter === 'due') {
      list = list.filter((m) => m.isDue)
    }

    this.setData({ list })
  },

  onFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.f }, () => this.refresh())
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/edit/edit' })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` })
  },

  async toggleDone(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.list.find((m) => m.id === id)
    if (!item) return
    const updated = markDone(id, !item.done)
    if (updated) await syncMemoToCloud(updated)
    this.refresh()
  },

  noop() {}
})
