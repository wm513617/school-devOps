const Controller = require("egg").Controller
class Services extends Controller {
  async addServers() { // 添加诊断服务器
    this.ctx.body = await this.ctx.service.servers.addServers()
  }
  async serversList() {
    let page = this.ctx.query.page || 1
    let limit = this.ctx.query.limit || 25
    this.ctx.body = await this.ctx.service.servers.serversList(page, limit)
  }
  async serversModification() {
    this.ctx.body = await this.ctx.service.servers.serversModification()
  }
  async serversDelete() {
    this.ctx.body = await this.ctx.service.servers.serversDelete()
  }
}
module.exports = Services
