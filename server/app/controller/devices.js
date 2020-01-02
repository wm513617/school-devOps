// const _ = require('lodash')
// const tree = require('../utils/tree.js')
const Controller = require('egg').Controller
class DevicesController extends Controller {
  async getAllDevices () {
    const ctx = this.ctx
    const data = await ctx.service.devices.getAllDevices(ctx.params.orgId)
    ctx.body = data
  }
}
module.exports = DevicesController
