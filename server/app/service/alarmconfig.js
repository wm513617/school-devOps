const Controller = require('egg').Controller
class Alarmconfig extends Controller {
  async gainAlarmConfig() {
    return this.ctx.model.Opsconfiguration.find({})
  }
  async addAlarmConfig(){
    let alam = await this.ctx.model.Opsconfiguration.find({})
    if (!alam.length) {
      let add = this.ctx.model.Opsconfiguration(this.ctx.request.body)
      return add.save()
    } else {
      return await this.ctx.model.Opsconfiguration.update({}, this.ctx.request.body)
    }
  }
}
module.exports = Alarmconfig
// videoLose: { // 录像丢失时长 单位秒
//   type: Number,
//   min: 5,
//   max: 3600
// },
// openRemind: { // 是否开启提醒
//   type: Number,
//   enum: [0, 1], // 0 关闭 1 开启
// },
// remindInterval: { // 提醒间隔 单位 小时
//   type: Number,
//   min: 1,
//   max: 1000
// }
// {"videoLose":5,"openRemind": 1,"remindInterval":12}