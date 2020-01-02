module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema

  const OpsConfiguration = new Schema({
    videoLose: { // 录像丢失时长 单位秒
      type: Number,
      min: 5,
      max: 3600
    },
    openRemind: { // 是否开启提醒
      type: Number,
      enum: [0, 1] // 0 关闭 1 开启
    },
    remindInterval: { // 提醒间隔 单位 小时
      type: Number,
      min: 1,
      max: 1000
    }
  }, { timestamps: true })

  return mongoose.model('OpsConfiguration', OpsConfiguration)
}
