const Service = require('egg').Service
class InfluxDBService extends Service {
  async getDevsTodayStatus (ips) {
    const { influx } = this.app
    let arr = []
    ips = ips.split(',')
    for (let i = 0; i < ips.length; i++) {
      let data = await this.ctx.helper.doDevTodayStatus(influx, ips[i], null)
      if (data) {
        arr.push(data)
      }
    }
    return arr
  }
  async getDevHistoryStatus (category, ip, port, startTime, endTime, bigtype) {
    const { influx } = this.app
    let data = await this.ctx.helper.doDevHistoryStatus(influx, category, { ip, port }, startTime, endTime, this.ctx.model.Storage, bigtype)
    return data || []
  }
  async getDevsRecordLog (tag) {
    const { influx } = this.app
    let arr = []
    tag = JSON.parse(tag)
    for (let i = 0; i < tag.length; i++) {
      let data = await this.ctx.helper.doDevsRecordLog(influx, tag[i])
      if (data) {
        arr.push(data)
      }
    }
    return arr
  }
}
module.exports = InfluxDBService
