const Controller = require('egg').Controller
class LogControlle extends Controller {
  async selectLog() {
    this.ctx.body = await this.ctx.service.log.selectLog()
  }
  async exportLog() {
    let xlsx = this.ctx.body = await this.ctx.service.log.exportLog()
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
    let name = encodeURI(xlsx.filename, 'utf-8')
    this.ctx.set('Content-Disposition', `attachment; filename* = UTF-8''${name}`)
    this.ctx.body = xlsx.buffer
  }
  async particularsLog() {
    this.ctx.body = await this.ctx.service.log.particularsLog()
  }
}
module.exports = LogControlle
