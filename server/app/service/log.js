const Controller = require('egg').Controller
const moment = require('moment')
const xlsx = require('node-xlsx')
class LogControlle extends Controller {
  async deviceLog (status, isExport) {
    let seek = this.ctx.query.seek || ''
    let isChinese = (temp) => {
      let reg = /[\\u4E00-\\u9FA5]/
      if (reg.test(temp)) return false
      return true
    }
    let seeArr = seek.toString().split('')
    seek = ''
    seeArr.forEach(item => {
      // 中文转为utf-16
      if (isChinese(item) && item !== '.') {
        seek += '\\' + '\\' + 'u' + item.codePointAt(0).toString(16)
      } else {
        seek += item
      }
    })
    let SQL
    if (isExport) {
      SQL = `select devIp,devPort,devType,time from devicelog where status = '${status}' AND time >='${moment(this.ctx.query.startTime * 1000).format()}' AND time <= '${moment(this.ctx.query.overTime * 1000).format()}'`
    } else {
      SQL = `select devIp,devPort,devType,time from devicelog where status = '${status}' AND time >='${moment(this.ctx.query.startTime * 1000).format()}' AND time <= '${moment(this.ctx.query.overTime * 1000).format()}' AND (devName =~ /${seek}/ or devIp =~ /${seek}/) order by time desc LIMIT ${this.ctx.query.limit} OFFSET ${(this.ctx.query.page - 1) * this.ctx.query.limit}`
    }
    const { influx } = this.app
    const SQL_COUNT = `select COUNT(devType) from devicelog where status = '${status}' AND time >='${moment(this.ctx.query.startTime * 1000).format()}' AND time <= '${moment(this.ctx.query.overTime * 1000).format()}' AND (devName =~ /${seek}/ or devIp =~ /${seek}/)`
    let [list, total] = await Promise.all([influx.query(SQL), influx.query(SQL_COUNT)])
    if (!list.length) {
      return {
        list: [],
        total: 0
      }
    }
    let devList = []
    let devTypeName = {
      fire: '消防主机',
      ipc: '摄像机',
      nvr: '录像机',
      softDecoder: '软解码器',
      alarmHost: '报警主机',
      talkServer: '对讲服务',
      keyboard: '键盘',
      hardDecoder: '硬解码器',
      stictchingCon: '拼接控制器',
      alarmBox: '报警箱',
      alarmPillar: '报警柱',
      sim: '短信猫'
    }
    let devObj = {}
    let orgObj = {}
    let [dev, org] = await Promise.all([this.ctx.model.Devices.find({}, { _id: 1, name: 1, oid: 1, cport: 1, ip: 1 }), this.ctx.model.Orgs.find({ type: 0 }, { _id: 1, name: 1 })])
    dev.forEach(item => {
      devObj[item.ip + item.cport] = item
    })
    org.forEach(item => {
      orgObj[item._id] = item
    })
    for (let index = 0; index < list.length; index++) {
      let dev = devObj[list[index].devIp + list[index].devPort]
      if (!dev) {
        continue
      }
      devList.push({
        eventTime: moment(list[index].time).unix(),
        name: dev.name || '',
        ip: list[index].devIp,
        deviceType: devTypeName[list[index].devType],
        orgName: dev.oid && orgObj[dev.oid].name ? orgObj[dev.oid].name : '',
        type: this.ctx.query.type
      })
    }
    return {
      list: devList,
      total: total[0].count
    }
  }
  async serverLog (status, isExport) {
    const { influx } = this.app
    let seek = this.ctx.query.seek || ''
    let SQL
    if (isExport) {
      SQL = `select serverIp,serverName,serverType,time from serverlog where status = '${status}' AND time >= '${moment(this.ctx.query.startTime * 1000).format()}' and time <= '${moment(this.ctx.query.overTime * 1000).format()}'`
    } else {
      SQL = `select serverIp,serverName,serverType,time from serverlog where status = '${status}' AND time >= '${moment(this.ctx.query.startTime * 1000).format()}' and time <= '${moment(this.ctx.query.overTime * 1000).format()}' and (serverName =~ /${seek}/ or serverIp =~ /${seek}/) order by time desc LIMIT ${this.ctx.query.limit} OFFSET ${(this.ctx.query.page - 1) * this.ctx.query.limit}`
    }
    const SQL_COUNT = `select COUNT(serverName) from serverlog where status = '${status}' AND time >= '${moment(this.ctx.query.startTime * 1000).format()}' and time <= '${moment(this.ctx.query.overTime * 1000).format()}' and (serverName =~ /${seek}/ or serverIp =~ /${seek}/)`
    let [list, total] = await Promise.all([influx.query(SQL), influx.query(SQL_COUNT)])
    if (!list.length) {
      return {
        list: [],
        total: 0
      }
    }
    let serverList = []
    let serverTypeList = {
      DataServer: '存储服务',
      TransmitServer: '流媒体转发',
      DeviceAdapterServer: '设备接入服务',
      PlanServer: '计划任务服务',
      EventServer: '事件服务',
      NoticeServer: '通知服务',
      ManageServer: '中心管理服务',
      TaServer: '对讲服务器',
      LoginServer: '登陆服务器',
      SipBrokerServer: '国标下联服务器'
    }
    for (let index = 0; index < list.length; index++) {
      serverList.push({
        eventTime: moment(list[index].time).unix(),
        name: list[index].serverName,
        ip: list[index].serverIp,
        deviceType: serverTypeList[list[index].serverType],
        orgName: '',
        type: this.ctx.query.type
      })
    }
    return {
      list: serverList,
      total: total[0].count
    }
  }
  async diagnoseLog (isExport) {
    let maxTotal = 100000
    if (isExport) {
      // 如果是导出
      this.ctx.query.page = 1
      this.ctx.query.limit = maxTotal
      this.ctx.query.seek = ''
    }
    let getResult = (data) => {
      return this.ctx.curl(`${this.ctx.app.config.videoDiagnosisHost}/vd/result`, {
        method: 'post',
        contentType: 'json',
        data,
        dataType: 'json'
      })
    }
    let data = {
      'type': 'alarm', // 获取诊断异常项
      'page': Number(this.ctx.query.page || 1),
      'max': Number(this.ctx.query.limit || 100),
      'starttime': Number(Math.floor(this.ctx.query.startTime)),
      'endtime': Number(Math.floor(this.ctx.query.overTime))
    }
    let result = []
    let total
    if (this.ctx.query.seek !== '') { // 搜索功能
      let select = [
        { $match: { $or: [{ name: { $regex: this.ctx.query.seek + '' || '' } }, { ip: { $regex: this.ctx.query.seek + '' || '' } }] } },
        { $project: { rtsp: 1 } }
      ]
      let resourceSeek = await this.ctx.model.Resources.aggregate(select)
      let rtspSeekArr = []
      data.page = 1
      data.max = maxTotal // 分页只能用js做
      resourceSeek.forEach(item => {
        if (item.rtsp) {
          data.url = item.rtsp.main.replace(new RegExp('ip:port'), this.ctx.app.config.videoHost)
          rtspSeekArr.push(getResult(data))
          data.url = item.rtsp.sub.replace(new RegExp('ip:port'), this.ctx.app.config.videoHost)
          rtspSeekArr.push(getResult(data))
        }
      })
      let resultResource = await Promise.all(rtspSeekArr)
      resultResource.forEach(item => {
        if (item.data.val) {
          result = [...item.data.val, ...result]
        }
      })
      total = result.length
    } else {
      // 因为需要倒叙  只能自己做分页了
      data.max = maxTotal
      data.page = 1
      result = await getResult(data)
      total = result.data.total
      result = result.data.val
    }

    let rids = []
    if (result === null) {
      return {
        list: [],
        total: 0
      }
    }
    result.forEach(item => {
      rids.push(item[1].replace(new RegExp(this.ctx.app.config.videoHost), 'ip:port'))
    })
    rids = [...new Set(rids)]
    let select = [
      { $match: { $or: [ { 'rtsp.main': { $in: rids } }, { 'rtsp.sub': { $in: rids } } ] } },
      { $match: { $or: [{ name: { $regex: this.ctx.query.seek + '' || '' } }, { ip: { $regex: this.ctx.query.seek + '' || '' } }] } },
      { $lookup: { from: 'devices', localField: 'eid', foreignField: '_id', as: 'devices' } },
      { $lookup: { from: 'orgres', localField: '_id', foreignField: 'resource', as: 'orgres' } },
      { $lookup: { from: 'orgs', localField: 'orgres.org', foreignField: '_id', as: 'orgs' } },
      { $project: { name: 1, rtsp: 1, 'devices.type': 1, ip: 1, 'orgs.name': 1 } }
    ]
    let resource = await this.ctx.model.Resources.aggregate(select)

    let resourceObj = {}
    for (const iterator of resource) { // 将数据库资源信息转成对象 方便查取
      let arr = iterator.rtsp.main.split('/')
      resourceObj[arr[arr.length - 1]] = iterator
    }
    let startIndex = 0
    let endIndex = result.length

    // if (this.ctx.query.seek !== '') {
    startIndex = (Number(this.ctx.query.page) - 1) * Number(this.ctx.query.limit)
    endIndex = Number(this.ctx.query.page) * Number(this.ctx.query.limit)
    // }
    // 录像段排序
    function compare() { // 这是比较函数
      return function(m, n) {
        var a = m[0]
        var b = n[0]
        return b - a // 降序
      }
    }
    result.sort(compare())
    let devList = []
    for (let index = startIndex; index < endIndex; index++) {
      let item = result[index]
      if (!item) break // 可能会出现分页数量比请求返回数据条数多 所以没有数据后结束for
      let arr = item[1].split('/')
      let id = arr[arr.length - 1]
      if (!resourceObj[id]) continue
      devList.push({
        url: item[1],
        eventTime: item[0],
        name: resourceObj[id].name || '',
        ip: resourceObj[id].ip || '',
        deviceType: resourceObj[id].devices.length ? resourceObj[id].devices[0].type : '',
        orgName: resourceObj[id].orgs.length ? resourceObj[id].orgs[0].name : '',
        type: this.ctx.query.type,
        pic: `http://${this.ctx.app.config.picHost}/ops/pic/${item[14]}`
      })
    }
    //   [
    //     1559285932,
    //     "rtsp://192.168.20.7/main/id=26",
    //     "alarm",
    //     30,
    //     0,
    //     79,
    //     100,
    //     100,
    //     40,
    //     0,
    //     0,
    //     15,
    //     0,
    //     0,
    //     "1559285929-266189492.jpg"
    // ],
    return {
      list: devList,
      total
    }
  }
  /**
   * @description:
   * @param {isExport} true: 导出
   * @return:
   */
  async selectLog (isExport) {
    // type ： 0：设备上线，1：设备离线，2：录像缺失，3： 视频流中断， 4：存储写入失败， 5：服务上线，6：服务离线，7：9种视频诊断异常
    let data, total
    if ([0, 1].includes(Number(this.ctx.query.type))) {
      let status
      if (Number(this.ctx.query.type) === 0) {
        status = 'online'
      } else {
        status = 'offline'
      }
      let res = await this.ctx.service.log.deviceLog(status, isExport)
      total = res.total
      data = res.list
    }
    if ([5, 6].includes(Number(this.ctx.query.type))) {
      let status
      if (Number(this.ctx.query.type) === 5) {
        status = 'online'
      } else {
        status = 'offline'
      }
      let res = await this.ctx.service.log.serverLog(status, isExport)
      total = res.total
      data = res.list
    }
    if (Number(this.ctx.query.type) === 7) {
      let res = await this.ctx.service.log.diagnoseLog(isExport)
      total = res.total
      data = res.list
    }
    if ([2, 3, 4].includes(Number(this.ctx.query.type))) {
      data = []
      total = 0
    }
    this.ctx.set({
      'X-BSC-COUNT': total,
      'X-BSC-PAGES': Math.ceil(total / this.ctx.query.limit),
      'X-BSC-CUR': parseInt(this.ctx.query.page),
      'X-BSC-LIMIT': parseInt(this.ctx.query.limit)
    })
    return data
  }
  async exportLog () {
    // 0：设备上线，1：设备离线，2：录像缺失，3： 视频流中断， 4：存储写入失败， 5：服务上线，6：服务离线，7：9种视频诊断异常
    let typeName = {
      0: '设备上线',
      1: '设备离线',
      2: '录像缺失',
      3: '视频流中断',
      4: '存储写入失败',
      5: '服务上线',
      6: '服务离线',
      7: '7种视频诊断异常'
    }
    let assetsList = await this.ctx.service.log.selectLog(true)
    // eslint-disable-next-line standard/array-bracket-even-spacing
    const data = [[ '时间', '名称', '设备IP', '设备类型', '所属机构', '日志类型']]
    let newList = assetsList.map(item => {
      return {
        eventTime: moment(item.eventTime * 1000).format('YYYY-MM-DD HH:mm:ss'),
        name: item.name,
        ip: item.ip,
        deviceType: item.deviceType,
        orgName: item.orgName,
        type: typeName[item.type]
      }
    })
    newList.forEach(val => {
      data.push([val.eventTime, val.name, val.ip, val.deviceType, val.orgName, val.type])
    })
    let buffer = xlsx.build([{ name: '运维日志', data }])
    const timeStr = new Date().toLocaleString().replace(/[-: ]/g, '')
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
    let filename = `${'运维日志'}-${timeStr}.xlsx`
    return { buffer, filename }
  }
  async particularsLog () {
    let data = {
      'type': 'alarm', // 获取诊断异常项
      'page': Number(this.ctx.query.page || 1),
      'max': Number(this.ctx.query.limit || 10000),
      'starttime': Number(Math.floor(this.ctx.query.startTime)),
      'endtime': Number(Math.floor(this.ctx.query.overTime)),
      'url': this.ctx.query.url
    }
    const result = await this.ctx.curl(`${this.ctx.app.config.videoDiagnosisHost}/vd/result`, {
      method: 'post',
      contentType: 'json',
      data,
      dataType: 'json'
    })
    let resource = []
    // md=移动帧；sc=场景切换；ac=清晰度异常；vc=画面遮挡；ab=亮度异常；sm=信号缺失；pf=画面冻结；nd=噪声；pc=偏色；ptz=云台失控；
    let diagnosisTask = {
      // md: '移动侦测',
      sc: '场景切换',
      ac: '清晰度异常',
      vc: '画面遮挡',
      ab: '亮度异常',
      sm: '信号缺失',
      pf: '画面冻结',
      nd: '噪声检测',
      pc: '偏色检测'
      // ptz: '云台失控'
    }
    let diagnosisIndexObj = {
      // 'md': 0,
      'sc': 1,
      'ac': 2,
      'vc': 3,
      'ab': 4,
      'sm': 5,
      'pf': 6,
      'nd': 7,
      'pc': 8
      // 'ptz': 9
    }
    // “md”, “sc”, “ac”, “vc”, “ab”, “sm”, “pf”, “nd”, “pc”, “ptz”,
    let exceptionItem
    let pic
    if (!result.data.val) {
      return {
        status: false, // 没有状态 就默认不在线
        diagnosisItem: '',
        exceptionItem: '',
        pic: ''
      }
    }
    for (const iterator of result.data.val) {
      if (Number(iterator[0] === Number(this.ctx.query.time))) {
        let details = JSON.parse(JSON.stringify(iterator))
        // 查询设备在线状态
        let url = details[1].replace(new RegExp(this.ctx.app.config.videoHost), 'ip:port')
        let select = [
          { $match: { $or: [ { 'rtsp.main': url }, { 'rtsp.sub': url } ] } },
          { $lookup: { from: 'devices', localField: 'eid', foreignField: '_id', as: 'devices' } },
          { $project: { 'devices.status': 1 } }
        ]
        resource = await this.ctx.model.Resources.aggregate(select)
        let arr = []
        let [, urlObj] = await this.ctx.service.videoDiagnosis.getAllDiagnoseCamera()
        // 此处判断哪项为诊断异常需要自己通过诊断阈值作对比
        let threshold = await this.ctx.curl(`${this.ctx.app.config.videoDiagnosisHost}/task/camera/customization?url=${details[1]}&task=${encodeURI(urlObj[url].name)}`, { dataType: 'json' })
        if (threshold.data.threshold === null) {
          // 个性化没有值看全局
          threshold = await this.ctx.curl(`${this.ctx.app.config.videoDiagnosisHost}/sys/para/threshold`, { dataType: 'json' })
        }
        for (const key in diagnosisIndexObj) {
          for (const item of threshold.data.threshold) {
            if (key === item.name) {
              if (details[diagnosisIndexObj[key] + 4] > item.val) { // 注意 此处北京提供接口文档有问题 所有是 加 4， 按文档是 加 3
                // 异常项
                arr.push(diagnosisTask[key])
                break
              }
            }
          }
        }
        exceptionItem = arr.join('、')
        pic = details[14]
        break
      }
    }
    let taskObj = await this.ctx.service.videoDiagnosis.getAllDiagnoseCamera()
    let key = this.ctx.query.url.replace(new RegExp(this.ctx.app.config.videoHost), 'ip:port').toString()
    let planList = await this.ctx.curl(`${this.ctx.app.config.videoDiagnosisHost}/vd/task?name=${encodeURI(taskObj[1][key].name)}`, { dataType: 'json' })
    let diagnosisItem = []
    for (const item of planList.data.task[0].para) {
      if (item.enable === 'enable') {
        if (['md', 'ptz'].includes(item.name)) { // 去掉这三个诊断状态
          continue
        }
        diagnosisItem.push(diagnosisTask[item.name])
      }
    }
    return {
      status: resource.length ? resource[0].devices.length ? resource[0].devices[0].status : false : false, // 没有状态 就默认不在线
      // diagnosisItem: '移动侦测、场景切换、清晰度异常、画面遮挡、亮度异常、信号缺失、画面冻结、噪声、偏色、云台控制',
      diagnosisItem: diagnosisItem.join('、'),
      exceptionItem: exceptionItem || '',
      pic: `http://${this.ctx.app.config.picHost}/ops/pic/${pic}`
    }
  }
}
module.exports = LogControlle
