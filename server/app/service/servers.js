const Service = require('egg').Service
const mongoose = require('mongoose')
class Services extends Service {
  async addServers () { // 添加诊断服务器
    let server = await this.ctx.model.Service.find({ ip: this.ctx.request.body.ip, port: this.ctx.request.body.port })
    if (server.length !== 0) {
      this.ctx.status = 500
      return { error: '该设备已存在！' }
    }
    const maintenance = this.ctx.model.Service(this.ctx.request.body)
    return maintenance.save()
  }
  async serversList (page, limit) {
    let select = [
      { $match: {} },
      { $project: { name: 1, ip: 1, port: 1, remark: 1, _id: 1 } }
    ]
    let paging = [
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) }
    ]
    let [data, count] = await Promise.all([this.ctx.model.Service.aggregate([...select, ...paging]), this.ctx.model.Service.aggregate(select)])
    this.ctx.set({
      'X-BSC-COUNT': count.length,
      'X-BSC-PAGES': Math.ceil(count.length / this.ctx.query.limit),
      'X-BSC-CUR': parseInt(this.ctx.query.page),
      'X-BSC-LIMIT': parseInt(this.ctx.query.limit)
    })
    return data
  }
  async serversModification () {
    let server = this.ctx.model.Service.find({ _id: mongoose.Types.ObjectId(this.ctx.query.id) })
    if (server.length === 0) {
      this.ctx.status = 500
      return { error: '该设备不存在！' }
    }
    await this.ctx.model.Service.update({ _id: mongoose.Types.ObjectId(this.ctx.query.id) }, this.ctx.request.body)
    return { res: 'ok' }
  }
  async serversDelete () {
    // eslint-disable-next-line no-return-await
    return await this.ctx.model.Service.deleteMany({ _id: { $in: this.ctx.request.body.ids } })
  }
}
module.exports = Services
