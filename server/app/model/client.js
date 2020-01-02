module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema
 return mongoose.model('alarmClient', new Schema())
}