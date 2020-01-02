const Influx = require('influx')
const moment = require('moment')
const _ = require('lodash')
const timeout = parseInt(process.env.DEVICE_RATE_TIME || 1000)
// const timeout = 0
var influx = null

// 计算单个设备录像完整率及已录时长
async function doRecode(recordInfo, templates = [], ctx) {
  try {
    const week = moment().weekday() === 0 ? 6 : moment().weekday() - 1
    let sTime =
      moment()
        .startOf('day')
        .format('X') * 1

    // const sql = `SELECT "status","eventTime","devIp","channel","devPort" FROM "devicelog"
    const sql = `SELECT "status" FROM "devicelog"
   WHERE "devIp" = '${recordInfo.devIp}' AND "devPort" = '${recordInfo.devPort}' AND "channel" = '${recordInfo.channel}'  ORDER BY time DESC`

    const recordList = await influx.query(sql)
    if (recordList.length === 0) {
      console.log(`record打印: ip: ${recordInfo.devIp}, port: ${recordInfo.devPort}， channel: ${recordInfo.channel}, influxdb 无数据`)
    }
    const elements = _.find(templates, item => item._id.toString() === recordInfo.planTemplateId)
    let timeTempList = _.sortBy(
      _.get(elements, `elements[${week}].timeList`, []),
      ['endTime']
    ).reverse()
    const RECORDTYPE = ['online', 'stoprecord', 'startrecord', 'offline']
    let dataRecord = []
    let dataRecordLock = new Map([['allLock', true]]) //  不同时间段的锁 allLock为当天全部锁
    let paragraphMap = new Map() // 不同时间段的录像日志
    timeTempList.map(item => {
      item && dataRecordLock.set(item, true)
      item && paragraphMap.set(item, [])
    })

    recordList.map(devInfo => {
      if (
        dataRecordLock.get('allLock') &&
        RECORDTYPE.includes(devInfo.status)
      ) {
        devInfo['time'] = moment(devInfo['time']['_nanoISO']).format('X') * 1
        dataRecord.push(devInfo)
        const timeTemps = timeTempList.filter(
          item => item.endTime <= sTime + devInfo['time']
        )
        timeTemps.map(temp => {
          if (dataRecordLock.get(temp)) {
            if (devInfo['time'] <= temp.endTime + sTime) {
              paragraphMap.get(temp).push(devInfo)
            }
            if (devInfo['time'] <= temp.beginTime + sTime) {
              dataRecordLock.set(temp, false)
            }
          }
        })
        if (devInfo['time'] <= sTime) {
          dataRecordLock.set('allLock', false)
        }
      }
    })
    let result = {}
    if (!dataRecord || dataRecord.length === 0) {
      dataRecord = null
    } else {
      // let publicField = _.cloneDeep(dataRecord[0])
      // 计算当前状态
      let arrRecording = []
      let recording = ''
      dataRecord.forEach((item, index, arr) => {
        if (
          RECORDTYPE.includes(item.status)
        ) {
          const status = item.status === 'offline' || item.status === 'online' ? 'stoprecord' : item.status
          if (status === 'startrecord') {
            arrRecording.push([item['time'], status])
          } else if (
            status === 'stoprecord' &&
            _.get(arr, `[${index - 1}].status`, '') !== 'stoprecord'
          ) {
            arrRecording.push([item['time'], status])
          }
        }
      })
      recording = arrRecording.length === 0 ? 'stoprecord' : arrRecording[0][1]
      // 计算当日录像完整率
      let recordingSecond = 0
      const arrLength = arrRecording.length
      const thisTime = parseInt(moment().format('X')) // 当前时间
      for (let i = 0; i < arrLength; i++) {
        const item = arrRecording[i]
        if (item[1] === 'startrecord') {
          if (i === 0) {
            if (item[0] <= sTime) {
              recordingSecond += thisTime - sTime
            } else {
              recordingSecond += thisTime - item[0]
            }
          } else {
            let preItem = arrRecording[i - 1]
            if (item[0] <= sTime) {
              recordingSecond += preItem[0] - sTime
            } else {
              recordingSecond += preItem[0] - item[0]
            }
          }
        }
      }
      let paragraphTime = 0
      let planTemplateSum = 0
      // 计算模板时间内录像情况
      paragraphMap.forEach((list, key) => {
        const PSTime = sTime + key.beginTime
        const PEndTime =
          sTime + key.endTime > thisTime ? thisTime : sTime + key.endTime
        if (PSTime < thisTime) {
          planTemplateSum += PEndTime - PSTime
        }
        for (let i = 0, listLength = list.length; i < listLength; i++) {
          const item = list[i]
          if (item.status === 'startrecord') {
            if (i === 0) {
              if (item['time'] <= PSTime) {
                if (PEndTime >= PSTime) {
                  paragraphTime += PEndTime - PSTime
                }
              } else {
                paragraphTime += PEndTime - item['time']
              }
            } else {
              let preItem = list[i - 1]
              if (item['time'] <= PSTime) {
                paragraphTime += preItem['time'] - PSTime
              } else {
                paragraphTime += preItem['time'] - item['time']
              }
            }
          }
        }
      })
      let duration = recordingSecond / 60
      let integrity = '0'
      if (timeTempList.length && planTemplateSum) {
        if (paragraphTime === planTemplateSum) {
          integrity = '100'
        } else if (paragraphTime === 0) {
          integrity = '0'
        } else {
          integrity = (
            (parseFloat(paragraphTime) * 100) /
            planTemplateSum
          ).toFixed(2) + ''
        }
      }
      result = {
        recording, // 当前录像计划是否正在录像
        integrity, // 当日录像记录完整率
        duration // 当日录像时长
      }
    }
    return result
  } catch (error) {
    console.log('record 计算出错:', error)
    throw error
  }
}

async function setTimeOut(result) {
  return new Promise((resolve, reject) => {
    // 限制速度
    setTimeout(() => {
      resolve(result)
    }, timeout)
  })
}

process.on('message', async m => {
  if (m.type === 'recordData') {
    const mongoRecord = m.data
    const templates = m.templates
    influx = new Influx.InfluxDB({
      host: m.influxdb.host,
      database: m.influxdb.database,
      schema: []
    })

    let RpData = await influx.showRetentionPolicies(m.influxdb.database)
    let check = RpData.find(item => item.name === 'recordRatelog')

    if (!check) {
      // 增加数据保留策略
      influx.createRetentionPolicy('recordRatelog', {
        database: m.influxdb.database,
        duration: '5h',
        replication: 1,
        isDefault: false
      })
    }

    runCode(mongoRecord, templates, m.ctx)
  }
})

async function runCode(mongoRecord, templates, ctx) {
  try {
    let points = []
    for (let i = 0; i < mongoRecord.length; i++) {
      //  获取单个录像率
      let deviceData = await doRecode(mongoRecord[i], templates, ctx)
      let result = await setTimeOut(deviceData)
      const obj = {
        measurement: 'recordRate',
        tags: {
          devIp: mongoRecord[i].devIp,
          devPort: mongoRecord[i].devPort,
          channel: mongoRecord[i].channel
        },
        fields: {
          integrity: _.get(result, 'integrity', '0'),
          duration: _.get(result, 'duration', 0)
        }
      }
      points.push(obj)
    }
    // 录像写入数据库
    console.log('recordRatelog开始写入数据', points.length)
    await influx.writePoints(points, {
      retentionPolicy: 'recordRatelog'
    })
      .then(() => {
        console.log('录像写入成功', points.length)
      })
      .catch(error => {
        console.log('录像写入失败', points.length, error, points)
        process.exit()
      })
    process.exit()
  } catch (error) {
    console.log('录像写入失败', error)
    process.exit()
  }
}
