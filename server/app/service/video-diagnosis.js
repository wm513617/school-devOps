const Service = require('egg').Service
const mongoose = require('mongoose')
const _ = require('lodash')
const moment = require('moment')
const xlsx = require('node-xlsx')
const tree = require('../utils/tree.js')
class VideoDiagnosisService extends Service {
  cutUrl (url, field) {
    let arrUrl = url.split('/')
    if (field === 'id') {
      return arrUrl[4].split('=')[1]
    }
  }
  // 获取所有的视频诊断通道集合
  async getDiagTasks () {
    // 先查取所有task集合
    const ctx = this.ctx
    const host = ctx.app.config.videoDiagnosisHost
    const tasks = await ctx.curl(`${host}/vd/task`, {
      dataType: 'json',
      timeout: 3000
    })
    return tasks.data.task
  }
  // 获取所有的视频诊断通道集合
  async getAllDiagCameras () {
    // 先查取所有task集合
    let data = []
    const ctx = this.ctx
    const tasks = await ctx.service.videoDiagnosis.getDiagTasks()
    // 根据每个taskname获取镜头列表
    if (!tasks) {
      return data
    } else {
      let names = []
      tasks.forEach(t => {
        names.push(t.name)
      })
      data = await ctx.service.videoDiagnosis.getDiagCamerasByName(names)
      return data
    }
  }
  // 通过所传名称获取镜头列表
  async getDiagCamerasByName (names = []) {
    const ctx = this.ctx
    const host = ctx.app.config.videoDiagnosisHost
    let cameraRequest = []
    names.forEach(name => {
      cameraRequest.push(ctx.curl(`${host}/task/camera?task=${encodeURI(name)}&page=1&max=1000`, {
        dataType: 'json',
        timeout: 3000
      }))
    })
    let cameraResponse = await Promise.all(cameraRequest)
    let cameraResolves = cameraResponse.map((r) => {
      return new Promise((resolve, reject) => {
        resolve(r.data)
      })
    })
    let camreaData = await Promise.all(cameraResolves)
    let data = []
    camreaData.forEach(r => {
      let cameras = r.camera
      if (!_.isEmpty(cameras)) {
        cameras.forEach(c => {
          let id = c.res1.split('-')[0]
          // cameraIds.push(id)
          data.push({
            _id: id,
            url: c.url
          })
        })
      }
    })
    let hash = {}
    data = data.reduce(function (item, next) {
      if (!hash[next._id]) {
        hash[next._id] = true
        item.push(next)
      }
      return item
    }, [])
    return _.uniq(data)
  }
  // 视频诊断资使用的源树(去掉了已配置诊断的资源)
  async getDiagUnconfResTree (params) {
    // 1 - 根据机构ID获取该机构的所有子机构(默认为root)
    const oid = params.oid
    const orgtype = params.orgtype
    const restype = params.restype
    const name = params.taskname
    const tasktype = params.tasktype
    // 2 - 判断已配置的镜头
    let excDiagCameras = []
    if (tasktype === 'whitelist') {
      let whitelistIds = await this.ctx.service.videoDiagnosis.getWhitelistIds()
      excDiagCameras = whitelistIds.whitelistIds
      if (!excDiagCameras) {
        excDiagCameras = []
      }
    } else {
      if (name) {
        let diagTasks = await this.ctx.service.videoDiagnosis.getDiagTasks()
        let names = []
        diagTasks.forEach(d => {
          if (d.name !== name) {
            names.push(d.name)
          }
        })
        excDiagCameras = await this.ctx.service.videoDiagnosis.getDiagCamerasByName(names)
      } else {
        excDiagCameras = await this.ctx.service.videoDiagnosis.getAllDiagCameras()
      }
    }
    // const devicetype = params.devicetype
    // const resourcetype = params.resourcetype
    let allChildrenIds = []
    let [allorgs, rootorg] = await Promise.all([
      this.ctx.model.Orgs.find({
        type: orgtype || 0
      }, '_id name pid order').sort({ 'order': -1 }).exec(),
      this.ctx.model.Orgs.findOne({
        type: orgtype || 0,
        isroot: true
      }).sort({ 'order': -1 }).exec()
    ])
    if (!oid) {
      allChildrenIds = tree.getChildren(allChildrenIds, allorgs, rootorg._id + '')
      allChildrenIds.unshift(rootorg._id + '')
    } else {
      allChildrenIds = tree.getChildren(allChildrenIds, allorgs, oid)
      allChildrenIds.unshift(oid)
    }
    // 2 - 获取机构下的资源
    let resFilters = [
      { $match: { org: { $in: allChildrenIds.map(item => mongoose.Types.ObjectId(item)) } } },
      { $lookup: { from: 'resources', localField: 'resource', foreignField: '_id', as: 'res' } },
      { $match: { $and: [{ 'res.type': 0 }, { 'res.shareServer': { $exists: false } }] } },
      { $lookup: { from: 'devices', localField: 'res.eid', foreignField: '_id', as: 'eid' } },
      { $match: { 'eid.type': { $nin: ['alarmBox', 'alarmPillar'] } } },
      { $project: { resource: 1, org: 1 } }
    ]
    let allOrgRes = await this.ctx.model.OrgRes.aggregate(resFilters)
    let rootOrgRes = await this.ctx.model.OrgRes.find({
      islane: true,
      rootorg: rootorg._id
    }, 'resource org').exec()
    let assignOrgRes = []
    let flag
    for (let i = 0; i < allOrgRes.length; i++) {
      flag = true
      for (let j = 0; j < rootOrgRes.length; j++) {
        if (allOrgRes[i].resource + '' === ('' + rootOrgRes[j].resource)) {
          flag = false
          break
        }
      }
      if (flag) { // 说明没有重复的resource（既islane true|false）, 即重复的数据不添加
        assignOrgRes.push(allOrgRes[i])
      }
    }
    let [assignOrgResHash, resHash] = [{}, {}]
    let resources = []
    let resourcesIds = []
    let temp = []
    let fields = 'chan name status monitortype stream  eid pinyin nodeId gbPlaDevIp gbPlaDevPort gbDevId gbParentDevId gbPlaNvrId shareServer rtsp'
    let findValue = restype && restype.length !== 0 ? {
      type: { $in: restype }
    } : {}
    resources = await this.ctx.model.Resources.find(findValue, fields).populate({
      path: 'eid',
      select: 'name type ip cport dport manufacturer username password'
    }).sort('name').lean().exec()
    // resources.forEach((r, i) => {
    //   excDiagCameraIds.forEach(e => {
    //     if (r._id + '' === e) {
    //       resources.splice(i, 1)
    //     }
    //   })
    // })
    let excDiagCameraIds = []
    if (tasktype === 'whitelist') {
      excDiagCameraIds = excDiagCameras
    } else {
      excDiagCameraIds = excDiagCameras.map(e => {
        return e._id
      })
    }
    resources = resources.filter(i => {
      return !excDiagCameraIds.includes(i._id + '')
    })
    resourcesIds = _.map(resources, '_id').toString()
    resources.forEach(item => (resHash[item._id] = item))
    temp = assignOrgRes.filter(item => {
      return resourcesIds.indexOf(item.resource + '') !== -1
    })
    temp.forEach(item => {
      !assignOrgResHash[item.org] && (assignOrgResHash[item.org] = [])
      if (resHash[item.resource]) {
        assignOrgResHash[item.org] = [...assignOrgResHash[item.org], resHash[item.resource]]
      }
    })
    const orgs = await this.ctx.model.Orgs.find({
      _id: {
        $in: allChildrenIds
      }
    }, '_id pid name').sort({ order: -1 }).exec()
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
  // 获取所有诊断镜头的 _id
  async getAllDiagnoseCamera () {
    // 获取所有配置过诊断计划的镜头
    let planList = await this.ctx.curl(`${this.ctx.app.config.videoDiagnosisHost}/vd/task`, { dataType: 'json' })
    if (planList.data.res !== 'OK' || !planList.data.task) {
      return [[]]
    }
    let getAllCamera = await Promise.all(planList.data.task.map(item => {
      return this.ctx.curl(`${this.ctx.app.config.videoDiagnosisHost}/task/camera?task=${encodeURI(item.name)}&page=1&max=10000`, { dataType: 'json' })
    }))
    let allCameraId = []
    let ulrObj = {}
    for (let index = 0; index < getAllCamera.length; index++) {
      let item = getAllCamera[index]
      if (!item.data.camera) {
        continue
      }
      item.data.camera.forEach(val => {
        let url = val.url.replace(new RegExp(this.ctx.app.config.videoHost), 'ip:port')
        allCameraId.push(url)
        ulrObj[url] = { url: val.url, name: planList.data.task[index].name }
      })
    }
    // 返回所有诊断镜头的 rtsp 及 以rtsp 为键的 对应的诊断信息
    return [allCameraId, ulrObj]
  }
  /**
   * 获取最后一次诊断结果的列表
   */
  async getDiagFinalMonitorData (params, isExport) {
    // * @query oid 机构ID
    // * @query limit 页大小
    // * @query seek 查询字段
    // * @query page 分页
    // * @query sub 是够显示子机构 1 是 0 否
    // * @query status 1在线 0全部 -1不在线
    // * @query snece 异常场景全部为all其余 0-8 md...ptz
    let serve = await this.ctx.model.Service.find({ ip: this.ctx.app.config.videoDiagnosisHost.toString().split(':')[0], port: Number(this.ctx.app.config.videoDiagnosisHost.toString().split(':')[1]) })
    if (!serve.length) {
      this.ctx.throw(500, { message: '请添加相应的诊断服务器地址!' }) // 数据库没有添加这个诊断服务器 不返回数据
    }
    if (!params.oid) {
      this.ctx.throw(404, { code: 1010, message: '请求参数不能为空' })
    }
    let [allCameraId] = await this.ctx.service.videoDiagnosis.getAllDiagnoseCamera()
    if (!allCameraId.length) {
      return [[], 0]
    }
    // 获取最后一次 所有诊断结果
    let finalInitData = await this.ctx.curl(`${this.ctx.app.config.videoDiagnosisHost}/vd/last?page=1&max=5000&status=all`, { dataType: 'json', timeout: 3000 })
    finalInitData = finalInitData.data.result || []
    let resourceIds = []
    if (Number(params.snece) === 2) { // 全部
      resourceIds = allCameraId
    } else {
      let normalArr = [] // 正常的镜头
      let DiagnosticScreening = finalInitData.filter(item => {
        // return Number(item.flags) === 0 && item.status !== 'offline'
        // flags: 标记哪一项诊断结果超出了设定的阈值；从低到高(0-9)依次为md=移动帧；sc=场景切换；ac=清晰度异常；vc=视频遮挡；ab=亮度异常；sm=信号缺失；pf=画面冻结；nd=噪声；pc=偏色；ptz=云台失控；
        if (item.status === 'offline') { return false }
        let flagsArr = item.flags.toString(2).split('').reverse()
        for (let index = 0; index < flagsArr.length; index++) {
          const element = flagsArr[index]
          if (element === '1' && ![0, 1, 9].includes(index)) {
            return false
          }
        }
        return true
      })
      DiagnosticScreening.forEach(item => {
        let url = item.url.replace(new RegExp(this.ctx.app.config.videoHost), 'ip:port')
        if (allCameraId.includes(url)) {
          normalArr.push(url)
        }
      })
      if (Number(params.snece) === 1) {
        resourceIds = normalArr
      } else {
        for (const iterator of allCameraId) {
          if (!normalArr.includes(iterator)) {
            resourceIds.push(iterator)
          }
        }
      }
    }
    let orgs = []
    if (Number(params.sub) === 1) {
      orgs = await this.ctx.service.assetsManagement.descendantOrg(mongoose.Types.ObjectId(params.oid)) // 改机构所有子机构
    }
    let select = [
      { $match: { org: { $in: [mongoose.Types.ObjectId(params.oid), ...orgs] } } },
      { $lookup: { from: 'resources', localField: 'resource', foreignField: '_id', as: 'resource' } },
      { $match: { $or: [{ 'resource.rtsp.main': { $in: resourceIds } }, { 'resource.rtsp.sub': { $in: resourceIds } }] } },
      { $lookup: { from: 'devices', localField: 'resource.eid', foreignField: '_id', as: 'device' } },
      { $match: { $or: [{ 'resource.name': { $regex: params.seek + '' || '' } }, { 'resource.ip': { $regex: params.seek + '' || '' } }] } },
      { $project: { org: 1, 'device.status': 1, 'resource.name': 1, 'resource.chan': 1, 'resource.port': 1, 'resource._id': 1, 'resource.rtsp': 1, 'resource.ip': 1 } }
    ]
    let status = Number(params.status) === 0 ? 1 : Number(params.status) === 1
    if (status !== 1) {
      select.push({ $match: { 'device.status': { $eq: status } } })
    }
    let paging = [
      { $skip: (params.page - 1) * params.limit },
      { $limit: Number(params.limit) }
    ]
    let resource, total
    if (isExport) {
      resource = await this.ctx.model.OrgRes.aggregate([...select])
    } else {
      let [res, sum] = await Promise.all([this.ctx.model.OrgRes.aggregate([...select, ...paging]), this.ctx.model.OrgRes.aggregate([...select, { $count: 'org' }])])
      resource = res
      total = sum.length ? sum[0].org : 0
    }
    let diagnosisObj = {
      'md': 0,
      'sc': 1,
      'ac': 2,
      'vc': 3,
      'ab': 4,
      'sm': 5,
      'pf': 6,
      'nd': 7,
      'pc': 8,
      'ptz': 9
    }
    // flags: 标记哪一项诊断结果超出了设定的阈值；从低到高(0-9)依次为md=移动帧；sc=场景切换；ac=清晰度异常；vc=视频遮挡；ab=亮度异常；sm=信号缺失；pf=画面冻结；nd=噪声；pc=偏色；ptz=云台失控；
    let resourceData = []
    let finalInitDataIds = finalInitData.map(item => {
      return item.url.replace(new RegExp(this.ctx.app.config.videoHost), 'ip:port')
    })
    for (let i = 0; i < resource.length; i++) {
      let obj = {
        name: resource[i].resource[0].name,
        ip: resource[i].resource[0].ip,
        channel: resource[i].resource[0].chan,
        port: resource[i].resource[0].port,
        status: resource[i].device[0].status
      }
      let index = finalInitDataIds.indexOf(resource[i].resource[0].rtsp.main) === -1 ? finalInitDataIds.indexOf(resource[i].resource[0].rtsp.sub) : finalInitDataIds.indexOf(resource[i].resource[0].rtsp.main)
      if (index !== -1) {
        // 如果返回不在线且没有异常的数据 则显示未连接状态
        let result = {}
        let details = finalInitData[index]
        if (!(finalInitData[index].status === 'offline' && Number(finalInitData[index].flags) === 0)) {
          for (const key in diagnosisObj) {
            let flags = details.flags.toString(2).split('') // 需要把flags转成2进制按顺序对比
            result[key] = flags.reverse()[diagnosisObj[key]] !== '1'
          }
          obj.result = result
        }
        obj.url = details.url
        obj.pic = details.pic ? `http://${this.ctx.app.config.picHost}/ops/pic/${details.pic}` : ''
        obj.time = details.time
        obj.detail = details.detail
      }
      resourceData.push(obj)
    }
    return [resourceData, total]
  }
  // 获取诊断设备在线状态数量 （所有添加在诊断计划中的镜头）
  async getDiagFinalStatus () {
    let params = {
      sub: Number(this.ctx.query.sub),
      oid: this.ctx.query.oid
    }
    let orgs = []
    if (params.sub === 1) {
      orgs = await this.ctx.service.assetsManagement.descendantOrg(mongoose.Types.ObjectId(params.oid)) // 改机构所有子机构
    }
    let [allCameraId] = await this.ctx.service.videoDiagnosis.getAllDiagnoseCamera() // 返回所有配置视频诊断的镜头id
    let select = [
      { $match: { $or: [{ 'rtsp.main': { $in: allCameraId } }, { 'rtsp.sub': { $in: allCameraId } }] } },
      { $lookup: { from: 'orgres', localField: '_id', foreignField: 'resource', as: 'orgs' } },
      { $match: { 'orgs.org': { $in: [...orgs, mongoose.Types.ObjectId(params.oid)] } } },
      { $count: 'ip' }
    ]
    let selectOnline = [
      { $match: { $or: [{ 'rtsp.main': { $in: allCameraId } }, { 'rtsp.sub': { $in: allCameraId } }] } },
      { $lookup: { from: 'orgres', localField: '_id', foreignField: 'resource', as: 'orgs' } },
      { $match: { 'orgs.org': { $in: [...orgs, mongoose.Types.ObjectId(params.oid)] } } },
      { $lookup: { from: 'devices', localField: 'eid', foreignField: '_id', as: 'device' } },
      { $match: { 'device.status': true } },
      { $count: 'ip' }
    ]
    let [sumCount, online] = await Promise.all([this.ctx.model.Resources.aggregate(select), this.ctx.model.Resources.aggregate(selectOnline)])
    sumCount = sumCount.length ? sumCount[0].ip : 0
    online = online.length ? online[0].ip : 0
    return {
      online,
      offline: sumCount - online
    }
  }
  /**
   * 视频诊断导出接口
   */
  async getDiagFinalExport () {
    // * @query oid 机构ID
    // * @query limit 页大小
    // * @query seek 查询字段
    // * @query page 分页
    // * @query sub 是够显示子机构 1 是 0 否
    // * @query status 1在线 0全部 -1不在线
    // * @query snece 异常场景全部为all其余 0-8 md...ptz
    let params = {
      oid: this.ctx.query.oid,
      sub: 1,
      status: 0,
      seek: '',
      snece: 2
    }
    let [resource] = await this.ctx.service.videoDiagnosis.getDiagFinalMonitorData(params, true)
    const data = [['通道名称', '在线状态', 'IP地址', '信号缺失', '清晰度异常', '画面遮挡', '场景切换', '亮度异常', '画面冻结', '噪声检测', '偏色检测', '最后检测时间']]
    resource.map(item => {
      item.status = item.status ? '在线' : '离线'
      item.time = item.time ? moment.utc(item.time).format('YYYY-MM-DD HH:mm:ss') : ''
      return item
    })
    // md=移动帧；sc=场景切换；ac=清晰度异常；vc=视频遮挡；ab=亮度异常；sm=信号缺失；pf=画面冻结；nd=噪声；pc=偏色；ptz=云台失控；
    resource.forEach(val => {
      let arrSort = ['sm', 'ac', 'vc', 'sc', 'ab', 'pf', 'nd', 'pc']
      let arr = []
      arrSort.forEach(res => {
        let status = val.result ? val.result[res] ? '正常' : '异常' : ''
        arr.push(status)
      })
      data.push([
        val.name,
        val.status, val.ip,
        ...arr,
        val.time
      ])
    })
    let xlsxName = '视频诊断'
    let buffer = xlsx.build([{ name: xlsxName, data }])
    const timeStr = new Date().toLocaleString().replace(/[-: ]/g, '')
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
    let filename = `${xlsxName}-${timeStr}.xlsx`
    return { buffer, filename }
  }
  // 个性化配置 列表获取
  async getDiagResData (params) {
    let [allCameraId, ulrObj] = await this.ctx.service.videoDiagnosis.getAllDiagnoseCamera()
    if (!allCameraId.length) {
      return [[], 0]
    }
    let orgId = [params.oid]
    if (Number(params.sub) === 1) {
      orgId = [...await this.ctx.service.assetsManagement.descendantOrg(params.oid), params.oid]
    }
    let page = params.page ? parseInt(params.page) : 1
    let limit = params.limit ? parseInt(params.limit) : 20
    let select = [
      // { $match: { '_id': { $in: allCameraId.map(item => mongoose.Types.ObjectId(item)) } } },
      { $match: { $or: [{ 'rtsp.main': { $in: allCameraId } }, { 'rtsp.sub': { $in: allCameraId } }] } },
      { $match: { $or: [{ 'name': { $regex: this.ctx.query.seek + '' || '' } }, { 'ip': { $regex: this.ctx.query.seek + '' || '' } }] } },
      { $lookup: { from: 'orgres', localField: '_id', foreignField: 'resource', as: 'orgres' } },
      { $match: { 'orgres.org': { $in: orgId.map(item => mongoose.Types.ObjectId(item)) } } },
      { $lookup: { from: 'orgs', localField: 'orgres.org', foreignField: '_id', as: 'org' } },
      { $lookup: { from: 'devices', localField: 'eid', foreignField: '_id', as: 'eid' } },
      { $project: { chan: 1, name: 1, ip: 1, 'eid.cport': 1, 'eid.name': 1, 'eid.ip': 1, 'eid.manufacturer': 1, 'org.name': 1, rtsp: 1 } }
    ]
    let paging = [
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) }
    ]
    let [count, data] = await Promise.all([this.ctx.model.Resources.aggregate([...select, { $count: 'name' }]), this.ctx.model.Resources.aggregate([...select, ...paging])])
    count = count.length ? count[0].name : 0
    data = data.map(item => {
      item.eid = item.eid[0]
      item.org = item.org[0]
      item.url = ulrObj[item.rtsp.main] || ulrObj[item.rtsp.sub]
      return item
    })
    return [data, count]
  }
  // 白名单列表所有id以及白名单列表
  async getWhitelistIds () {
    let whitelistIds = []
    let whitelist = await this.ctx.curl(`${this.ctx.app.config.videoDiagnosisHost}/vd/whitelist?page=1&max=100000`, { dataType: 'json' })
    if (whitelist.data.whitelist === null) {
      return { whitelistIds: [], whitelist }
    }
    whitelist.data.whitelist.forEach((item) => {
      if (item.res1.split('-')[0].length >= 12) {
        whitelistIds.push(item.res1.split('-')[0])
      }
    })
    return { whitelistIds, whitelist }
  }
  // 白名单通道信息查询
  async getGalleryWhitelist () {
    let getWhitelistIds = await this.ctx.service.videoDiagnosis.getWhitelistIds()
    let whitelistIds = getWhitelistIds.whitelistIds
    let whitelist = getWhitelistIds.whitelist
    if (whitelist.data.whitelist === null || whitelistIds.length === 0) {
      return []
    }
    let select = [
      { $match: { _id: { $in: whitelistIds.map((val) => { return mongoose.Types.ObjectId(val) }) } } },
      { $lookup: { from: 'orgres', localField: '_id', foreignField: 'resource', as: 'orgres' } },
      { $lookup: { from: 'orgs', localField: 'orgres.org', foreignField: '_id', as: 'orgs' } },
      { $lookup: { from: 'devices', localField: 'eid', foreignField: '_id', as: 'device' } },
      { $match: { $or: [{ name: { $regex: this.ctx.query.seek + '' || '' } }, { 'device.ip': { $regex: this.ctx.query.seek + '' || '' } }] } }
    ]
    let paging = [
      { $project: { chan: 1, name: 1, 'orgres.resource': 1, 'orgs.name': 1, 'device.ip': 1, 'device.name': 1, 'device.manufacturer': 1 } },
      { $skip: (this.ctx.query.page - 1) * this.ctx.query.limit },
      { $limit: Number(this.ctx.query.limit) }
    ]
    let [count, data] = await Promise.all([this.ctx.model.Resources.aggregate([...select, { $count: 'name' }]), this.ctx.model.Resources.aggregate([...select, ...paging])])
    count = count.length ? count : [{ name: 0 }]
    this.ctx.set({
      'X-BSC-COUNT': count[0].name,
      'X-BSC-PAGES': Math.ceil(count[0].name / this.ctx.query.limit),
      'X-BSC-CUR': parseInt(this.ctx.query.page),
      'X-BSC-LIMIT': parseInt(this.ctx.query.limit)
    })
    data.forEach((item, i) => {
      for (let index = 0; index < whitelist.data.whitelist.length; index++) {
        if (whitelist.data.whitelist[index].res1.split('-')[0] === (item._id + '')) {
          item['whitelist'] = whitelist.data.whitelist[index]
          break
        }
      }
    })
    return data
  }
  // 时间模板查询
  async getInquireTimeEmplate () {
    const PlanTemplate = await this.ctx.model.PlanTemplate.find()
    return PlanTemplate
  }
  // 诊断计划列表
  async getClearUpPlanList () {
    let count
    let planList = await this.ctx.curl(`${this.ctx.app.config.videoDiagnosisHost}/vd/task`, { dataType: 'json' })
    if (!planList.data.task) {
      return [[], 0]
    }
    count = planList.data.task.length
    if (planList.data.res !== 'OK') {
      this.ctx.status = 500
    }
    let filterPlanList = planList.data.task
    if (this.ctx.query.seek) { // 搜索名称
      let reg = new RegExp(this.ctx.query.seek)
      filterPlanList = planList.data.task.filter(item => {
        return item.name.match(reg)
      })
      count = filterPlanList.length
    }
    let pagePlanList = planList.data.task
    if (this.ctx.query.page) { // 分页功能
      pagePlanList = filterPlanList.slice((this.ctx.query.page - 1) * this.ctx.query.limit, this.ctx.query.page * this.ctx.query.limit)
    }
    let statusArr = []
    let cameraCountArr = []
    pagePlanList.forEach(item => {
      statusArr.push(this.ctx.curl(`${this.ctx.app.config.videoDiagnosisHost}/task/state?name=${encodeURI(item.name)}`, { dataType: 'json' }))
      cameraCountArr.push(this.ctx.curl(`${this.ctx.app.config.videoDiagnosisHost}/task/camera?task=${encodeURI(item.name)}&page=1&max=10000`, { dataType: 'json' }))
    })
    let [status, cameraCount] = await Promise.all([Promise.all(statusArr), Promise.all(cameraCountArr)])
    pagePlanList.forEach((item, index) => {
      item.states = status[index].data.res
      item.count = cameraCount[index].data.total
    })
    return [pagePlanList, count]
  }
}
module.exports = VideoDiagnosisService
