const Service = require('egg').Service
const _ = require('lodash')
const tree = require('../utils/tree.js')
const xlsx = require('node-xlsx')
const mongoose = require('mongoose')

class ResourceService extends Service {
  async getAllResourcesByOrgId (orgId) {
    const data = await this.ctx.model.OrgRes.find({
      $or: [{ org: orgId }, { rootorg: orgId }]
    })
    return data
  }
  async getAllResourcesByDeviceId (devId) {
    const data = await this.ctx.model.Resources.find({ eid: devId })
    return data
  }

  async getRecodeStatus () {
    try {
      const startRecord = 'startrecord' // 开始录像字段
      const { influx } = this.app
      const ctx = this.ctx
      /* if (ctx.query.sub === '1') { 默认为全部根节点
        */
      // 勾选子机构
      let orgs = await ctx.service.orgs.getAll(0) // 获取所有机构
      let allChildrenIds = []
      let resIds = []
      allChildrenIds = tree.getChildren(allChildrenIds, orgs, ctx.query.oid) // 拿到该节点下的所有子节点
      allChildrenIds.push(ctx.query.oid)
      let orgRes = [] // 获取机构下所有资源
      orgRes = await ctx.service.resources.getResByOrgId({
        $in: allChildrenIds
      }) // 拿到所有节点下的资源
      /* else {
        orgRes = await ctx.service.resources.getResByOrgId(ctx.query.oid)
      } */
      orgRes.forEach(item => {
        item.resource && resIds.push(mongoose.Types.ObjectId(item.resource))
      })
      // let resQuery = {
      //   type: 0,
      //   _id: { $in: resIds }
      // }
      // const filterResIds = await ctx.service.resources.getRes(
      //   resQuery,
      //   '_id',
      //   {
      //     path: 'eid',
      //     select: 'ip cport'
      //   }
      // )
      // resIds = []
      // filterResIds.forEach((item, index, arr) => {
      //   item._id && resIds.push(item._id + '')
      // })

      let select = [{
        $match: {
          type: 0,
          shareServer: { $exists: false },
          _id: { $in: resIds }
        }
      },
      {
        $lookup:
          { from: 'records', localField: '_id', foreignField: 'resource', as: 'recodes' }
      },
      { $match: { 'recodes.takeType': 'timeVideo' } },
      {
        $project:
          { chan: { $toString: '$chan' }, name: '$name', _id: 1, recodes: { $arrayElemAt: ['$recodes', 0] }, port: { $toString: '$port' }, eid: 1 }
      },
      { $lookup: { 'from': 'devices', 'localField': 'eid', 'foreignField': '_id', 'as': 'device' } },
      {
        $project:
          { chan: '$chan', name: '$name', _id: 1, device: { $arrayElemAt: ['$device', 0] }, port: '$port' }
      },
      {
        $project: {
          ip: { $toString: '$device.ip' }, chan: '$chan', name: '$name', port: '$port'
        }
      },
      {
        $project: {
          sou: {
            $concat: ['$ip', '-', '$port', '-', '$chan']
          }
        }
      }
      ]
      const resCount = await this.ctx.model.Resources.aggregate(select)
      const resSet = new Map(resCount.map(item => [item.sou, true]))

      let influxRecode = []
      const sql = `SELECT "status" FROM "devicelog" GROUP BY "devIp","devPort","channel" ORDER BY time DESC LIMIT  1`
      influxRecode = await influx.query(sql)

      const status = {
        off: 0,
        on: 0
      }
      influxRecode.forEach(item => {
        if (resSet.get(`${item.devIp}-${item.devPort}-${item.channel}`)) {
          item.status === startRecord && status.on++
        }
      })
      status.off = resCount.length - status.on
      return status
    } catch (error) {
      this.logger.error(error)
      return {}
    }
  }

  // 通过orgid在orgres中查询资源列表
  async getResByOrgId (oid) {
    const data = await this.ctx.model.OrgRes.find({ org: oid })
      .lean()
      .exec()
    return data
  }
  // 通过orgid在orgres中查询资源列表(带分页功能)
  async getResPageList (params) {
    const result = Promise.all([
      await this.ctx.model.Resources.find(params.query, params.fields)
        .sort(params.sort)
        .populate(params.population)
        .skip(params.skip)
        .limit(params.limit)
        .lean()
        .exec(),
      await this.ctx.model.Resources.countDocuments(params.query)
    ])
    return result
  }
  // 通过resid查询资源列表
  async getResByIds (query, fields) {
    const data = await this.ctx.model.Resources.find(query, fields)
    return data
  }

  // 通过resid查询资源列表
  async getRes (query, fields, populate) {
    const data = await this.ctx.model.Resources.find(query, fields).populate(populate).lean().exec()
    return data
  }

  // 查询录像监测列表(录像监测)
  async getReslistToVideoMonitor (params) {
    const { influx } = this.app
    let influxPromises = []

    let select = [
      {
        $match: {
          type: 0,
          _id: { $in: params.resIds },
          // shareServer: { $exists: false },
          $or: [{ name: { $regex: params.seek } }, { ip: { $regex: params.seek } }]
        }
      },
      { $lookup: { from: 'records', localField: '_id', foreignField: 'resource', as: 'recodes' } },
      { $match: { 'recodes.takeType': 'timeVideo' } },
      {
        $project: {
          chan: '$chan',
          'name': '$name',
          'status': '$status',
          '_id': 1,
          'eid': 1,
          'recode': {
            $filter: {
              input: '$recodes',
              as: 'item',
              cond: { $eq: ['$$item.takeType', 'timeVideo'] }
            }
          },
          'port': '$port'
        }
      },
      { $lookup: { 'from': 'devices', 'localField': 'eid', 'foreignField': '_id', 'as': 'device' } },
      { $project: { chan: '$chan', name: '$name', status: '$status', _id: 1, device: { $arrayElemAt: ['$device', 0] }, port: '$port' } },
      { $project: { chan: '$chan', status: '$status', name: '$name', ip: '$device.ip', port: '$port' } },
      { $skip: (params.page - 1) * params.limit },
      { $limit: Number(params.limit) }
    ]

    let count = [
      {
        $match: {
          type: 0,
          _id: { $in: params.resIds },
          shareServer: { $exists: false },
          $or: [{ name: { $regex: params.seek } }, { ip: { $regex: params.seek } }]
        }
      },
      {
        $lookup:
          { from: 'records', localField: '_id', foreignField: 'resource', as: 'recodes' }
      },
      { $match: { 'recodes.takeType': 'timeVideo' } },
      {
        $project:
          { chan: '$chan', name: '$name', status: '$status', _id: 1, port: '$port' }
      },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]

    // if (params.status === '1') { // 在线
    //   select[0].$match.status = 1
    //   count[0].$match.status = 1
    // } else if (params.status === '-1') { // 离线
    //   select[0].$match.status = 0
    //   count[0].$match.status = 0
    // }

    let [recordRes, recordResCount] = await Promise.all([
      this.ctx.model.Resources.aggregate(select),
      this.ctx.model.Resources.aggregate(count)])
    // 向influxdb中获取每个设备的在线状态存入assignRes中
    recordRes.map(res => {
      if (res && !_.isEmpty(res)) {
        influxPromises.push(
          {
            ip: res.ip,
            port: res.port,
            channel: res.chan
          }
        )
      }
    })
    const influxData = await this.ctx.helper.doRecode(influx, influxPromises)
    recordRes.map((m, index) => {
      if (!_.isEmpty(m)) {
        recordRes[index] = {
          _id: m._id, // 资源ID
          name: m.name, // 资源（通道）名称
          chan: m.chan, // 通道号
          ip: m.ip ? m.ip : '', // 通道IP
          devName: m.name, // 设备名称
          port: m.port, // 通道端口
          recording: '', // 是否正在录像
          integrity: '', // 录像完整率
          status: m.status, // 设备是否在线
          duration: '' // 录像时间（占位符）
        }
      }
      const influxObj = influxData[`${m.ip}-${m.port}-${m.chan}`]
      recordRes[index].recording = _.get(influxObj, 'recording', '')
      recordRes[index].integrity = _.get(influxObj, 'integrity', '')
      recordRes[index].duration = _.get(influxObj, 'duration', '')
    })
    return [recordRes, _.get(recordResCount, '[0].count', 0)]
  }
  // 查询录像监测列表(录像监测)
  async exportVideoResList (params) {
    const { influx } = this.app
    let influxPromises = []

    let select = [
      {
        $match: {
          type: 0,
          _id: { $in: params.resIds },
          shareServer: { $exists: false },
          $or: [{ name: { $regex: params.seek } }, { ip: { $regex: params.seek } }]
        }
      },
      { $lookup: { from: 'records', localField: '_id', foreignField: 'resource', as: 'recodes' } },
      { $match: { 'recodes.takeType': 'timeVideo' } },
      {
        $project: {
          chan: '$chan',
          'name': '$name',
          'status': '$status',
          '_id': 1,
          'eid': 1,
          'recode': {
            $filter: {
              input: '$recodes',
              as: 'item',
              cond: { $eq: ['$$item.takeType', 'timeVideo'] }
            }
          },
          'port': '$port'
        }
      },
      { $lookup: { 'from': 'devices', 'localField': 'eid', 'foreignField': '_id', 'as': 'device' } },
      { $project: { chan: '$chan', name: '$name', status: '$status', _id: 1, device: { $arrayElemAt: ['$device', 0] }, port: '$port' } },
      { $project: { chan: '$chan', status: '$status', name: '$name', ip: '$device.ip', port: '$port' } }
    ]

    if (params.status === '1') { // 在线
      select[0].$match.status = 1
    } else if (params.status === '-1') { // 离线
      select[0].$match.status = 0
    }
    let recordRes = await this.ctx.model.Resources.aggregate(select)
    // 向influxdb中获取每个设备的在线状态存入assignRes中
    recordRes.map(res => {
      if (res && !_.isEmpty(res)) {
        influxPromises.push(
          {
            ip: res.ip,
            port: res.port,
            channel: res.chan
          }
        )
      }
    })

    const influxData = await this.ctx.helper.doRecode(influx, influxPromises)

    recordRes.map((m, index) => {
      if (!_.isEmpty(m)) {
        recordRes[index] = {
          _id: m._id, // 资源ID
          name: m.name, // 资源（通道）名称
          chan: m.chan, // 通道号
          ip: m.ip ? m.ip : '', // 通道IP
          devName: m.name, // 设备名称
          port: m.port, // 通道端口
          recording: '', // 是否正在录像
          integrity: '', // 录像完整率
          status: m.status, // 设备是否在线
          duration: '' // 录像时间（占位符）
        }
      }
      const influxObj = influxData[`${m.ip}-${m.port}-${m.chan}`]
      recordRes[index].recording = _.get(influxObj, 'recording', '')
      recordRes[index].integrity = _.get(influxObj, 'integrity', '')
      recordRes[index].duration = _.get(influxObj, 'duration', '')
    })

    const data = [
      [
        '通道名称',
        '设备IP',
        '通道号',
        '在线状态',
        '所属设备',
        '所属服务器',
        '正在录像',
        '已录时长',
        '当日录像完整率'
      ]
    ]
    recordRes.forEach(val => {
      data.push([
        val.name,
        val.ip,
        val.chan,
        val.status === 1 ? '在线' : '离线',
        val.devName,
        val.ip,
        val.recording === 'startrecord' ? '是' : '否',
        val.duration = (() => {
          const time = parseInt(val.duration)
          if (_.isNumber(time) && !_.isNaN(time)) {
            const hour = parseInt(time / 60)
            const minute = parseInt(time % 60)
            return hour + '小时' + minute + '分'
          } else {
            return '0小时0分'
          }
        })(),
        val.integrity === '' ? '0%' : val.integrity + '%'
      ])
    })
    const ColInfos = [
      { width: 22 },
      { width: 15 },
      {},
      {},
      { width: 15 },
      { width: 18 },
      { width: 20 }
    ]
    const option = { '!cols': ColInfos }
    let buffer = xlsx.build([{ name: '录像检测', data }], option)
    const timeStr = new Date().toLocaleString().replace(/[-: ]/g, '')
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
    let filename = `录像检测-${timeStr}.xlsx`
    return { buffer, filename }
  }

  // 机构资源树(已分配)
  async getOrgAssigndResTree (params) {
    // 1 - 根据机构ID获取该机构的所有子机构(默认为root)
    const oid = params.oid
    const orgtype = params.orgtype
    const restype = params.restype
    // const devicetype = params.devicetype
    // const resourcetype = params.resourcetype
    let allChildrenIds = []
    let [allorgs, rootorg] = await Promise.all([
      this.ctx.model.Orgs.find(
        {
          type: orgtype || 0
        },
        '_id name pid order'
      )
        .sort({ order: -1 })
        .exec(),
      this.ctx.model.Orgs.findOne({
        type: orgtype || 0,
        isroot: true
      })
        .sort({ order: -1 })
        .exec()
    ])
    if (!oid) {
      allChildrenIds = tree.getChildren(
        allChildrenIds,
        allorgs,
        rootorg._id + ''
      )
      allChildrenIds.unshift(rootorg._id + '')
    } else {
      allChildrenIds = tree.getChildren(allChildrenIds, allorgs, oid)
      allChildrenIds.unshift(oid)
    }
    // 2 - 获取机构下的资源
    let allOrgRes = await this.ctx.model.OrgRes.find(
      {
        islane: false,
        org: {
          $in: allChildrenIds
        }
      },
      'resource org'
    )
      .sort('name')
      .exec()
    let rootOrgRes = await this.ctx.model.OrgRes.find(
      {
        islane: true,
        rootorg: rootorg._id
      },
      'resource org'
    ).exec()
    let assignOrgRes = []
    let flag
    for (let i = 0; i < allOrgRes.length; i++) {
      flag = true
      for (let j = 0; j < rootOrgRes.length; j++) {
        if (allOrgRes[i].resource + '' === '' + rootOrgRes[j].resource) {
          flag = false
          break
        }
      }
      if (flag) {
        // 说明没有重复的resource（既islane true|false）, 即重复的数据不添加
        assignOrgRes.push(allOrgRes[i])
      }
    }
    let [assignOrgResHash, resHash] = [{}, {}]
    let resources = []
    let resourcesIds = []
    let temp = []
    let fields =
      'chan name status monitortype stream  eid pinyin nodeId gbPlaDevIp gbPlaDevPort gbDevId gbParentDevId gbPlaNvrId shareServer'
    let findValue =
      restype && restype.length !== 0
        ? {
          type: { $in: restype }
        }
        : {}
    resources = await this.ctx.model.Resources.find(findValue, fields)
      .populate({
        path: 'eid',
        select: 'name type ip cport dport manufacturer'
      })
      .sort('name')
      .exec()
    resourcesIds = _.map(resources, '_id').toString()
    resources.forEach(item => (resHash[item._id] = item))
    temp = assignOrgRes.filter(item => {
      return resourcesIds.indexOf(item.resource + '') !== -1
    })
    temp.forEach(item => {
      !assignOrgResHash[item.org] && (assignOrgResHash[item.org] = [])
      if (resHash[item.resource]) {
        assignOrgResHash[item.org] = [
          ...assignOrgResHash[item.org],
          resHash[item.resource]
        ]
      }
    })
    const orgs = await this.ctx.model.Orgs.find(
      {
        _id: {
          $in: allChildrenIds
        }
      },
      '_id pid name'
    )
      .sort({ order: -1 })
      .exec()
    const tempArr = new Array(orgs.length)
    _.fill(tempArr, { _doc: { isOrg: true } })
    _.merge(orgs, tempArr)
    const resultRes = orgs.map(item => {
      item = item.toObject()
      item.children = assignOrgResHash[item._id]
      return item
    })
    const data = tree.transData2Tree(resultRes, '_id', 'pid', true).pop()
    return data
  }
  // 储存设备机构树
  async getStorageTree (val) {
    let storageDevice = await this.ctx.curl(
      `${this.ctx.app.config.storageDevice}/api/service/list?servername=ds`,
      { dataType: 'json' }
    )
    if (val === 1) {
      return storageDevice.data
    }
    let tree = { name: '根节点', isroot: true, children: [], _id: 'root' }
    for (const item of storageDevice.data) {
      tree.children.push({ name: item, isroot: false, _id: item })
    }
    return tree
  }
  async getStorageList (params) {
    const { influx } = this.app
    let influxPromises = []
    let storageSelect = {}
    if (this.ctx.query.oid === 'root') {
      // 根机构
      if (this.ctx.query.sub !== '1') {
        // 不显示子机构
        let storageDevice = await this.ctx.service.resources.getStorageTree(1)
        storageSelect = { server: { $nin: storageDevice } }
      } else {
        storageSelect = {} // 显示子机构下的
      }
    } else {
      storageSelect = { server: { $eq: this.ctx.query.oid } }
    }
    const storageDeviceId = await this.ctx.model.Storage.find(storageSelect, {
      resource: 1
    }) // 放存储设备下的资源id

    let dataId = storageDeviceId.map(item => mongoose.Types.ObjectId(item.resource))
    // 获取录像状态
    if (params.record !== '0') {
      dataId = await this.ctx.service.resources.recordStatus(dataId, params.record)
    }
    if (params.complete !== '0') {
      dataId = await this.ctx.service.resources.recordComplete(dataId, params.complete)
    }
    let select = [
      {
        $match: {
          type: 0,
          _id: { $in: dataId },
          shareServer: { $exists: false },
          $or: [{ name: { $regex: params.seek } }, { ip: { $regex: params.seek } }]
        }
      },
      { $lookup: { from: 'records', localField: '_id', foreignField: 'resource', as: 'recodes' } },
      { $match: { 'recodes.takeType': 'timeVideo' } },
      {
        $project: {
          chan: '$chan',
          'name': '$name',
          'status': '$status',
          '_id': 1,
          'eid': 1,
          'recode': {
            $filter: {
              input: '$recodes',
              as: 'item',
              cond: { $eq: ['$$item.takeType', 'timeVideo'] }
            }
          },
          'port': '$port'
        }
      },
      { $lookup: { 'from': 'devices', 'localField': 'eid', 'foreignField': '_id', 'as': 'device' } },
      { $project: { chan: '$chan', name: '$name', status: '$status', _id: 1, device: { $arrayElemAt: ['$device', 0] }, port: '$port' } },
      { $project: { chan: '$chan', status: '$status', name: '$name', ip: '$device.ip', port: '$port' } },
      { $skip: (params.page - 1) * params.limit },
      { $limit: Number(params.limit) }
    ]

    let count = [
      {
        $match: {
          type: 0,
          _id: { $in: dataId },
          shareServer: { $exists: false },
          $or: [{ name: { $regex: params.seek } }, { ip: { $regex: params.seek } }]
        }
      },
      {
        $lookup:
          { from: 'records', localField: '_id', foreignField: 'resource', as: 'recodes' }
      },
      // { $match: { 'recodes.0.takeType': 'timeVideo', 'recodes.0.enable': 'enable' } },
      { $match: { 'recodes.takeType': 'timeVideo' } },
      { $project: { chan: '$chan', status: '$status', name: '$name', port: '$port' } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]

    if (params.status === '1') { // 在线
      select[0].$match.status = 1
      count[0].$match.status = 1
    } else if (params.status === '-1') { // 离线
      select[0].$match.status = 0
      count[0].$match.status = 0
    }
    let [recordRes, recordResCount] = await Promise.all([
      this.ctx.model.Resources.aggregate(select),
      this.ctx.model.Resources.aggregate(count)])
    // 向influxdb中获取每个设备的在线状态存入assignRes中
    recordRes.map(res => {
      if (res && !_.isEmpty(res)) {
        influxPromises.push(
          {
            ip: res.ip,
            port: res.port,
            channel: res.chan
          }
        )
      }
    })
    const influxData = await this.ctx.helper.doRecode(influx, influxPromises)
    recordRes.map((m, index) => {
      if (!_.isEmpty(m)) {
        recordRes[index] = {
          _id: m._id, // 资源ID
          name: m.name, // 资源（通道）名称
          chan: m.chan, // 通道号
          ip: m.ip ? m.ip : '', // 通道IP
          devName: m.name, // 设备名称
          port: m.port, // 通道端口
          recording: '', // 是否正在录像
          integrity: '', // 录像完整率
          status: m.status, // 设备是否在线
          duration: '' // 录像时间（占位符）
        }
      }
      const influxObj = influxData[`${m.ip}-${m.port}-${m.chan}`]
      recordRes[index].recording = _.get(influxObj, 'recording', '')
      recordRes[index].integrity = _.get(influxObj, 'integrity', '')
      recordRes[index].duration = _.get(influxObj, 'duration', '')
      // recordRes[index].status = _.get(influxObj, 'status', '')
    })
    /**    // 判断assignRes是否在线
        if (params.status && params.status === '1') {
          recordRes = recordRes.filter(item => {
            return item.status === 1
          })
        } else if (params.status === '-1') {
          recordRes = recordRes.filter(item => {
            return item.status === 0
          })
        }
        // 判断assignRes录像完整率
        if (params.full === '1') {
          recordRes = recordRes.filter(item => {
            return Number(item.integrity) >= 100
          })
        } else if (params.full === '-1') {
          recordRes = recordRes.filter(item => {
            return Number(item.integrity) < 100
          })
        } */

    // 创建分页数据
    // recordResCount = recordRes.length
    // recordRes = recordRes.splice(
    //   (params.page - 1) * params.limit,
    //   params.limit
    // )

    return [recordRes, _.get(recordResCount, '[0].count', 0)]
  }

  async exportStorageList (params) {
    const { influx } = this.app
    let influxPromises = []
    let storageSelect = {}
    if (params.oid === 'root') {
      // 根机构
      if (this.ctx.query.sub !== '1') {
        // 不显示子机构
        let storageDevice = await this.ctx.service.resources.getStorageTree(1)
        storageSelect = { server: { $nin: storageDevice } }
      } else {
        storageSelect = {} // 显示子机构下的
      }
    } else {
      storageSelect = { server: { $eq: params.oid } }
    }
    const storageDeviceId = await this.ctx.model.Storage.find(storageSelect, {
      resource: 1
    }) // 放存储设备下的资源id

    let dataId = storageDeviceId.map(item => mongoose.Types.ObjectId(item.resource))
    // 获取录像状态

    if (params.record !== '0') {
      dataId = await this.ctx.service.resources.recordStatus(dataId, params.record)
    }
    if (params.complete !== '0') {
      dataId = await this.ctx.service.resources.recordComplete(dataId, params.complete)
    }
    let select = [
      {
        $match: {
          type: 0,
          _id: { $in: dataId },
          shareServer: { $exists: false },
          $or: [{ name: { $regex: params.seek } }, { ip: { $regex: params.seek } }]
        }
      },
      { $lookup: { from: 'records', localField: '_id', foreignField: 'resource', as: 'recodes' } },
      { $match: { 'recodes.takeType': 'timeVideo' } },
      {
        $project: {
          chan: '$chan',
          'name': '$name',
          'status': '$status',
          '_id': 1,
          'eid': 1,
          'recode': {
            $filter: {
              input: '$recodes',
              as: 'item',
              cond: { $eq: ['$$item.takeType', 'timeVideo'] }
            }
          },
          'port': '$port'
        }
      },
      { $lookup: { 'from': 'devices', 'localField': 'eid', 'foreignField': '_id', 'as': 'device' } },
      { $project: { chan: '$chan', name: '$name', status: '$status', _id: 1, device: { $arrayElemAt: ['$device', 0] }, port: '$port' } },
      { $project: { chan: '$chan', status: '$status', name: '$name', ip: '$device.ip', port: '$port' } }
    ]

    if (params.status === '1') { // 在线
      select[0].$match.status = 1
    } else if (params.status === '-1') { // 离线
      select[0].$match.status = 0
    }
    let recordRes = await this.ctx.model.Resources.aggregate(select)
    // 向influxdb中获取每个设备的在线状态存入assignRes中
    recordRes.map(res => {
      if (res && !_.isEmpty(res)) {
        influxPromises.push(
          {
            ip: res.ip,
            port: res.port,
            channel: res.chan
          }
        )
      }
    })

    const influxData = await this.ctx.helper.doRecode(influx, influxPromises)

    recordRes.map((m, index) => {
      if (!_.isEmpty(m)) {
        recordRes[index] = {
          _id: m._id, // 资源ID
          name: m.name, // 资源（通道）名称
          chan: m.chan, // 通道号
          ip: m.ip ? m.ip : '', // 通道IP
          devName: m.name, // 设备名称
          port: m.port, // 通道端口
          recording: '', // 是否正在录像
          integrity: '', // 录像完整率
          status: m.status, // 设备是否在线
          duration: '' // 录像时间（占位符）
        }
      }
      const influxObj = influxData[`${m.ip}-${m.port}-${m.chan}`]
      recordRes[index].recording = _.get(influxObj, 'recording', '')
      recordRes[index].integrity = _.get(influxObj, 'integrity', '')
      recordRes[index].duration = _.get(influxObj, 'duration', '')
    })
    const data = [
      [
        '通道名称',
        '设备IP',
        '通道号',
        '在线状态',
        '所属设备',
        '所属服务器',
        '正在录像',
        '已录时长',
        '当日录像完整率'
      ]
    ]
    recordRes.forEach(val => {
      data.push([
        val.name,
        val.ip,
        val.chan,
        val.status === 1 ? '在线' : '离线',
        val.devName,
        val.ip,
        val.recording === 'startrecord' ? '是' : '否',
        val.duration = (() => {
          const time = parseInt(val.duration)
          if (_.isNumber(time) && !_.isNaN(time)) {
            const hour = parseInt(time / 60)
            const minute = parseInt(time % 60)
            return hour + '小时' + minute + '分'
          } else {
            return '0小时0分'
          }
        })(),
        val.integrity === '' ? '0%' : val.integrity + '%'
      ])
    })
    const ColInfos = [
      { width: 22 },
      { width: 15 },
      {},
      {},
      { width: 15 },
      { width: 18 },
      { width: 20 }
    ]
    const option = { '!cols': ColInfos }
    let buffer = xlsx.build([{ name: '录像检测', data }], option)
    const timeStr = new Date().toLocaleString().replace(/[-: ]/g, '')
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
    let filename = `录像检测-${timeStr}.xlsx`
    return { buffer, filename }
  }

  async recordStatus (ids, type) {
    const { influx } = this.app

    const STATUS = {
      '1': ['startrecord']
    }
    const resourceList = await this.ctx.model.Resources.find({ _id: ids }, 'eid chan port')
      .populate({ path: 'eid', select: 'ip' }).lean()

    const recordStatus = await this.ctx.helper.getRecodeThisStatus(influx)
    const recordsObj = {}
    recordStatus.map(item => {
      if (STATUS['1'].includes(item.status)) {
        recordsObj[`${item.devIp}-${item.devPort}-${item.channel}`] = true
      }
    })
    const result = []
    resourceList.map(item => {
      if (type === '1') {
        recordsObj[`${_.get(item, 'eid.ip', '-')}-${_.get(item, 'port', '-')}-${_.get(item, 'chan', '-')}`] && result.push(item._id)
      } else {
        recordsObj[`${_.get(item, 'eid.ip', '-')}-${_.get(item, 'port', '-')}-${_.get(item, 'chan', '-')}`] === undefined && result.push(item._id)
      }
    })
    return result
  }

  async recordComplete (ids, type) {
    const { influx } = this.app

    const STATUS = {
      '1': ['100', '100.00']
    }
    const resourceList = await this.ctx.model.Resources.find({ _id: ids }, 'eid chan port')
      .populate({ path: 'eid', select: 'ip' }).lean()

    const recordStatus = await this.ctx.helper.getRecodeThisComplete(influx)
    const recordsObj = {}
    recordStatus.map(item => {
      if (STATUS['1'].includes(item.integrity)) {
        recordsObj[`${item.devIp}-${item.devPort}-${item.channel}`] = true
      }
    })
    const result = []
    resourceList.map(item => {
      if (type === '1') {
        recordsObj[`${_.get(item, 'eid.ip', '-')}-${_.get(item, 'port', '-')}-${_.get(item, 'chan', '-')}`] && result.push(item._id)
      } else {
        recordsObj[`${_.get(item, 'eid.ip', '-')}-${_.get(item, 'port', '-')}-${_.get(item, 'chan', '-')}`] === undefined && result.push(item._id)
      }
    })
    return result
  }

  async doRecordHistory () {
    const { influx } = this.app
    const ctx = this.ctx
    const params = {
      ip: ctx.query.ip,
      port: ctx.query.port,
      channel: ctx.query.channel,
      sTime: ctx.query.startTime,
      eTime: ctx.query.endTime
    }
    return this.ctx.helper.doRecordHistory(influx, params)
  }

  async getDevRecodeStatus () {
    try {
      const startRecord = 'startrecord' // 开始录像字段
      const { influx } = this.app

      let storageSelect = {}
      if (this.ctx.query.oid === 'root') {
        // 根机构
        if (this.ctx.query.sub !== '1') {
          // 不显示子机构
          let storageDevice = await this.ctx.service.resources.getStorageTree(1)
          storageSelect = { server: { $nin: storageDevice } }
        } else {
          storageSelect = {} // 显示子机构下的
        }
      } else {
        storageSelect = { server: { $eq: this.ctx.query.oid } }
      }
      const storageDeviceId = await this.ctx.model.Storage.find(storageSelect, {
        resource: 1
      }) // 放存储设备下的资源id
      const resIds = storageDeviceId.map(item => mongoose.Types.ObjectId(item.resource))

      let select = [{
        $match: {
          type: 0,
          shareServer: { $exists: false },
          _id: { $in: resIds }
        }
      },
      {
        $lookup:
          { from: 'records', localField: '_id', foreignField: 'resource', as: 'recodes' }
      },
      { $match: { 'recodes.takeType': 'timeVideo' } },
      {
        $project:
          { chan: { $toString: '$chan' }, name: '$name', _id: 1, recodes: { $arrayElemAt: ['$recodes', 0] }, port: { $toString: '$port' }, eid: 1 }
      },
      { $lookup: { 'from': 'devices', 'localField': 'eid', 'foreignField': '_id', 'as': 'device' } },
      {
        $project:
          { chan: '$chan', name: '$name', _id: 1, device: { $arrayElemAt: ['$device', 0] }, port: '$port' }
      },
      {
        $project: {
          ip: { $toString: '$device.ip' }, chan: '$chan', name: '$name', port: '$port'
        }
      },
      {
        $project: {
          sou: {
            $concat: ['$ip', '-', '$port', '-', '$chan']
          }
        }
      }]

      const resCount = await this.ctx.model.Resources.aggregate(select)
      const resSet = new Map(resCount.map(item => [item.sou, true]))

      // if (resCount.length > 0) { sqlSelect = 'WHERE ' }
      // resCount.forEach((item, index, arr) => {
      //   sqlSelect += `('devIp' = '${item.ip}' AND 'devPort' = '${item.port}'  AND 'channel' = '${item.chan}')`
      //   if (index < arr.length - 1) {
      //     sqlSelect += 'OR'
      //   }
      // })

      let influxRecode = []

      // const sl = `SELECT 'status' FROM 'devicelog' ${sqlSelect} GROUP BY 'devIp','devPort','channel' ORDER BY 'time' DESC  LIMIT  1`
      const sql = `SELECT "status" FROM "devicelog" GROUP BY "devIp","devPort","channel" ORDER BY time DESC LIMIT  1`
      influxRecode = await influx.query(sql)

      const status = {
        off: 0,
        on: 0
      }
      influxRecode.forEach(item => {
        if (resSet.get(`${item.devIp}-${item.devPort}-${item.channel}`)) {
          item.status === startRecord && status.on++
        }
      })
      status.off = resCount.length - status.on
      return status
    } catch (error) {
      this.logger.error(error)
      return {}
    }
  }
}

module.exports = ResourceService
