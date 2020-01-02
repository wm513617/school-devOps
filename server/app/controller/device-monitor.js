const _ = require('lodash')
const tree = require('../utils/tree.js')
const Controller = require('egg').Controller
class DeviceMonitorController extends Controller {
  /**
   * 设备列表分页查询
   * @param page 页码
   * @param limit 每页数量
   * @param oid 父机构
   * @param status 设备在线 1 为在线  0 全部  -1为不在线
   * @param bigtype 设备类型
   * @param sub 是否显示子机构
   *
  */
  async getDeviceList () {
    console.time('test')
    const { ctx, app } = this
    if (!ctx.query.oid) {
      ctx.throw(404, { code: 1010, message: '请求参数不能为空' })
    }
    if (!_.isEmpty(ctx.query.seek)) {
      ctx.query.seek = ctx.query.seek.replace(/\./g, '\\.')
    }
    // 同步redis中的最新数据
    await ctx.service.devices.getwrite()
    // 从redis中读取所有的设备id
    // const [allDeviceIds, deviceIpString] = await Promise.all([
    //   app.redis.lrange('deviceIds', 0, -1),
    //   app.redis.get('deviceIps')
    // ])
    const allDeviceIds = await app.redis.lrange('deviceIds', 0, -1)
    if (_.isEmpty(allDeviceIds)) {
      ctx.status = 500
      ctx.body = {
        code: 500,
        message: '从redis中获取所有的设备id错误'
      }
      return
    }
    // 调用北京接口,获取所有在线的设备
    // const deviceOnline = await ctx.service.devices.devOnlineList()
    // let onlineDeviceIds = []
    // for (var item of deviceOnline.devOnlineList) {
    //   let Key = item.devIp + ':' + item.port
    //   onlineDeviceIds.push(JSON.parse(deviceIpString)[Key])
    // }
    // 假设设备的百分之九十全部在线
    console.timeEnd('test')
    console.log('***********************************')
    let onlineDeviceIds = allDeviceIds.slice(0, 27000)
    // 并集
    let onlineSet = new Set(onlineDeviceIds)
    let allSet = new Set(allDeviceIds)
    // let offlineDeviceIds = Array.from(new Set([...allSet].filter(x => !onlineSet.has(x))))
    let offline = new Set([...allSet].filter(x => !onlineSet.has(x)))
    const params = {
      query: {
        bigtype: ctx.query.bigtype,
        $or: [{ ip: { $regex: (ctx.query.seek + '') || '' } }, { name: { $regex: (ctx.query.seek + '') || '' } }],
        type: { $nin: ['alarmBox', 'alarmPillar'] }
        // shareServer: { $exists: false }  后面需要加上
      },
      // status: ctx.query.status,
      limit: parseInt(ctx.query.limit) || 25,
      page: parseInt(ctx.query.page) || 1,
      sort: 'order',
      fileds: '_id bigtype name ip manufacturer type cport status',
      population: { path: 'oid', select: '_id name' }
    }
    if (parseInt(ctx.query.status) === 0) {
      params.query._id = { $in: [...allSet] }
    } else if (parseInt(ctx.query.status) === 1) {
      params.query._id = { $nin: [...offline] }
    } else {
      params.query._id = { $in: [...offline] }
    }
    // if (parseInt(ctx.query.status) === -1) {
    //   params.query.status = false
    // } else if (parseInt(ctx.query.status) === 1) {
    //   params.query.status = true
    // }
    if (parseInt(ctx.query.sub) === 1) {
      let orgs = await ctx.service.orgs.getAll(0)
      let allChildrenIds = []
      allChildrenIds = tree.getChildren(allChildrenIds, orgs, ctx.query.oid)
      allChildrenIds.unshift(ctx.query.oid + '')
      params.query.oid = {
        $in: allChildrenIds
      }
    } else {
      params.query.oid = ctx.query.oid
    }

    // const result = await ctx.service.devices.getListByQuery(params)
    console.time('test')
    const [result, count, onlineNumber, offlineNumber] = await ctx.service.devices.getListByQuery(params)
    console.timeEnd('test')
    console.log('+++++++++++++++++++++++++++++++++++')
    ctx.set({
      'X-BSC-COUNT': count,
      'X-BSC-PAGES': Math.ceil(count / params.limit),
      'X-BSC-CUR': parseInt(params.page),
      'X-BSC-LIMIT': parseInt(params.limit),
      'X-BSC-ONLINENUMBER': onlineNumber,
      'X-BSC-OFFLINENUMBER': offlineNumber
    })
    ctx.body = result
  }
  async getDeviceCount () {
    const ctx = this.ctx

    if (!ctx.query.oid) {
      this.ctx.status = 500
      this.ctx.body = { message: '缺少机构id!' } // 数据库没有添加这个诊断服务器 不返回数据
      return
    }

    let orgs = await ctx.service.orgs.getAll(0)
    let allChildrenIds = []
    allChildrenIds = tree.getChildren(allChildrenIds, orgs, ctx.query.oid)
    allChildrenIds.unshift(ctx.query.oid + '')
    this.ctx.body = await this.ctx.service.devices.getDeviceCount({ oid: { $in: allChildrenIds }, type: { $nin: ['alarmBox', 'alarmPillar'] }, shareServer: { $exists: false } })
  }
  async exportDeviceList () {
    let orgs = await this.ctx.service.orgs.getAll(0)
    let allChildrenIds = []
    allChildrenIds = tree.getChildren(allChildrenIds, orgs, this.ctx.query.oid)
    allChildrenIds.unshift(this.ctx.query.oid + '')
    let mongoose = require('mongoose')
    allChildrenIds = allChildrenIds.map((item) => { return mongoose.Types.ObjectId(item) })

    let xlsx = await this.ctx.service.devices.exportDeviceList(allChildrenIds)
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
    let name = encodeURI(xlsx.filename, 'utf-8')
    this.ctx.set('Content-Disposition', `attachment; filename* = UTF-8''${name}`)
    this.ctx.body = xlsx.buffer
  }
}
module.exports = DeviceMonitorController
