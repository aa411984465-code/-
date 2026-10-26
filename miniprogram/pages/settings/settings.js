Page({
  data: {
    cloudEnvId: '',
    subscribeTemplateId: ''
  },

  onShow() {
    const app = getApp()
    this.setData({
      cloudEnvId:
        wx.getStorageSync('cloudEnvId') ||
        (app.globalData && app.globalData.cloudEnvId) ||
        '',
      subscribeTemplateId:
        wx.getStorageSync('subscribeTemplateId') ||
        (app.globalData && app.globalData.subscribeTemplateId) ||
        ''
    })
  },

  onEnv(e) {
    this.setData({ cloudEnvId: e.detail.value.trim() })
  },

  onTpl(e) {
    this.setData({ subscribeTemplateId: e.detail.value.trim() })
  },

  onSave() {
    const { cloudEnvId, subscribeTemplateId } = this.data
    wx.setStorageSync('cloudEnvId', cloudEnvId)
    wx.setStorageSync('subscribeTemplateId', subscribeTemplateId)

    const app = getApp()
    if (app && app.globalData) {
      app.globalData.cloudEnvId = cloudEnvId
      app.globalData.subscribeTemplateId = subscribeTemplateId
    }

    if (wx.cloud && cloudEnvId) {
      try {
        wx.cloud.init({ env: cloudEnvId, traceUser: true })
      } catch (e) {
        console.warn(e)
      }
    }

    wx.showToast({ title: '已保存', icon: 'success' })
  }
})
