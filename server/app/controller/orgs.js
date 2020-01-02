const _ = require('lodash')
const tree = require('../utils/tree.js')

const Controller = require('egg').Controller
class OrgsController extends Controller {
  // 根据机构类型获取机构树
  async getOrgTree () {
    const ctx = this.ctx
    let allChildrenIds = []
    const root = await ctx.service.orgs.getRoot(ctx.query.type)
    let orgs = await ctx.service.orgs.getAll(ctx.query.type)
    const oid = root._id
    allChildrenIds = tree.getChildren(allChildrenIds, orgs, oid)
    allChildrenIds.unshift(oid + '')
    if (!_.isEmpty(allChildrenIds)) {
      orgs = await ctx.service.orgs.getByIds(allChildrenIds)
    }
    allChildrenIds = null
    const treeDatas = tree.transData2Tree(orgs, '_id', 'pid')
    ctx.body = treeDatas.length ? treeDatas[0] : {}
  }
  // 根据机构类型获取机构设备通道树

  // 懒加载树
  async getOneTree() {
    const data = await this.ctx.service.orgs.getOneTree()
    this.ctx.body = data
  }
  // 懒加载树搜索
  async getOneTreeSeek() {
    const data = await this.ctx.service.orgs.getOneTreeSeek()
    this.ctx.body = data
  }
  // 懒加载获取全部
  async getOneChildNod() {
    const data = await this.ctx.service.orgs.getOneChildNod()
    this.ctx.body = data
  }
}
module.exports = OrgsController
