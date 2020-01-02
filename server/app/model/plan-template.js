module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema

  const segementSchema = new Schema({
    //  开始时间
    beginTime: {
      type: Number,
      required: true
    },
    //  结束时间
    endTime: {
      type: Number,
      required: true
    }
  }, { _id: false })

  const elementSchema = new Schema({
    // 星期几
    week: {
      type: Number,
      required: true
    },
    // 时间段
    timeList: [segementSchema]
  }, { _id: false })

  const planTemplateSchema = new Schema({
    // 模板名称
    name: {
      type: String,
      required: true
    },
    // 模板计划
    elements: [elementSchema]
  }, { timestamps: true })

  return mongoose.model('PlanTemplate', planTemplateSchema)
}
