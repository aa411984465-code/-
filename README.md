# 备忘提醒 · 微信小程序

可上架、支持 iOS 微信的备忘录提醒小程序。

## 能力说明（平台限制）

微信小程序（尤其 iOS）**不能真正后台常驻**，也不能在关闭后自行弹出系统对话框。本项目采用**可过审**方案：

| 场景 | 实现 |
|------|------|
| 打开 / 回到前台 | `wx.showModal` 对话框弹出到期备忘 |
| 关闭小程序后 | **订阅消息** → 微信「服务通知」 |
| 本地使用 | 无云开发也可：列表 + 前台弹窗 |

不要宣称「后台常驻弹窗」——审核与 iOS 均不允许。

## 目录

```
miniprogram/          # 小程序前端
  pages/index         # 备忘列表
  pages/edit          # 新建 / 编辑
  pages/detail        # 详情
  pages/settings      # 云环境 / 模板 ID
  utils/              # 存储与提醒逻辑
cloudfunctions/
  login               # 获取 openid
  sendReminder        # 发送订阅消息
  checkDue            # 定时扫描到期备忘（每分钟）
```

## 快速开始

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入本项目根目录，填入你的 **AppID**（`project.config.json`）
3. 不配云开发也可先跑通：新建备忘 → 把提醒时间设为当前附近 → 切到后台再回来，会弹对话框

## 开通「关闭后也能提醒」（推荐上架）

1. 开发者工具：开通 **云开发**，记下环境 ID  
2. 上传并部署云函数：`login`、`sendReminder`、`checkDue`  
3. 云数据库新建集合 `memos`（权限：仅创建者可读写），字段见 `cloudfunctions/db-schema.md`  
4. 公众平台 → **功能 → 订阅消息**，申请「待办 / 提醒」类模板  
   - 默认字段映射：`thing1` 事项、`time2` 时间、`thing3` 备注  
   - 若模板字段不同，改 `cloudfunctions/sendReminder/index.js` 的 `data`  
5. 云函数 `checkDue` 配置环境变量：`SUBSCRIBE_TEMPLATE_ID=你的模板ID`  
6. 确认 `checkDue/config.json` 中定时触发器已生效（每分钟）  
7. 小程序「设置」页填写云环境 ID 与模板 ID，保存后再新建带提醒的备忘并授权订阅  

## 上架检查清单

- [ ] 类目选择工具 / 效率等合适类目  
- [ ] 隐私协议与用户协议（若收集 openid / 云数据）  
- [ ] 订阅消息仅在用户点击保存等手势内请求  
- [ ] 文案不承诺「后台常驻 / 系统级强制弹窗」  
- [ ] iOS 真机验证：前台弹窗 + 订阅消息服务通知  

## 配置入口

- 代码默认：`miniprogram/app.js` → `globalData.cloudEnvId` / `subscribeTemplateId`  
- 或运行时：小程序内 **设置** 页（写入本地缓存）

## 许可证

MIT
