const { checkDueReminders } = require('./utils/reminder')

App({
  globalData: {
    // 在微信公众平台开通云开发后，填入环境 ID
    cloudEnvId: '',
    // 订阅消息模板 ID（公众平台 → 功能 → 订阅消息）
    // 建议字段：thing1 事项名称、time2 提醒时间、thing3 备注
    subscribeTemplateId: '',
    userOpenId: ''
  },

  onLaunch() {
    // 设置页写入的本地配置优先
    const storedEnv = wx.getStorageSync('cloudEnvId')
    const storedTpl = wx.getStorageSync('subscribeTemplateId')
    if (storedEnv) this.globalData.cloudEnvId = storedEnv
    if (storedTpl) this.globalData.subscribeTemplateId = storedTpl

    if (wx.cloud) {
      const env = this.globalData.cloudEnvId
      wx.cloud.init({
        env: env || undefined,
        traceUser: true
      })
      this.ensureOpenId()
    } else {
      console.warn('基础库过低，无法使用云能力')
    }
  },


  onShow() {
    // 小程序回到前台时检查到期备忘，用对话框弹出（合规前台提醒）
    checkDueReminders({ forceModal: true })
    // 停留在前台时周期性检查（无法在真正后台执行）
    if (this._remindTimer) clearInterval(this._remindTimer)
    this._remindTimer = setInterval(() => {
      checkDueReminders({ forceModal: false })
    }, 30000)
  },

  onHide() {
    if (this._remindTimer) {
      clearInterval(this._remindTimer)
      this._remindTimer = null
    }
  },


  async ensureOpenId() {
    try {
      if (!wx.cloud) return
      const cached = wx.getStorageSync('openid')
      if (cached) {
        this.globalData.userOpenId = cached
        return cached
      }
      const { result } = await wx.cloud.callFunction({ name: 'login' })
      if (result && result.openid) {
        this.globalData.userOpenId = result.openid
        wx.setStorageSync('openid', result.openid)
        return result.openid
      }
    } catch (e) {
      console.warn('获取 openid 失败（可先用本地模式）', e)
    }
    return ''
  }
})
