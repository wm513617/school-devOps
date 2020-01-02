const Service = require('egg').Service
class MaintenanceUnit extends Service {
  async maintenanceList() {
    let page = this.ctx.query.page || 1
    let limit = this.ctx.query.limit || 25
    this.ctx.body = await this.ctx.service.maintenanceUnit.maintenanceList(page, limit)
  }
  async maintenanceModification() {
    this.ctx.body = await this.ctx.service.maintenanceUnit.maintenanceModification()
  }
  async deleteMany() {
    this.ctx.body = await this.ctx.service.maintenanceUnit.deleteMany()
  }
  async addMaintenance() {
    this.ctx.body = await this.ctx.service.maintenanceUnit.addMaintenance()
  }
}
module.exports = MaintenanceUnit
