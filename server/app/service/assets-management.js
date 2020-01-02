const Controller = require('egg').Controller
const mongoose = require('mongoose')
const moment = require('moment')
const xlsx = require('node-xlsx')
class AssetsManagementController extends Controller {
  /**
   * @description:
   * @param {oid} 机构id
   * @return: 返回该机构下所有的子机构id
   */
  async descendantOrg (oid) {
    let orgArr = []
    let findOrg = async (oids) => {
      let orgs = await this.ctx.model.Orgs.find({ $and: [ { pid: { $in: oids } }, { type: 0 } ] }, { _id: 1, name: 1 })
      let orgId = orgs.map((val) => {
        return val._id
      })
      orgArr = [...orgId, ...orgArr]
      if (orgId.length !== 0) {
        await findOrg(orgId)
      }
    }
    await findOrg([oid])
    return orgArr
  }
  async returnIdType (type) { // 返回id类型
    let resourceType = [0, 1, 4, 5, 13, 12]
    let deviceType = [2, 3, 8, 10, 11]
    let idType = ''
    if (resourceType.includes(Number(this.ctx.query.type))) { idType = 'rid' }
    if (deviceType.includes(Number(this.ctx.query.type))) { idType = 'eid' }
    if (Number(this.ctx.query.type) === 6) { idType = 'aid' }
    return idType
  }
  /**
   * @description: 更新维保状态
   * @param {ids} 要更细的设备_id数组
   * @return:
   */
  async updateMaintenanceState () { // 更新数据库维保状态
    let idType = await this.ctx.service.assetsManagement.returnIdType(this.ctx.query.type)
    let list = await this.ctx.service.assetsManagement.queriesCount(this.ctx.query.oid, this.ctx.query.type, this.ctx.query.sub, false)
    for (const iterator of list) {
      let obj = {}
      obj[idType] = mongoose.Types.ObjectId(iterator._id)
      let extend = await this.ctx.model.DeviceExtend.find(obj, { endTime: 1, _id: 1 })
      if (!extend.length) { continue }
      let state = await this.ctx.service.assetsManagement.maintenanceState(extend.length ? extend[0].endTime : 0)
      await this.ctx.model.DeviceExtend.update({ '_id': mongoose.Types.ObjectId(extend[0]._id) }, { $set: { 'state': state } })
    }
  }
  async maintenanceState (endTime) { // 维保状态 0： 过保, 1:在保
    if (!endTime) {
      return 0
    }
    let newDate = moment(new Date()).unix()
    if ((endTime - newDate) > 0) {
      return 1
    } else {
      return 0
    }
  }
  /** 0：视频通道 1：视频报警输入 2：视频报警输出通道 3：对讲通道 4：门禁通道 5：解码通道 6：音频通道 7：解码报警输入
      // 8：解码报警输出 9：报警主机报警输入 10：报警主机报警输出 11：消防输入防区 12：消防输出防区 ,15 拼接输入通道
   * @description: 查询机构下的所有设备数
   * @param {type} 0：摄像机 1：录像机 2：报警主机 3：消防主机 4：报警输入 5：消防输入 6：报警箱 7：闸机 8：解码器 9：服务器 10：网络键盘 11：拼接控制器 12：人脸抓拍机 13：结构化相机 14：门禁点位
   * @param {oid} 机构id
   * @param {sub} 机构是否勾选子机构 0：不包含子机构 1：包含子机构
   * @param {count} true 查条数 false 查数据
   * @param {isExport} true 是不是导出  导出 不做分页
   * @return: 设备总数
   */
  async queriesCount (oid, type, sub, count, state, isExport) {
    let orgIds = [] // 所有的机构id 不包含当前机构
    let resourceType = [0, 1, 4, 5, 13, 12]
    let deviceType = [2, 3, 8, 10, 11]
    if (Number(sub)) {
      orgIds = await this.ctx.service.assetsManagement.descendantOrg(this.ctx.query.oid)
    }
    if (resourceType.includes(Number(type))) { // 这些去资源表中查询
      let select = [
        { $match: { org: { $in: [mongoose.Types.ObjectId(oid), ...orgIds] } } },
        { $lookup: { from: 'orgs', localField: 'org', foreignField: '_id', as: 'org' } },
        { $lookup: { from: 'resources', localField: 'resource', foreignField: '_id', as: 'resource' } },
        { $lookup: { from: 'devices', localField: 'resource.eid', foreignField: '_id', as: 'device' } },
        { $lookup: { from: 'deviceextends', localField: 'resource._id', foreignField: 'rid', as: 'deviceextend' } }
      // { $match: { $or: [{ 'resource.name': { $regex: this.ctx.query.seek + '' || '' } }, { 'resource.ip': { $regex: this.ctx.query.seek + '' || '' } }] } }
      // { $project: {'resources.name': 1,'resource.eid':1, org: 1, 'device.type':1, 'device.bigtype':1} }
      ]
      if (state) {
        if (Number(state) === 1) {
          select.push({ $match: { 'deviceextend.state': Number(state) } })
        } else {
          select.push({ $match: { 'deviceextend.state': { $ne: 1 } } })
        }
      }
      switch (Number(type)) {
        case 0:
          select.push({ $match: { 'device.type': 'ipc', 'resource.videoStructure.structureServer': { $exists: false }, 'device.series': { $nin: ['BSR-IPHK', 'BSR-IPHAW'] } } })
          break
        case 1:
          select.push({ $match: { 'device.type': 'nvr' } })
          break
        case 4:
          select.push({ $match: { $or: [ { 'resource.type': { $in: [ 1, 9 ] } } ] } })
          break
        case 5:
          select.push({ $match: { 'resource.type': 11 } })
          break
        case 13:
          select.push({ $match: { 'resource.type': 0, 'resource.videoStructure.structureServer': { $exists: true } } })
          break
        case 12:
          select.push({ $match: { 'device.bigtype': 0, 'device.series': { $in: ['BSR-IPHK', 'BSR-IPHAW'] } } })
          break
      }
      let classify = []
      if (count) { // 查总条数
        classify = [
          { $match: { $or: [{ 'resource.name': { $regex: this.ctx.query.seek + '' || '' } }, { 'resource.ip': { $regex: this.ctx.query.seek + '' || '' } }] } },
          { $project: { org: 1 } }, { $count: 'org' }
        ]
        console.log(JSON.stringify([...select, ...classify]), '分页')
      } else {
        classify = [
          // { $match: { $or: [{ 'resource.name': { $regex: this.ctx.query.seek + '' || '' } }, { 'resource.ip': { $regex: this.ctx.query.seek + '' || '' } }] } },
          { $project: { 'org.name': 1, 'resource._id': 1, 'resource.name': 1, 'resource.ip': 1, 'resource.gbPlaDevIp': 1, 'device.manufacturer': 1, 'deviceextend.maintenanceVendor': 1, 'deviceextend._id': 1, 'deviceextend.constructTime': 1, 'deviceextend.state': 1, 'deviceextend.endTime': 1 } }
        ]
        if (!isExport) { // 导出还是获取列表
          classify = [
            // { $match: { $or: [{ 'resource.name': { $regex: this.ctx.query.seek + '' || '' } }, { 'resource.ip': { $regex: this.ctx.query.seek + '' || '' } }] } },
            { $match: { $or: [{ 'resource.name': { $regex: this.ctx.query.seek + '' || '' } }, { 'resource.ip': { $regex: this.ctx.query.seek + '' || '' } }] } },
            { $project: { 'org.name': 1, 'resource._id': 1, 'resource.name': 1, 'resource.ip': 1, 'resource.gbPlaDevIp': 1, 'device.manufacturer': 1, 'deviceextend.maintenanceVendor': 1, 'deviceextend._id': 1, 'deviceextend.constructTime': 1, 'deviceextend.state': 1, 'deviceextend.endTime': 1 } },
            { $skip: (this.ctx.query.page - 1) * this.ctx.query.limit },
            { $limit: Number(this.ctx.query.limit) }
          ]
        }
      }
      let orgresList = await this.ctx.model.OrgRes.aggregate([...select, ...classify])
      if (count) {
        return orgresList
      } else {
        let assetsList = [] // 格式化数据
        for (const element of orgresList) {
          assetsList.push({
            _id: element.resource[0]._id,
            name: element.resource[0].name,
            ip: element.resource[0].ip || element.resource[0].gbPlaDevIp,
            orgName: element.org[0].name,
            manufacturer: element.device[0].manufacturer,
            type: type,
            constructTime: element.deviceextend.length ? element.deviceextend[0].constructTime : '',
            state: element.deviceextend.length ? element.deviceextend[0].state : '',
            endTime: element.deviceextend.length ? element.deviceextend[0].endTime : '',
            maintenanceVendor: element.deviceextend.length ? element.deviceextend[0].maintenanceVendor : ''
          })
        }
        return assetsList
      }
    }
    if (deviceType.includes(Number(type))) { // 这些去设备表查询
      let select = [
        { $match: { oid: { $in: [ mongoose.Types.ObjectId(oid), ...orgIds ] } } },
        { $lookup: { from: 'orgs', localField: 'oid', foreignField: '_id', as: 'org' } },
        { $lookup: { from: 'deviceextends', localField: '_id', foreignField: 'eid', as: 'deviceextend' } }
        // { $match: { $or: [{ 'name': { $regex: this.ctx.query.seek + '' || '' } }, { 'ip': { $regex: this.ctx.query.seek + '' || '' } }] } }
      ]
      if (state) {
        if (Number(state) === 1) {
          select.push({ $match: { 'deviceextend.state': Number(state) } })
        } else {
          select.push({ $match: { 'deviceextend.state': { $ne: 1 } } })
        }
      }
      switch (Number(type)) {
        case 2:
          select.push({ $match: { 'bigtype': 1 } })
          break
        case 3:
          select.push({ $match: { 'bigtype': 7 } })
          break
        case 8:
          select.push({ $match: { 'bigtype': 5 } })
          break
        case 10:
          select.push({ $match: { 'bigtype': 6 } })
          break
        case 11:
          select.push({ $match: { 'bigtype': 9 } })
          break
        // case 12:
        //   select.push({ $match: { 'bigtype': 0, series: { $in: ['BSR-IPHK', 'BSR-IPHAW'] } } })
        //   break
      }
      let classify = []
      if (count) { // 查总条数
        classify = [
          { $match: { $or: [{ 'name': { $regex: this.ctx.query.seek + '' || '' } }, { 'ip': { $regex: this.ctx.query.seek + '' || '' } }] } },
          { $project: { name: 1 } }, { $count: 'name' }
        ]
      } else {
        classify = [
          { $match: { $or: [{ 'name': { $regex: this.ctx.query.seek + '' || '' } }, { 'ip': { $regex: this.ctx.query.seek + '' || '' } }] } },
          { $project: { _id: 1, name: 1, ip: 1, manufacturer: 1, 'org.name': 1, 'deviceextend.constructTime': 1, 'deviceextend.endTime': 1, 'deviceextend.maintenanceVendor': 1 } }
        ]
        if (!isExport) {
          classify = [
            // { $match: { $or: [{ 'name': { $regex: this.ctx.query.seek + '' || '' } }, { 'ip': { $regex: this.ctx.query.seek + '' || '' } }] } },
            { $project: { _id: 1, name: 1, ip: 1, manufacturer: 1, 'org.name': 1, 'deviceextend.constructTime': 1, 'deviceextend.endTime': 1, 'deviceextend.maintenanceVendor': 1 } },
            { $skip: (this.ctx.query.page - 1) * this.ctx.query.limit },
            { $limit: Number(this.ctx.query.limit) }
          ]
        }
      }
      let orgresList = await this.ctx.model.Devices.aggregate([...select, ...classify])
      // console.log([...select, ...classify], count, 99999)
      // return orgresList
      if (count) {
        return orgresList
      } else {
        let assetsList = [] // 格式化数据
        for (const element of orgresList) {
          assetsList.push({
            _id: element._id,
            name: element.name,
            ip: element.ip || element.gbPlaDevIp,
            orgName: element.org.name,
            manufacturer: element.manufacturer,
            type: type,
            constructTime: element.deviceextend.length ? element.deviceextend[0].constructTime : '',
            state: await this.ctx.service.assetsManagement.maintenanceState(element.deviceextend.length ? element.deviceextend[0].endTime : ''),
            endTime: element.deviceextend.length ? element.deviceextend[0].endTime : '',
            maintenanceVendor: element.deviceextend.length ? element.deviceextend[0].maintenanceVendor : ''
          })
        }
        return assetsList
      }
      // return this.ctx.model.Devices.aggregate([...select, ...classify])
    }
    if (Number(type) === 6) { // orgId  获取报警箱
      let isroot = true
      if (Number(this.ctx.query.isroot) === 1 || isExport) {
        isroot = false
      }
      if (isroot) { return [] } // 不是跟机构 就没有数据
      let select = [
        { $match: { deviceType: 'alarmBox' } },
        { $lookup: { from: 'devices', localField: 'camerDevId', foreignField: '_id', as: 'device' } },
        { $lookup: { from: 'deviceextends', localField: '_id', foreignField: 'aid', as: 'deviceextend' } }
        // { $match: { $or: [{ 'name': { $regex: this.ctx.query.seek + '' || '' } }, { 'device.ip': { $regex: this.ctx.query.seek + '' || '' } }] } }
      ]
      if (state) {
        if (Number(state) === 1) {
          select.push({ $match: { 'deviceextend.state': Number(state) } })
        } else {
          select.push({ $match: { 'deviceextend.state': { $ne: 1 } } })
        }
      }
      let classify = []
      if (count) { // 查总条数
        classify = [
          { $match: { $or: [{ 'name': { $regex: this.ctx.query.seek + '' || '' } }, { 'device.ip': { $regex: this.ctx.query.seek + '' || '' } }] } },
          { $project: { name: 1 } }, { $count: 'name' }
        ]
      } else {
        classify = [
          { $project: { 'name': 1, 'device.ip': 1, 'device.manufacturer': 1, 'deviceextend.maintenanceVendor': 1, 'deviceextend._id': 1, 'deviceextend.constructTime': 1, 'deviceextend.state': 1, 'deviceextend.endTime': 1 } }
        ]
        if (!isExport) { // 获取列表
          classify = [
            { $project: { 'name': 1, 'device.ip': 1, 'device.manufacturer': 1, 'deviceextend.maintenanceVendor': 1, 'deviceextend._id': 1, 'deviceextend.constructTime': 1, 'deviceextend.state': 1, 'deviceextend.endTime': 1 } },
            { $match: { $or: [{ 'name': { $regex: this.ctx.query.seek + '' || '' } }, { 'device.ip': { $regex: this.ctx.query.seek + '' || '' } }] } },
            { $skip: (this.ctx.query.page - 1) * this.ctx.query.limit },
            { $limit: Number(this.ctx.query.limit) }
          ]
        }
      }
      // return await this.ctx.model.Client.aggregate([...select, ...classify])
      let orgresList = await this.ctx.model.Client.aggregate([...select, ...classify])
      if (count) {
        return orgresList
      } else {
        let assetsList = [] // 格式化数据
        for (const element of orgresList) {
          assetsList.push({
            _id: element._id,
            name: element.name,
            ip: element.device[0].ip,
            orgName: '',
            manufacturer: element.device[0].manufacturer,
            type: type,
            constructTime: element.deviceextend.length ? element.deviceextend[0].constructTime : '',
            state: element.deviceextend.length ? element.deviceextend[0].state : '',
            endTime: element.deviceextend.length ? element.deviceextend[0].endTime : '',
            maintenanceVendor: element.deviceextend.length ? element.deviceextend[0].maintenanceVendor : ''
          })
        }
        return assetsList
      }
    }
    if (Number(type) === 7) { // 获取门禁通道
      // let select = [
      //   // { $match: { oid: { $in: [mongoose.Types.ObjectId(oid), ...orgIds]} } },
      //   { $match: { 'bigtype': 2 } },
      //   { $lookup: { from: 'resources', localField: '_id', foreignField: 'eid', as: 'resource' } }
      // ]
      // let classify = []
      // if (count) { // 查总条数
      //   classify = [{ $project: { name: 1} }, { $count: 'name'}]
      // } else {
      //   classify = [
      //     // { $project: { chan: 1, name: 1, 'orgres.resource': 1, 'orgs.name': 1, 'device.ip': 1, 'device.name': 1, 'device.manufacturer': 1 } },
      //     { $skip: (this.ctx.query.page - 1) * this.ctx.query.limit },
      //     { $limit: Number(this.ctx.query.limit) }
      //   ]
      // }
      // return await this.ctx.model.Devices.aggregate([...select, ...classify])
      return []
    }
    if (Number(type) === 9) {
      if (count) {
        return 0
      } else {
        return []
      }
    }
    if (Number(type) === 14) {
      if (count) {
        return 0
      } else {
        return []
      }
    }
  }
  async assetsCount () {
    this.ctx.query.seek = ''
    let total = {} // 0：摄像机 1：录像机 2：报警主机 3：消防主机 4：报警输入 5：消防输入 6：报警箱 7：闸机 8：解码器 9：服务器 10：网络键盘 11：拼接控制器 12：人脸抓拍机 13：结构化相机 14：门禁点位
    let resourceType = [0, 1, 4, 5, 13, 12]
    let deviceType = [2, 3, 8, 10, 11]
    let totalResource = await Promise.all(resourceType.map(val => { return this.ctx.service.assetsManagement.queriesCount(this.ctx.query.oid, val, Number(this.ctx.query.sub), true) }))
    let underResource = await Promise.all(resourceType.map(val => { return this.ctx.service.assetsManagement.queriesCount(this.ctx.query.oid, val, Number(this.ctx.query.sub), true, 1) }))
    let totalDevice = await Promise.all(deviceType.map(val => { return this.ctx.service.assetsManagement.queriesCount(this.ctx.query.oid, val, Number(this.ctx.query.sub), true) }))
    let underDevice = await Promise.all(deviceType.map(val => { return this.ctx.service.assetsManagement.queriesCount(this.ctx.query.oid, val, Number(this.ctx.query.sub), true, 1) }))
    let [totalAlarmBox, underAlarmBox] = await Promise.all([this.ctx.service.assetsManagement.queriesCount(this.ctx.query.oid, 6, Number(this.ctx.query.sub), true), this.ctx.service.assetsManagement.queriesCount(this.ctx.query.oid, 6, Number(this.ctx.query.sub), true, 1)])
    total.vidicon = {
      sum: totalResource[0].length !== 0 ? totalResource[0][0].org : 0, // 总数
      under: underResource[0].length !== 0 ? underResource[0][0].org : 0 // 在保
    }
    total.video = {
      sum: totalResource[1].length !== 0 ? totalResource[1][0].org : 0,
      under: underResource[1].length !== 0 ? underResource[1][0].org : 0
    }
    total.alarmInput = {
      sum: totalResource[2].length !== 0 ? totalResource[2][0].org : 0,
      under: underResource[2].length !== 0 ? underResource[2][0].org : 0
    }
    total.firemenInput = {
      sum: totalResource[3].length !== 0 ? totalResource[3][0].org : 0,
      under: underResource[3].length !== 0 ? underResource[3][0].org : 0
    }
    total.structuring = {
      sum: totalResource[4].length !== 0 ? totalResource[4][0].org : 0,
      under: underResource[4].length !== 0 ? underResource[4][0].org : 0
    }
    total.face = {
      sum: totalResource[5].length !== 0 ? totalResource[5][0].org : 0,
      under: underResource[5].length !== 0 ? underResource[5][0].org : 0
    }

    total.alarmHost = {
      sum: totalDevice[0].length !== 0 ? totalDevice[0][0].name : 0,
      under: underDevice[0].length !== 0 ? underDevice[0][0].name : 0
    }
    total.firemenHost = {
      sum: totalDevice[1].length !== 0 ? totalDevice[1][0].name : 0,
      under: underDevice[1].length !== 0 ? underDevice[1][0].name : 0
    }
    total.decoder = {
      sum: totalDevice[2].length !== 0 ? totalDevice[2][0].name : 0,
      under: underDevice[2].length !== 0 ? underDevice[2][0].name : 0
    }
    total.keyboard = {
      sum: totalDevice[3].length !== 0 ? totalDevice[3][0].name : 0,
      under: underDevice[3].length !== 0 ? underDevice[3][0].name : 0
    }
    total.splicer = {
      sum: totalDevice[4].length !== 0 ? totalDevice[4][0].name : 0,
      under: underDevice[4].length !== 0 ? underDevice[4][0].name : 0
    }
    // console.log(totalAlarmBox, underAlarmBox, 5555)
    total.alarmBox = {
      sum: totalAlarmBox.length ? totalAlarmBox[0].name : 0,
      under: underAlarmBox.length ? underAlarmBox[0].name : 0
    }
    total.gate = { // 门禁设备
      sum: 0,
      under: 0
    }
    total.point = { // 门禁点位
      sum: 0,
      under: 0
    }
    // total.server = 0
    return total
    // return await this.ctx.service.assetsManagement.descendantOrg(this.ctx.query.oid)
    // return this.ctx.service.assetsManagement.queriesCount(this.ctx.query.oid, 2, 1, false)
  }
  async assetseQuipment () { // 获取数据
    // 0：摄像机 1：录像机 2：报警主机 3：消防主机 4：报警输入 5：消防输入 6：报警箱 7：闸机 8：解码器 9：服务器 10：网络键盘 11：拼接控制器 12：人脸抓拍机 13：结构化相机 14：门禁点位
    let resourceType = [0, 1, 4, 5, 13, 12]
    let deviceType = [2, 3, 8, 10, 11]
    await this.ctx.service.assetsManagement.updateMaintenanceState()
    // return await this.ctx.service.assetsManagement.queriesCount(this.ctx.query.oid, this.ctx.query.type, this.ctx.query.sub, false)
    let assetsList = await this.ctx.service.assetsManagement.queriesCount(this.ctx.query.oid, this.ctx.query.type, this.ctx.query.sub, false, this.ctx.query.state)
    let count = await this.ctx.service.assetsManagement.queriesCount(this.ctx.query.oid, this.ctx.query.type, this.ctx.query.sub, true, this.ctx.query.state)
    let total
    if (resourceType.includes(Number(this.ctx.query.type))) {
      total = count.length ? count[0].org : 0
    }
    if (deviceType.includes(Number(this.ctx.query.type))) {
      total = count.length ? count[0].name : 0
    }
    if (Number(this.ctx.query.type) === 9) {
      total = 0
    }
    if (Number(this.ctx.query.type) === 7) {
      total = 0
    }
    if (Number(this.ctx.query.type) === 6) {
      total = count.length ? count[0].name : 0
    }
    if (Number(this.ctx.query.type) === 14) {
      total = 0
    }
    this.ctx.set({
      'X-BSC-COUNT': total,
      'X-BSC-PAGES': Math.ceil(total / this.ctx.query.limit),
      'X-BSC-CUR': parseInt(this.ctx.query.page),
      'X-BSC-LIMIT': parseInt(this.ctx.query.limit)
    })
    return {
      assetsList
    }
  }
  async assetseExport () {
    // 0：摄像机 1：录像机 2：报警主机 3：消防主机 4：报警输入 5：消防输入 6：报警箱 7：闸机 8：解码器 9：服务器 10：网络键盘 11：拼接控制器 12：人脸抓拍机 13：结构化相机 14：门禁点位
    let manufacturerName = {
      'bstar': '蓝色星际',
      'dahua': '大华',
      'hikvision': '海康威视',
      'juanxin': '居安信'
    }
    let deviceType = {
      0: '摄像机',
      1: '录像机',
      2: '报警主机',
      3: '消防主机',
      4: '报警输入',
      5: '消防输入',
      6: '报警箱',
      7: '闸机',
      8: '解码器',
      9: '服务器',
      10: '网络键盘',
      11: '拼接控制器',
      12: '人脸抓拍机',
      13: '结构化相机',
      14: '门禁点位'
    }
    let assetsList = await this.ctx.service.assetsManagement.queriesCount(this.ctx.query.oid, this.ctx.query.type, 1, false, '', true)
    // console.log(assetsList, 666)
    // let assetsList = await this.ctx.service.assetsManagement.assetseQuipment()
    const data = [[ '设备名称', '所属机构', 'IP地址', '厂商', '设备类型', '建设时间', '维保厂商', '维保状态' ]]
    let newList = assetsList.map(item => {
      return {
        name: item.name,
        orgName: item.orgName,
        ip: item.ip,
        manufacturer: manufacturerName[item.manufacturer] ? manufacturerName[item.manufacturer] : item.manufacturer,
        type: deviceType[item.type],
        constructTime: item.constructTime ? moment(item.constructTime * 1000).format('YYYY-MM-DD HH:mm:ss') : '',
        maintenanceVendor: item.maintenanceVendor,
        state: item.state ? '在保' : '过保'
      }
    })
    newList.forEach(val => {
      data.push([val.name, val.orgName, val.ip, val.manufacturer, val.type, val.constructTime, val.maintenanceVendor, val.state])
    })
    let buffer = xlsx.build([{ name: '资产管理', data }])
    const timeStr = new Date().toLocaleString().replace(/[-: ]/g, '')
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
    let filename = `${'资产管理'}-${timeStr}.xlsx`
    return { buffer, filename }
  }
  async assetsModification () {
    // console.log(JSON.stringify(this.ctx), 665222)
    let idType = await this.ctx.service.assetsManagement.returnIdType(this.ctx.query.type)
    let obj = {}
    obj[idType] = mongoose.Types.ObjectId(this.ctx.query.id)
    let dev = await this.ctx.model.DeviceExtend.find(obj)
    console.log(this.ctx.request.body)
    // this.ctx.request.body.constructTime = Number(this.ctx.request.body.constructTime)
    if (dev.length === 0) {
      // return { error: '该设备不存在' }
      let maintenance = this.ctx.request.body
      maintenance[idType] = mongoose.Types.ObjectId(mongoose.Types.ObjectId(this.ctx.query.id))
      // return await this.ctx.model.DeviceExtend.insert(maintenance)
      const body = this.ctx.model.DeviceExtend(this.ctx.request.body)
      return body.save()
      //  await this.ctx.model.DeviceExtend.insert(maintenance)
    //  return {res: 'ok'}
    } else {
      // return await this.ctx.model.DeviceExtend.update(obj, this.ctx.request.body)
      return this.ctx.model.DeviceExtend.update(obj, this.ctx.request.body)
    //  return {res: 'ok'}
    }
  }
  async assetsParticulars () {
    let idType = await this.ctx.service.assetsManagement.returnIdType(this.ctx.query.type)
    let obj = {}
    obj[idType] = mongoose.Types.ObjectId(this.ctx.query.id)
    let dev = await this.ctx.model.DeviceExtend.find(obj)
    if (dev.length === 0) {
      let maintenanceObj = {
        constructTime: '', // 建设时间  时间戳 秒，
        longitude: '', // 纬度，
        latitude: '', // 经度，
        InstallPosition: '', // 安装位置
        district: '', // 警
        locationExtension: '', // 位置类型扩展  enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        // 0:空,1:省际检查站,2:党政机关,3:车站码头,4:中心广场,5:体育场馆,
        // 6:商业中心,7:宗教场所,8:校园周边,9:治安复杂区域,10:交通干线,
        site: '', // 安装位置  0:空 1:室内 2:室外
        usage: '', // 摄像机用途 0:空,1:治安,2:通 ,3:重点
        fill: '', // 摄像机补光  0:空,1:无补光，2:红外补光，3:白光补光
        monitoPosition: '', // 监视方位 0:空， 1 :东，2 :南，3 :西，4 :北，5 :东南，6 :东北，7 :西南，8 :西北
        supportGB: '', // 支持国标  0:空，1:是，2:否
        controllable: '', // 是否可控  0:空，1:是，2:否
        maintenanceVendor: '', // 维保厂商  string
        contacts: '', // 联系人 string
        phone: '', // 电话
        email: '', // 邮箱
        startTime: '', // 维保开始时间(秒)
        endTime: '' // 维保结束时间
      }
      maintenanceObj[idType] = mongoose.Types.ObjectId(this.ctx.query.id)
      const maintenance = this.ctx.model.DeviceExtend(maintenanceObj)
      await maintenance.save()
    //  await this.ctx.model.DeviceExtend.insert(maintenanceObj)
    }
    let res = await this.ctx.model.DeviceExtend.find(obj).lean()
    let resourceType = [0, 1, 4, 5]
    let deviceType = [2, 3, 8, 10, 11]
    if (resourceType.includes(Number(this.ctx.query.type))) {
      let monitortypeName = {
        0: '枪机',
        1: '红外枪机',
        2: '半球',
        3: '快球',
        4: '全景'
      }
      // console.log(res, 555)
      // console.log(res.rid, 555)
      let select = [
        { $match: { _id: mongoose.Types.ObjectId(res[0].rid) } },
        { $lookup: { from: 'devices', localField: 'eid', foreignField: '_id', as: 'device' } },
        { $project: { eid: 1, monitortype: 1, 'device.series': 1 } }
      ]
      let resource = await this.ctx.model.Resources.aggregate(select)
      // console.log(resource, 666)
      res[0].monitortype = monitortypeName[resource[0].monitortype]
      res[0].model = resource[0].device[0].series
    }
    if (deviceType.includes(Number(this.ctx.query.type))) {
      let dev = await this.ctx.model.Devices.find({ _id: res[0].eid }).lean()
      res[0].monitortype = ''
      res[0].model = dev.series || ''
    }
    // return await this.ctx.model.DeviceExtend.find(obj)
    return res
  }
  async assetsBulkEditing () { // 批量设置维保
    let idType = await this.ctx.service.assetsManagement.returnIdType(this.ctx.query.type)
    let arr = []
    for (const iterator of this.ctx.request.body.ids) {
      let mapVal = {}
      mapVal[idType] = mongoose.Types.ObjectId(iterator) // 加入rid 或 eid
      let maintenance = Object.assign(mapVal, this.ctx.request.body.maintenance)
      let select = {}
      mapVal.rid ? select.rid = mapVal.rid : select.eid = mapVal.eid
      arr.push(this.ctx.model.DeviceExtend.updateMany(select, maintenance, { upsert: true }))
    }
    await Promise.all(arr)
    return { res: 'ok' }
  }
}
module.exports = AssetsManagementController
