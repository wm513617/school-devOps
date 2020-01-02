/*
 * @Author: dfk
 * @Date: 2019-05-25 11:58:04
 * @Last Modified by: dfk
 * @Last Modified time: 2019-09-26 20:09:46
 * 工单管理
 */

const Controller = require('egg').Controller
const moment = require('moment')
class WorkManagement extends Controller {
  async addWorkManagement() {
    this.ctx.body = await this.ctx.service.workmanagement.addWorkManagement()
  }
  async getTree() {
    let tree = await this.ctx.service.workmanagement.getTree()
    // 遍历删除空机构
    let removeIds = {}
    let findOrgIds = (tree) => {
      let children = tree.children
      let childrenLength = children.length - 1
      for (let index = childrenLength; index >= 0; index--) {
        const element = children[index]
        if (element.children && element.children.length === 0 && element.tierType === 'org') {
          // 删除空机构
          children.splice(index, 1)
          removeIds[element._id] = element._id
        } else if (element.children && element.children.length !== 0 && element.tierType === 'org') {
          findOrgIds(element)
        }
      }
      if (tree.children && tree.children.length === 0 && tree.tierType === 'org') {
        // 删除空机构
        removeIds[tree._id] = tree._id
      }
    }
    let removeOrg = (tree) => {
      let childrenLength = tree.children.length - 1
      for (let index = childrenLength; index >= 0; index--) {
        const element = tree.children[index]
        if (removeIds[element._id]) {
          tree.children.splice(index, 1)
        } else {
          if ((element.children && element.children.length !== 0 && element.tierType === 'org')) {
            removeOrg(element)
          }
        }
      }
    }
    findOrgIds(tree)
    removeOrg(tree)

    this.ctx.body = tree
  }
  async getList() {
    this.ctx.body = await this.ctx.service.workmanagement.getList()
  }
  async getParticulars() {
    this.ctx.body = await this.ctx.service.workmanagement.getParticulars()
  }
  async updateWorkManagement() {
    this.ctx.body = await this.ctx.service.workmanagement.updateWorkManagement()
  }
  async deleteWork() {
    this.ctx.body = await this.ctx.service.workmanagement.deleteWork()
  }
  async maintenanceConfirm() {
    this.ctx.body = await this.ctx.service.workmanagement.maintenanceConfirm()
  }
  async exportParticulars() {
    let xlsx = await this.ctx.service.workmanagement.exportParticulars()
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
    let name = encodeURI(xlsx.filename, 'utf-8')
    this.ctx.set('Content-Disposition', `attachment; filename* = UTF-8''${name}`)
    this.ctx.body = xlsx.buffer
  }
  async getWorkManagementOrder() {
    let ctx = this.ctx
    let serial = await ctx.service.workmanagement.getSerialNumber() // 获取工单序号
    this.ctx.body = `WO${moment(new Date()).format('YYYYMMDDHHmmss')}${serial}`
  }
}
module.exports = WorkManagement
