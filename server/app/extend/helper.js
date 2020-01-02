const _ = require('lodash')
const moment = require('moment')
const { spawn } = require('child_process')

// 过滤设备信息
const doDevStatus = async (influx, device, sTime, eTime, Storage, bigtype) => {
  // 前提，一组IP的记录，其设备类型必须是一样，这由前端通过指定设备类型来控制
  // 对 ipc 设备，目前只有一种通道，即ip和通道一一对应，多通道的情况暂不考虑
  //   const SQL = `select ${minimal ? 'status,time,eventTime' : '*'} from devicelog
  //   where devIp='${ip}' ${
  //   channel === null ? '' : 'and channel =' + `'${channel}'`

  const SQL = `select status from devicelog 
  where devIp='${device.ip}' and devPort='${device.cport}' `
  // 查找范围数据
  let devInfos = await influx.query(
    `select status from (${SQL} and time < '${eTime.format()}' and time > '${sTime.format()}'   order by time desc ) where "status" = 'online' or "status" = 'offline' order by time desc `
  )
  // 最后一条状态数据
  let lastStatus = await influx.query(
    `select status from (${SQL}  and time < '${sTime.format()}' order by time desc) where "status" = 'online' or "status" = 'offline' order by time desc limit 1 `
  )
  let dataOnline = []
  // 存储查询当天的数据

  // 记录上一条信息
  let tempStatus = {}
  for (let i = 0; i < devInfos.length; i++) {
    /* 出现重复online处理 根据设备ip和端口查询 设备资源中所指的存储服务的服务名(根据描述，所有资源都会指向同一个存储服务) ,
       查看在两次online中是否有存在服务offline的情况，如果有则将这个offline产生的时间节点插入两次onlie之中,
       如果没有则取两个online的中间时间插入一条offline记录 */
    // if (devInfos[i].status === tempStatus.status && tempStatus.status === 'online') {
    //   // {ip:device.ip,port:device.cport} { ip: '0.4.3.0', port: 3721 }
    //   let serverData = {}
    //   if (Number(bigtype) === 0) {
    //     let Storages = await Storage.find({}).populate({ path: 'resource', match: { ip: device.ip, port: device.cport } }).exec()
    //     serverData = Storages.find((item) => {
    //       return item.resource !== null
    //     })
    //     console.log(serverData, 'StoragesStorages')
    //   }
    //   let serverLog = await influx.query(
    //     `select * from "serverlog" where "serverName"='${serverData.server}' and time<'${tempStatus.time}' and time>'${devInfos[i]['time']['_nanoISO']}' and "status"='offline' limit 1`
    //   )
    //   let serverPoint = { ...tempStatus }
    //   if (serverLog.length > 0) {
    //     serverPoint.time = serverLog[0]['time']['_nanoISO']
    //     serverPoint.status = 'offline'
    //     dataOnline.push(serverPoint)
    //   } else {
    //     // 若没有发现offline则就在两个online中间位置插入一条offline信息
    //     serverPoint.time = moment(devInfos[i]['time']['_nanoISO']).add(moment(tempStatus.time).diff(moment(devInfos[i]['time']['_nanoISO'])) / 2, 'ms').utc().format()// serverLog[0]['time']['_nanoISO']
    //     serverPoint.status = 'offline'
    //     dataOnline.push(serverPoint)
    //   }
    // }
    // 去掉相同状态处理

    devInfos[i]['time'] = devInfos[i]['time']['_nanoISO']
    dataOnline.push(devInfos[i])
    tempStatus = devInfos[i]
  }

  // 计算在线
  if (lastStatus.length > 0) {
    lastStatus[0]['time'] = sTime.format()
    dataOnline.push(lastStatus[0])
  }
  return dataOnline
}

exports.doDevOnlineRate = async (influx, devices) => {
  let SQL = `select * from deviceRatelog.devOnlineRate `
  let WhereS = ''
  if (devices.length <= 200) {
    if (devices.length !== 0) {
      WhereS = ' where'
    }
    for (let i = 0; i < devices.length; i++) {
      WhereS += `  "devIp"='${devices[i].ip}'`
      if (i + 1 !== devices.length) {
        WhereS += ' or'
      }
    }
  }

  SQL += WhereS
  SQL += ' group by "devIp","devPort" order by time   desc limit 1'
  let dataRate = await influx.query(SQL)
  const rateMap = new Map(
    dataRate.map(item => {
      return [item.devIp + '-' + item.devPort, item.rate]
    })
  )

  for (let i = 0; i < devices.length; i++) {
    devices[i].rate = rateMap.get(devices[i].ip + '-' + devices[i].cport) || 0
  }
  return devices
}

exports.doDevHistoryStatus = async (
  influx,
  category,
  device,
  startTime,
  endTime,
  Storage,
  bigtype
) => {
  let startT = moment(startTime).utc()
  // 包括今天
  let endT = moment(endTime)
    .add(1, 'days')
    .utc()
  device.cport = device.port
  let data = await doDevStatus(influx, device, startT, endT, Storage, bigtype)
  if (!data || data.length === 0) {
    data = null
  } else {
    let arrStatus = []
    const arrTime = new Set() // 这个是所有要计算的天数
    let dayUnmber = 0
    let objTime = {}
    while (true) {
      let diffNumber = moment(endTime)
        .subtract(dayUnmber, 'days')
        .diff(moment(startTime))
      if (diffNumber >= 0) {
        if (
          moment(endTime)
            .subtract(dayUnmber, 'days')
            .isBefore(moment().utc())
        ) {
          let tempTime = moment(endTime)
            .subtract(dayUnmber, 'days')
            .format('YYYY-MM-DD')
          arrTime.add(tempTime)
          objTime[tempTime] = {
            t: tempTime,
            record: { g: [], s: [] }, // 为了数据完整性 没有删除
            online: { g: [], s: [] }
          }
        }
      } else {
        break
      }
      dayUnmber++
    }

    arrStatus = data
    data = []
    let timeArray = Array.from(arrTime)
    for (let i = 0; i < arrStatus.length; i++) {
      let itemTime = moment(arrStatus[i].time).format('YYYY-MM-DD')
      objTime[itemTime]['online'].g.push(arrStatus[i].time) // moment(arrStatus[i].time).format('YYYY-MM-DD HH:mm:ss')    arrStatus[i].time
      objTime[itemTime]['online'].s.push(arrStatus[i].status)
    }
    for (let i = 0; i < timeArray.length; i++) {
      data.push(objTime[timeArray[i]])
    }
    // console.log(data)
    // 检索是截止日期是否是今天
    let timeEnd = moment(endTime).diff(moment(moment().format('YYYY-MM-DD')))
    let lastStatus = ''
    // 给每一天的最后一天插入前一天最后一条数据
    for (let i = data.length - 1; i >= 0; i--) {
      data[i].online.g.reverse()
      data[i].online.s.reverse()

      if (data[i].online.g.length === 0) {
        data[i].online.g.unshift(
          moment(data[i].t).format('YYYY-MM-DD HH:mm:ss')
        )
        data[i].online.s.unshift(lastStatus)
      } else {
        data[i].online.g.unshift(
          moment(data[i].t).format('YYYY-MM-DD HH:mm:ss')
        )
        data[i].online.s.unshift(lastStatus)
        data[i].online.s.map(item => {
          lastStatus = item
        })
      }
      if (i === 0 && timeEnd === 0) {
        data[i].online.g.push(moment().format('YYYY-MM-DD HH:mm:ss'))
        data[i].online.s.push('')
      }
    }

    data.forEach((_, index, arr) => {
      arr[index]['online']['g'].forEach((_, subIndex, subArr) => {
        subArr[subIndex] = moment(subArr[subIndex]).format(
          'YYYY-MM-DD HH:mm:ss'
        ) // subArr[subIndex].substr(0, 19).replace('T', ' ')
      })
    })
  }
  return data
}

exports.doDevsRecordLog = async (influx, tag) => {
  const SQL = `select sum("duration") from recordlog 
  where devIp='${tag.devIp}' and devPort='${tag.devPort}' and channel='${tag.channel}'`
  let data = ''
  data = await influx.query(SQL)
  if (data.length === 1) {
    data = data[0].sum
    data = moment.duration(data, 'seconds')._data
    data = `${data.days}天${data.hours}小时${data.minutes}分钟`
  } else {
    data = ''
  }
  return data || '0天0小时0分钟'
}

exports.doRecode = async (influx, tag) => {
  if (tag.length === 0) {
    return {}
  }

  let WhereS = ' '
  if (tag.length <= 200) {
    if (tag.length !== 0) {
      WhereS = ' where'
    }
    for (let i = 0; i < tag.length; i++) {
      WhereS += `  "devIp"='${tag[i].ip}'`
      if (i + 1 !== tag.length) {
        WhereS += ' or'
      }
    }
  }
  let SQL = `select * from recordRatelog.recordRate`
  SQL += WhereS
  SQL += `group by "devIp","devPort","channel" order by time desc limit 1`

  let statusSQL = `select status from devicelog`
  statusSQL += WhereS
  statusSQL += `group by "devIp","devPort","channel" order by time desc limit 1`

  const [dataRate, recordStatus] = await Promise.all([influx.query(SQL), influx.query(statusSQL)])

  const rateMap = new Map(
    dataRate.map(item => {
      return [item.devIp + '-' + item.devPort + '-' + item.channel, item]
    })
  )

  const statusMap = new Map(
    recordStatus.map(item => {
      const status = item.status === 'offline' || item.status === 'online' ? 'stoprecord' : item.status
      return [item.devIp + '-' + item.devPort + '-' + item.channel, status]
    })
  )

  const result = {}
  tag.map(item => {
    const key = item.ip + '-' + item.port + '-' + item.channel
    result[key] = rateMap.get(key)
    if (!result[key]) {
      result[key] = {
        recording: statusMap.get(key)
      }
    } else {
      result[key].recording = statusMap.get(key)
    }
  })
  return result
}

const getHistoryRaw = async (influx, query, startT, endT) => {
  const SQL = `select status from devicelog 
  where devIp='${query.ip}' and devPort='${query.port}' and channel='${query.channel}' `
  // 查找范围数据
  let devInfos = await influx.query(
    SQL +
    ` and time < '${endT.format()}' and time > '${startT.format()}'   order by time desc`
  )
  // 最后一条状态数据
  let lastStatus = await influx.query(
    `select status from (${SQL}  and time < '${startT.format()}' order by time desc)  order by time desc limit 1 `
  )
  let dataOnline = []
  // 存储查询当天的数据
  for (let i = 0; i < devInfos.length; i++) {
    devInfos[i]['time'] = devInfos[i]['time']['_nanoISO']
    dataOnline.push(devInfos[i])
  }

  // 计算在线
  if (lastStatus.length > 0) {
    lastStatus[0]['time'] = startT.format()
    dataOnline.push(lastStatus[0])
  }
  return dataOnline
}

exports.doRecordHistory = async (influx, query) => {
  let startT = moment(query.sTime).utc()
  // 包括今天
  let endT = moment(query.eTime)
    .add(1, 'days')
    .utc()
  let devInfos = await getHistoryRaw(influx, query, startT, endT)
  if (_.isEmpty(devInfos)) {
    return []
  }
  // const dataRecord = []
  // let dataRecordStatus = false
  // for (let i = 0; i < devInfos.length; i++) {
  //   if (
  //     moment(moment(devInfos[i]['time'])).diff(query.eTime) >
  //     24 * 60 * 60 * 1000
  //   ) {
  //     continue
  //   }
  //   if (
  //     !dataRecordStatus &&
  //     (devInfos[i].status === 'startrecord' ||
  //       devInfos[i].status === 'stoprecord')
  //   ) {
  //     if (moment(devInfos[i]['time']).isBefore(query.sTime)) {
  //       dataRecord.push(devInfos[i])
  //       dataRecordStatus = true
  //     } else {
  //       dataRecord.push(devInfos[i])
  //     }
  //   }
  // }
  const arrTime = new Set() // 这个是所有要计算的天数
  let dayUnmber = 0
  while (true) {
    let diffNumber = moment(query.eTime)
      .subtract(dayUnmber, 'days')
      .diff(moment(query.sTime))
    if (diffNumber >= 0) {
      if (
        moment(query.eTime)
          .subtract(dayUnmber, 'days')
          .isBefore(moment().utc())
      ) {
        arrTime.add(
          moment(query.eTime)
            .subtract(dayUnmber, 'days')
            .format('YYYY-MM-DD')
        )
      }
    } else {
      break
    }
    dayUnmber++
  }
  let arrRecording = {}
  arrTime.forEach((key, item) => {
    arrRecording[key] = []
  })
  devInfos.forEach((item, index, arr) => {
    if (
      item.status === 'startrecord' ||
      item.status === 'stoprecord' ||
      item.status === 'offline'
    ) {
      const status = item.status === 'offline' ? 'stoprecord' : item.status
      if (status === 'startrecord') {
        arrRecording[moment(item.time).format('YYYY-MM-DD')].push([item.time, status])
      } else if (
        status === 'stoprecord' &&
        _.get(arr, `[${index - 1}].status`, '') !== 'stoprecord'
      ) {
        arrRecording[moment(item.time).format('YYYY-MM-DD')].push([item.time, status])
      }
    }
  })
  devInfos = []
  let time = Array.from(arrTime)
  for (let i = 0; i < time.length; i++) {
    let t = {
      t: time[i],
      record: { g: [], s: [] }
    }
    let arr = arrRecording[time[i]]
    arr.forEach(item => {
      t.record.g.push(item[0])
      t.record.s.push(item[1])
    })
    devInfos.push(t)
  }
  let lastStatus = 'stoprecord'
  for (let i = devInfos.length - 1; i >= 0; i--) {
    devInfos[i].record.g.reverse()
    devInfos[i].record.s.reverse()

    if (devInfos[i].record.g.length === 0) {
      devInfos[i].record.g.unshift(
        moment(devInfos[i].t).format('YYYY-MM-DD HH:mm:ss')
      )
      devInfos[i].record.s.unshift(lastStatus)
    } else {
      devInfos[i].record.g.unshift(
        moment(devInfos[i].t).format('YYYY-MM-DD HH:mm:ss')
      )
      devInfos[i].record.s.unshift(lastStatus)
      if (devInfos[i].record.s.length > 0) {
        lastStatus = devInfos[i].record.s[devInfos[i].record.s.length - 1]
      }
      // devInfos[i].record.s.map(item => {
      //   lastStatus = item
      // })
    }
    if (i === 0) {
      devInfos[i].record.g.push(moment().format('YYYY-MM-DD HH:mm:ss'))
      devInfos[i].record.s.push('')
    }
  }
  devInfos.forEach((_, index, arr) => {
    arr[index]['record']['g'].forEach((_, subIndex, subArr) => {
      subArr[subIndex] = moment(subArr[subIndex]).format('YYYY-MM-DD HH:mm:ss') // subArr[subIndex].substr(0, 19).replace('T', ' ')
    })
  })
  return devInfos
}

exports.getRecodeThisStatus = async influx => {
  const sql = `SELECT "status","devIp","devPort","channel" FROM "devicelog" GROUP BY "devIp","devPort","channel" ORDER BY time DESC LIMIT 1`

  let recordStatus = await influx.query(sql)

  return recordStatus
}

exports.getRecodeThisComplete = async influx => {
  const sql = `select integrity from recordRatelog.recordRate group by "devIp","devPort","channel" order by time desc limit 1`

  let recordStatus = await influx.query(sql)

  return recordStatus
}

// 设备在线率维护接口汇总
const os = require('os')
var cpuNumber = process.env.PROGRESS_COUNT || os.cpus().length // cpu核数量
// var processPool = [] // 设备统计线程组
exports.deviceOnlineRate = {
  // 守护在线情况
  GuardianOnline: async function (ctx) {
    require('events').EventEmitter.defaultMaxListeners = 100
    DeviceToProcessRun(ctx)
  }
}

// 根据设备数量分配线程
async function DeviceToProcessRun (ctx) {
  let devices = await ctx.model.Devices.find({})
    .lean()
    .exec()
  // 每个进程最大处理量
  let Cnumber =
    parseInt(devices.length / cpuNumber) + (devices.length % cpuNumber)
  ctx.logger.warn('devices.length', devices.length)
  for (let i = 0; i < devices.length; i += Cnumber) {
    let data = null
    if (i + Cnumber < devices.length) {
      data = devices.slice(i, i + Cnumber)
    } else {
      data = devices.slice(i)
    }
    runChildProcess(data, ctx)
  }
}
// 开启子进程
function runChildProcess (data, ctx) {
  const p = spawn('node', ['./app/utils/deviceOnlineRate.js'], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  })
  ctx.logger.warn('deviceChild pid:', p.pid)
  ctx.app.messenger.sendToAgent('device-Add', p.pid)
  // console.log('维护线程>', processPool, new Date())
  p.on('exit', code => {
    ctx.logger.warn('device线程退出', p.pid, new Date())
    ctx.app.messenger.sendToAgent('device-Sbu', p.pid)
  })

  p.on('error', error => {
    ctx.logger.warn('device线程报错', error, new Date())
    ctx.app.messenger.sendToAgent('device-Sbu', p.pid)
  })

  p.send({
    type: 'deviceData',
    data: data,
    influxdb: { host: process.env.INFLUX_HOST, database: 'bstar' }
  })
  p.stdout.on('data', data => {
    // ctx.logger.warn('device打印:', data.toString())
  })
  p.stderr.pipe(process.stderr)
}

// 录像维护接口汇总
exports.recordRate = {
  // 守护在线情况
  GuardianOnline: async function (ctx) {
    require('events').EventEmitter.defaultMaxListeners = 100
    RecordToProcessRun(ctx)
  }
}

// 根据录像数量分配线程
async function RecordToProcessRun (ctx) {
  let select = [
    {
      $match: {
        type: 0,
        // _id: mongoose.Types.ObjectId('5b877ea0f9ba394afdd2954c'),
        shareServer: { $exists: false }
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
    { $lookup: { 'from': 'plantemplates', 'localField': 'recode.planTemplateId', 'foreignField': '_id', 'as': 'plantemplate' } },
    { $lookup: { 'from': 'devices', 'localField': 'eid', 'foreignField': '_id', 'as': 'device' } },
    { $project: { chan: '$chan', name: '$name', status: '$status', _id: 1, device: { $arrayElemAt: ['$device', 0] }, port: '$port', planTemplateId: '$recode.planTemplateId' } },
    { $project: { channel: '$chan', devIp: '$device.ip', devPort: '$port', planTemplateId: { $arrayElemAt: ['$planTemplateId', 0] } } }
  ]

  let [recordRes, templates] = await Promise.all([
    ctx.model.Resources.aggregate(select),
    ctx.model.PlanTemplate.find({}).lean()])
  // 每个进程最大处理量
  let Cnumber =
    parseInt(recordRes.length / cpuNumber) + (recordRes.length % cpuNumber)
  ctx.logger.warn('recordRes.length(配置录像计划的设备数量)', recordRes.length)
  if (recordRes.length <= 0) {
    // 没有配置录像计划 就递归调用 指导配置以后
    setTimeout(() => {
      RecordToProcessRun(ctx)
    }, 60000)
  }
  for (let i = 0; i < recordRes.length; i += Cnumber) {
    let data = null
    if (i + Cnumber < recordRes.length) {
      data = recordRes.slice(i, i + Cnumber)
    } else {
      data = recordRes.slice(i)
    }
    runRecordChildProcess(data, templates, ctx)
  }
}

// 开启子进程
function runRecordChildProcess (data, templates, ctx) {
  const p = spawn('node', ['./app/utils/recordOnlineRate.js'], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  })
  ctx.logger.warn('recordChild pid:', p.pid)
  ctx.app.messenger.sendToAgent('record-Add', p.pid)
  p.on('exit', code => {
    ctx.logger.warn('record线程退出', p.pid, new Date())
    ctx.app.messenger.sendToAgent('record-Sbu', p.pid)
  })
  p.on('error', error => {
    // console.log('线程报错：', p.pid, error, new Date())
    ctx.logger.warn('record线程报错', error, new Date())
    ctx.app.messenger.sendToAgent('record-Sbu', p.pid)
  })
  p.send({
    type: 'recordData',
    data: data,
    templates: templates,
    influxdb: { host: process.env.INFLUX_HOST, database: 'bstar' },
    ctx
  })
  p.stdout.on('data', data => {
    // ctx.logger.warn('record打印:', data.toString())
  })
  p.stderr.pipe(process.stderr)
}
