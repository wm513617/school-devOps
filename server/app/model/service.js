module.exports = app => {
  const mongoose = app.mongoose
  var Schema = mongoose.Schema
  var serverSchema = new Schema(
    {
      name: {
        //  服务器名称
        type: String
      },
      ip: {
        // ip地址
        type: String
      },
      port: {
        // 设备端口
        type: Number
      },
      type: {
        // 服务器类型 0 诊断服务器
        type: Number
      },
      remark: {
        // 备注
        type: String
      }
    },
    {
      timestamps: true
    }
  )
  return mongoose.model('Server', serverSchema)
}
