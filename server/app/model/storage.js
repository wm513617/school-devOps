module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema

  const stroageSchema = new Schema({
    // 存储服务器
    server: {
      type: String
    },
    // 存储路径
    path: {
      type: String
    },
    // 存储资源
    resource: {
      type: Schema.Types.ObjectId,
      ref: 'Resources',
      unique: true
    }
  }, { timestamps: true })
  return mongoose.model('Storage', stroageSchema)
}
