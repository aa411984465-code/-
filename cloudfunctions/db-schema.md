# 云数据库集合说明

## 集合 `memos`

在云开发控制台创建集合 `memos`，权限建议：

- 所有用户可读：仅创建者可读
- 所有用户可写：仅创建者可写

| 字段 | 类型 | 说明 |
|------|------|------|
| clientId | string | 小程序本地 id |
| title | string | 标题 |
| content | string | 内容 |
| remindAt | number | 提醒时间戳 ms |
| done | boolean | 是否完成 |
| notified | boolean | 是否已发送/弹过 |
| subscribed | boolean | 用户是否授权订阅 |
| createdAt | number | 创建时间 |
| updatedAt | number | 更新时间 |
| _openid | string | 云自动注入 |

索引建议：`remindAt` 升序；或复合 `{ done, notified, subscribed, remindAt }`。
