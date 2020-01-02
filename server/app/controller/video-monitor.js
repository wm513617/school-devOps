const Controller = require('egg').Controller
const _ = require('lodash')
const tree = require('../utils/tree.js')
const mongoose = require('mongoose')

class VideoMonitorController extends Controller {
  /**
   * @name getVideoResList 设备列表分页查询
   * @param page 页码
   * @param limit 每页数量
   * @param oid 父机构
   * @param status 设备在线 1 为在线  0 全部  -1为不在线
   * @param record 是否在录像 1 为在线  0 全部  -1为不录像
   * @param full 录像是否完整  1 完整  0 全部  -1为不完整
   * @param sub 是否显示子机构：1显示 0不显示
   * @param seek 是否显示子机构：1显示 0不显示
   */
  async getVideoResList () {
    console.time('test')
    const ctx = this.ctx
    const params = {
      limit: parseInt(ctx.query.limit) || 25,
      page: parseInt(ctx.query.page) || 1,
      seek: ctx.query.seek,
      sub: ctx.query.sub,
      online: ctx.query.online,
      type: 0,
      status: ctx.query.status || '0',
      full: ctx.query.full || '0',
      record: ctx.query.record || '0',
      complete: ctx.query.complete || '0'
    }
    if (!_.isEmpty(params.seek)) {
      params.seek = params.seek.replace(/\./g, '\\.')
    }
    // 通过机构查找资源
    let orgRes = []
    let resIds = []
    if (params.sub === '1') {
      // 勾选子机构
      let orgs = await ctx.service.orgs.getAll(0) // 获取所有机构
      let allChildrenIds = []
      allChildrenIds = tree.getChildren(allChildrenIds, orgs, ctx.query.oid) // 拿到该节点下的所有子节点
      allChildrenIds.push(ctx.query.oid)
      orgRes = await ctx.service.resources.getResByOrgId({
        $in: allChildrenIds
      }) // 拿到所有节点下的资源
    } else {
      orgRes = await ctx.service.resources.getResByOrgId(ctx.query.oid)
    }
    orgRes.forEach(item => {
      item.resource && resIds.push(item.resource + '')
    })
    // 同步redis中的最新数据
    await ctx.service.devices.getwrite()
    // 调用北京接口,获取所有在线的设备
    const [deviceOnline, deviceIpString] = await Promise.all([
      ctx.service.devices.devOnlineList(),
      this.app.redis.get('deviceIps')
    ])
    let onlineDeviceIds = []
    let resOnlineIds = []
    let ids = []
    for (var item of deviceOnline.devOnlineList) {
      let Key = item.devIp + ':' + item.port
      onlineDeviceIds.push(JSON.parse(deviceIpString)[Key])
    }
    // 查找所有在线设备下的资源id
    let resOnlineIdObjs = await ctx.model.Resources.find({ eid: { $in: onlineDeviceIds } }, '_id').lean().exec()
    resOnlineIdObjs.forEach(item => {
      resOnlineIds.push(item._id + '')
    })
    if (ctx.query.status === '0') {
      ids = resIds
    } else if (ctx.query.status === '1') {
      // 过滤掉未分配的资源(求交集)
      ids = resIds.filter(v => resOnlineIds.includes(v))
    } else {
      // 求交集得到在线的资源id，再求差集得到未在线的资源id
      let idsOnline = resIds.filter(v => resOnlineIds.includes(v))
      ids = resIds.concat(idsOnline).filter(v => resIds.includes(v) ^ idsOnline.includes(v))
    }
    console.timeEnd('test')
    console.log('+++++++++++++++')
    // 获取录像状态
    if (params.record !== '0') {
      resIds = await ctx.service.resources.recordStatus(resIds, params.record)
    }

    if (params.complete !== '0') {
      resIds = await ctx.service.resources.recordComplete(resIds, params.complete)
    }
    let queryArr = []
    ids.forEach(item => {
      queryArr.push(mongoose.Types.ObjectId(item))
    })
    let resQuery = Object.assign(params, { resIds: queryArr })
    // 是否进行正在录像查询:
    console.time('test')
    const [data, count] = await ctx.service.resources.getReslistToVideoMonitor(
      resQuery
    )
    console.timeEnd('test')
    console.log('--------------------')
    ctx.set({
      'X-BSC-COUNT': count,
      'X-BSC-PAGES': Math.ceil(count / params.limit),
      'X-BSC-CUR': parseInt(params.page),
      'X-BSC-LIMIT': parseInt(params.limit)
    })
    ctx.body = data
  }
  /**
   * @name exportVideoResList 设备列表导出
   * @param page 页码
   * @param limit 每页数量
   * @param oid 父机构
   * @param status 设备在线 1 为在线  0 全部  -1为不在线
   * @param record 是否在录像 1 为在线  0 全部  -1为不录像
   * @param full 录像是否完整  1 完整  0 全部  -1为不完整
   * @param sub 是否显示子机构：1显示 0不显示
   * @param seek 是否显示子机构：1显示 0不显示
   */
  async exportVideoResList () {
    const ctx = this.ctx
    const params = {
      seek: ctx.query.seek,
      sub: ctx.query.sub,
      online: ctx.query.online,
      type: 0,
      status: ctx.query.status || '0',
      full: ctx.query.full || '0',
      record: ctx.query.record || '0',
      complete: ctx.query.complete || '0'
    }
    if (!_.isEmpty(params.seek)) {
      params.seek = params.seek.replace(/\./g, '\\.')
    }
    // 通过机构查找资源
    let orgRes = []
    let resIds = []
    if (params.sub === '1') {
      // 勾选子机构
      let orgs = await ctx.service.orgs.getAll(0) // 获取所有机构
      let allChildrenIds = []
      allChildrenIds = tree.getChildren(allChildrenIds, orgs, ctx.query.oid) // 拿到该节点下的所有子节点
      allChildrenIds.push(ctx.query.oid)
      orgRes = await ctx.service.resources.getResByOrgId({
        $in: allChildrenIds
      }) // 拿到所有节点下的资源
    } else {
      orgRes = await ctx.service.resources.getResByOrgId(ctx.query.oid)
    }
    orgRes.forEach(item => {
      item.resource && resIds.push(mongoose.Types.ObjectId(item.resource))
    })
    // 获取录像状态
    if (params.record !== '0') {
      resIds = await ctx.service.resources.recordStatus(resIds, params.record)
    }
    if (params.complete !== '0') {
      resIds = await ctx.service.resources.recordComplete(resIds, params.complete)
    }
    let resQuery = Object.assign(params, { resIds: resIds })

    const xlsx = await ctx.service.resources.exportVideoResList(
      resQuery
    )
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
    let name = encodeURI(xlsx.filename, 'utf-8')
    this.ctx.set('Content-Disposition', `attachment; filename* = UTF-8''${name}`)
    this.ctx.body = xlsx.buffer
  }
  async getStorageTree () {
    this.ctx.body = await this.ctx.service.resources.getStorageTree()
  }
  async getStorageList () {
    // 按储存设备获取资源
    const ctx = this.ctx
    const params = {
      limit: parseInt(ctx.query.limit) || 25,
      page: parseInt(ctx.query.page) || 1,
      seek: ctx.query.seek,
      sub: ctx.query.sub,
      online: ctx.query.online,
      type: 0,
      status: ctx.query.status || '0',
      full: ctx.query.full || '0',
      record: ctx.query.record || '0',
      complete: ctx.query.complete || '0'
    }
    const [data, count] = await ctx.service.resources.getStorageList(
      params
    )
    ctx.set({
      'X-BSC-COUNT': count,
      'X-BSC-PAGES': Math.ceil(count / params.limit),
      'X-BSC-CUR': parseInt(params.page),
      'X-BSC-LIMIT': parseInt(params.limit)
    })
    ctx.body = data
  }
  async exportStorageList () {
    // 按储存设备获取资源
    const ctx = this.ctx
    const params = {
      seek: ctx.query.seek,
      sub: ctx.query.sub,
      online: ctx.query.online,
      type: 0,
      status: ctx.query.status || '0',
      full: ctx.query.full || '0',
      oid: ctx.query.oid,
      record: ctx.query.record || '0',
      complete: ctx.query.complete || '0'
    }
    // 录像监测导出列表支持状态
    let xlsx = await this.ctx.service.resources.exportStorageList(params)
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
    let name = encodeURI(xlsx.filename, 'utf-8')
    this.ctx.set('Content-Disposition', `attachment; filename* = UTF-8''${name}`)
    this.ctx.body = xlsx.buffer
  }
  async getRecodeStatus () {
    // 按储存设备获取资源
    this.ctx.body = await this.ctx.service.resources.getRecodeStatus()
  }

  async getDevRecodeStatus () {
    // 按储存设备获取资源
    this.ctx.body = await this.ctx.service.resources.getDevRecodeStatus()
  }

  async doRecordHistory () {
    this.ctx.body = await this.ctx.service.resources.doRecordHistory()
  }
}
module.exports = VideoMonitorController
