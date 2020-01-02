const Controller = require('egg').Controller
class InfluxDBController extends Controller {
  async getDevsTodayStatus () {
    const ctx = this.ctx
    const data = await ctx.service.influxdb.getDevsTodayStatus(
      ctx.request.body.ips
    )
    ctx.body = data
  }
  async getDevHistoryStatus () {
    const ctx = this.ctx
    const data = await ctx.service.influxdb.getDevHistoryStatus(
      ctx.query.category,
      ctx.query.ip,
      ctx.query.port,
      ctx.query.startTime,
      ctx.query.endTime,
      ctx.query.bigtype
    )
    ctx.body = data
  }
  async getDevsRecordLog () {
    const ctx = this.ctx
    const data = await ctx.service.influxdb.getDevsRecordLog(
      ctx.request.body.tag
    )
    ctx.body = data
  }
}
module.exports = InfluxDBController
