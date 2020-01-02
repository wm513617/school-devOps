module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema

  // 机构资源中间表
  const OrgResSchema = new Schema({
    org: { // 关联的机构
      type: Schema.Types.ObjectId,
      ref: 'Orgs',
      required: true
    },
    resource: { // 关联的资源
      type: Schema.Types.ObjectId,
      ref: 'Resources',
      required: true
    },
    rootorg: { // 根机构id（方便查询而已）
      type: Schema.Types.ObjectId,
      ref: 'Orgs',
      required: true
    },
    islane: { // 该资源是否挂载在车道
      type: Boolean,
      default: false // 默认为false，直接挂载在机构上
    },
    shareServer: {
      type: String // 分享平台
    }
  }, { timestamps: true })

  return mongoose.model('OrgRes', OrgResSchema)
}
