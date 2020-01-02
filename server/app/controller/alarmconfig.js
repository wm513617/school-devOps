const Controller = require('egg').Controller
class Alarmconfig extends Controller {
  async gainAlarmConfig() {
    this.ctx.body = await this.ctx.service.alarmconfig.gainAlarmConfig()
  }
  async addAlarmConfig() {
    this.ctx.body = await this.ctx.service.alarmconfig.addAlarmConfig()
  }
}
module.exports = Alarmconfig
