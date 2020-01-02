module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema

  const OrgsSchema = new Schema({
    name: { // 节点或组织名称
      type: String,
      required: true
    },
    pid: { // 父节点id（自关联）
      type: Schema.Types.ObjectId,
      ref: 'Org'
    },
    isroot: { // 是否根节点
      type: Boolean,
      default: false
    },
    type: { // 机构类别（0：现场 1：车辆 2：人脸,3: 单兵,4: 巡更）
      type: Number,
      default: 0
    },
    order: { // 机构排序号
      type: Number,
      default: 0
    },
    code: { // 机构编号
      type: String
    },
    sid: { // 流媒体服务器
      type: Schema.Types.ObjectId,
      ref: 'Server'
    },
    previewmax: Number, // 预览路数上限
    playbackmax: Number, // 回放路数上限
    contact: String, // 机构联系人
    contactway: String, // 联系人电话
    remark: String, // 备注
    devices: [{ // 该机构下所有设备  //废弃机构和设备一对多对应关系，设备表中有oid
      type: Schema.Types.ObjectId,
      ref: 'Device'
    }],
    pinyin: String,
    shareServer: String, // 共享服务器
    shareType: String, // 共享类型
    nodeId: String, // 共享nodeId
    gbDevId: String, // 国际设备编码
    gbParentDevId: String, // 国际设备父节点编码
    status: { // 国标状态
      type: Number,
      default: 1
    }
  }, { timestamps: true })

  OrgsSchema
    .virtual('pname').get(function () {
      return this.pid
    })

  OrgsSchema
    .path('name')
    .validate(function (name) {
      return name.length
    }, 'name不可为空')

  OrgsSchema
    .pre('save', function (next) {
      next()
    })

  OrgsSchema.methods = {

    generateTreeData: function (originalData) {

    }
  }

  return mongoose.model('Orgs', OrgsSchema)
}
