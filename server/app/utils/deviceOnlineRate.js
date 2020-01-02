const Influx = require('influx')
const moment = require('moment')
const timeout = parseInt(process.env.DEVICE_RATE_TIME || 1000)
var influx = null
var mongoDevice = null

// 过滤设备信息
const doDevStatus = async (device, sTime, eTime) => {
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
  if (lastStatus.length === 0 && devInfos.length === 0) {
    console.log(`ip: ${device.ip}, port: ${device.cport}, sTime: ${moment(moment.utc(sTime).toDate()).format('YYYY-MM-DD HH:mm:ss')}, eTime: ${moment(moment.utc(eTime).toDate()).format('YYYY-MM-DD HH:mm:ss')}, INFLUXDB 无数据`)
  }
  // 存储查询当天的数据
  let dataOnline = []
  // 记录上一条信息
  let tempStatus = {}
  for (let i = 0; i < devInfos.length; i++) {
    /* 如两个online的中间时间插入一条offline记录 */
    if (devInfos[i].status === tempStatus.status && tempStatus.status === 'offline') {
      console.log(`设备状态连续两次离线: ip: ${device.ip}, prot: ${device.cport}, time: ${devInfos[i]['time']}`)
    }
    // if (devInfos[i].status === tempStatus.status && tempStatus.status === 'online') {
    //   let serverPoint = { ...tempStatus }
    //   serverPoint.time = moment(devInfos[i]['time']['_nanoISO']).add(moment(tempStatus.time).diff(moment(devInfos[i]['time']['_nanoISO'])) / 2, 'ms').utc().format()// serverLog[0]['time']['_nanoISO']
    //   serverPoint.status = 'offline'
    //   dataOnline.push(serverPoint)
    // }
    // 去掉两个相同状态处理

    devInfos[i]['time'] = devInfos[i]['time']['_nanoISO']
    dataOnline.push(devInfos[i])
    tempStatus = devInfos[i]
  }

  // 计算在线
  if (lastStatus.length > 0) {
    lastStatus[0]['time'] = sTime.format()
    dataOnline.push(lastStatus[0]) // [dataOnline.length - 1]['time'] = moment(sTime).format() // `${sTime}T00:00:00.000Z`
  }
  return dataOnline
}

// 计算单个设备在线率
async function calculateRate(data, sTime) {
  return new Promise((resolve, reject) => {
    let rate = 0

    try {
      if (!data || data.length === 0) {
        data = null
      } else {
        let arrStatus = data
        let onlineSecond = 0
        let tempItem = ''
        for (let i = 0; i < arrStatus.length; i++) {
          if (i === 0 && arrStatus[i].status === 'online') {
            let me = moment(arrStatus[i].time)
            onlineSecond += moment()
              .utc()
              .diff(me)
          }
          if (arrStatus[i].status === 'online' && tempItem !== '') {
            let me = moment(tempItem.time)
            let ms = moment(arrStatus[i].time)
            onlineSecond += me.diff(ms)
          }
          tempItem = arrStatus[i]
        }
        rate =
          parseInt(
            (onlineSecond /
              moment()
                .utc()
                .diff(moment(sTime))) *
            10000
          ) / 100
      }
    } catch (err) {
      reject(err)
    }
    // 限制速度
    setTimeout(() => {
      resolve(rate)
    }, timeout)
  })
}
process.on('message', async m => {
  if (m.type === 'deviceData') {
    mongoDevice = m.data
    influx = new Influx.InfluxDB({
      host: m.influxdb.host,
      database: m.influxdb.database,
      schema: []
    })

    let RpData = await influx.showRetentionPolicies(m.influxdb.database)
    for (var i = 0; i < RpData.length; i++) {
      if (RpData[i].name === 'deviceRatelog') {
        break
      }
    }
    if (i === RpData.length) {
      // 增加数据保留策略
      influx.createRetentionPolicy('deviceRatelog', {
        database: m.influxdb.database,
        duration: '5h',
        replication: 1,
        isDefault: false
      })
    }
    runCode()
  }
})

async function runCode() {
  let sTime = moment(
    moment()
      .utc()
      .format('YYYY-MM-DD')
  ).utc()
  let eTime = moment(
    moment()
      .add(1, 'days')
      .utc()
      .format('YYYY-MM-DD')
  ).utc()
  let points = []
  for (let i = 0; i < mongoDevice.length; i++) {
    //  获取在线情况
    let deviceData = await doDevStatus(mongoDevice[i], sTime, eTime)
    // 获取在线率
    let rate = await calculateRate(deviceData, sTime)
    points.push({
      measurement: 'devOnlineRate',
      tags: {
        devIp: mongoDevice[i].ip,
        devPort: mongoDevice[i].cport
      },
      fields: {
        rate: rate
      }
    })
  }

  // 写入数据库
  console.log('deviceRatelog开始写入数据', points.length)
  await influx.writePoints(points, {
    retentionPolicy: 'deviceRatelog'
  })
    .then(() => {
      console.log('设备写入成功', points.length)
    })
    .catch(error => {
      console.log('设备写入失败', points.length, error, points)
      process.exit()
    })
  process.exit()
}
