const Controller = require('egg').Controller
const _ = require('lodash')
const tree = require('../utils/tree.js')
class ResourcesController extends Controller {
  async getAllResourcesByOrgId () {
    const ctx = this.ctx
    const data = await ctx.service.resources.getAllResourcesByOrgId(ctx.params.orgId)
    ctx.body = data
  }
  /**
   * @name getOrgAssignedResTree 设备列表分页查询
   * @query oid 机构ID
   * @query restype 资源类型
   * @query orgtype 机构类型
   *
  */
  async getOrgAssignedResTree () {
    const ctx = this.ctx
    let restype
    if (ctx.query.restype) {
      restype = ctx.query.restype.split(',')
    } else {
      restype = []
    }
    const data = await ctx.service.resources.getOrgAssigndResTree({
      oid: ctx.query.oid || '',
      restype: restype,
      orgtype: ctx.query.orgtype || ''
    })
    ctx.body = data
  }
  /**
   * @name getOrgAssignedResList 设备列表分页查询
   * @query oid 机构ID
   * @query limit 页大小
   * @query seek 查询字段
   * @query page 分页
   * @query sub 是够显示子机构 1 是 0 否
  */
  async getOrgAssignedResList () {
    const ctx = this.ctx
    if (!ctx.query.oid) {
      ctx.throw(404, { code: 1010, message: '请求参数不能为空' })
    }
    if (!_.isEmpty(ctx.query.seek)) {
      ctx.query.seek = ctx.query.seek.replace(/\./g, '\\.')
    }
    let page = ctx.query.page ? parseInt(ctx.query.page) : 1
    let limit = ctx.query.limit ? parseInt(ctx.query.limit) : 20
    // 创建参数
    const params = {
      skip: (page - 1) * limit,
      limit: limit || 20,
      sort: '',
      fields: '_id chan name',
      population: {
        path: 'eid',
        select: '_id name ip manufacturer cport',
        populate: {
          path: 'oid',
          select: 'name'
        }
      }
    }
    // 判断是否包含子机构并根据orgRes表获取res
    let orgRes = []
    let resIds = []
    if (ctx.query.sub === '1') {
      let orgs = await ctx.service.orgs.getAll(0)
      let allChildrenIds = []
      allChildrenIds = tree.getChildren(allChildrenIds, orgs, ctx.query.oid)
      allChildrenIds.push(ctx.query.oid)
      orgRes = await ctx.service.resources.getResByOrgId({ $in: allChildrenIds })
    } else {
      orgRes = await ctx.service.resources.getResByOrgId(ctx.query.oid)
    }
    orgRes.forEach(item => {
      item.resource && resIds.push(item.resource)
    })
    // 获取资源列表
    params.query = {
      _id: { $in: resIds },
      name: { $regex: ctx.query.seek || '' }
    }
    const [data, count] = await ctx.service.resources.getResPageList(params)
    ctx.set({
      'X-BSC-COUNT': count,
      'X-BSC-PAGES': Math.ceil(count / params.limit),
      'X-BSC-CUR': parseInt(page),
      'X-BSC-LIMIT': parseInt(params.limit)
    })
    ctx.body = data
  }
}
module.exports = ResourcesController