const Service = require('egg').Service
// const _ = require('lodash')
const moment = require('moment')
const xlsx = require('node-xlsx')
const { req } = require('./req')

class DevicesService extends Service {
  async getAllDevices (orgId) {
    const data = await this.ctx.model.Devices.find({ oid: orgId })
    return data
  }
  // async getwrite (data) {
  //   // 在redis中存入所有设备的ip和端口
  //   let deviceIds = []
  //   console.time('test')
  //   for (var item of data) {
  //     deviceIds.push(item._id)
  //     let redisKey = item.ip + ':' + item.cport
  //     const reply = await this.app.redis.exists(redisKey)
  //     if (reply === 1) {
  //       continue
  //     } else {
  //       await this.app.redis.set(redisKey, item._id)
  //       // await this.app.redis.expire(redisKey, 30000)
  //     }
  //   }
  //   await this.app.redis.del('deviceIds')
  //   await this.app.redis.lpush('deviceIds', deviceIds)
  //   // console.log(await this.app.redis.llen('deviceIds'))
  //   console.timeEnd('test')
  // }
  async getwrite () {
    const deviceData = await this.ctx.model.Devices.find({}, 'ip cport').lean().exec()
    // 在redis中存入所有设备的ip和端口
    const deviceIds = []
    const dataObject = {}
    for (var item of deviceData) {
      deviceIds.push(item._id)
      let objectKey = item.ip + ':' + item.cport
      dataObject[objectKey] = item._id
    }
    const reply = await this.app.redis.exists('deviceIds')
    if (reply === 1) {
      await this.app.redis.del('deviceIds')
    }
    await Promise.all([this.app.redis.set('deviceIps', JSON.stringify(dataObject)), this.app.redis.lpush('deviceIds', deviceIds)])
  }
  async devOnlineList () {
    return req({
      method: 'get',
      url: `/api/dev/onlinelist`,
      body: {},
      json: true,
      timeout: 5000 // 请求超时5s
    })
  }
  // 查询设备列表，通过机构ID，页码，数量等限制条件
  async getListByQuery (params) {
    const { influx } = this.app
    // let devices = []
    // let devicesPage = []
    let devicesCount = []
    // let influxPromises = []
    let rateStatus = this.ctx.query.onLineRate || '' // 'abnormal':异常  'normal'：正常   '':没有参数
    // 获取机构和bigytype下的设备
    let devices = null
    let devicesPage = null
    // 不筛选在选率
    if (rateStatus === '') {
      ;[devices, devicesPage] = await Promise.all([
        this.ctx.model.Devices.find(params.query, params.fileds)
          .skip(params.limit * (params.page - 1))
          .limit(params.limit)
          .populate(params.population)
          .lean()
          .exec(),
        this.ctx.model.Devices.find(params.query, params.fileds)
          .lean()
          .exec()
      ])
    } else {
      // 筛选在线率
      ;[devices, devicesPage] = await Promise.all([
        this.ctx.model.Devices.find(params.query, params.fileds)
          .populate(params.population)
          .lean()
          .exec(),
        this.ctx.model.Devices.find(params.query, params.fileds)
          .lean()
          .exec()
      ])
    }
    let onlineNumber = 0 // 在线数量
    let offlineNumber = 0 // 离线数量
    for (let i = 0; i < devicesPage.length; i++) {
      devicesPage[i].status ? onlineNumber++ : offlineNumber++
    }

    devices = await this.ctx.helper.doDevOnlineRate(influx, devices)

    // 过滤在线率
    if (rateStatus !== '') {
      let newDevice = [] // 存放所有数据
      let normalDevice = [] // 存放正常数据
      let abnormityDevice = [] // 存放异常数据
      let pageDevice = [] //  存放当前页要显示的数据

      onlineNumber = 0 // 在线数量
      offlineNumber = 0 // 离线数量
      // 分离数据
      for (let i = 0; i < devices.length; i++) {
        if (devices[i].rate === 100) {
          // 正常数据
          normalDevice.push(devices[i])
        } else {
          // 异常数据
          abnormityDevice.push(devices[i])
        }
      }
      // 根据条件确认使用哪一个数据
      if (rateStatus === 'abnormal') {
        newDevice = abnormityDevice
      } else if (rateStatus === 'normal') {
        newDevice = normalDevice
      }

      // 分页处理
      let j = 0
      for (
        let i = params.limit * (params.page - 1);
        i < newDevice.length;
        i++
      ) {
        if (j === params.limit) {
          break
        } else {
          pageDevice.push(newDevice[i])
          j++
        }
      }

      // 数据统计
      newDevice.map(itme => {
        itme.status ? onlineNumber++ : offlineNumber++
      })
      devicesPage = newDevice
      devices = pageDevice
    }

    let empTime = moment().hours() * 60 + moment().minutes()
    devices.map(m => {
      m.status = m.status ? 'online' : 'offline'
      m.offTime = ''
      m.offTime = empTime * (1 - m.rate / 100)
      m.rate = m.rate + ''
    })

    // 创建分页数据
    devicesCount = devicesPage.length
    return [devices, devicesCount, onlineNumber, offlineNumber]
  }
  async getDeviceCount (params) {
    return Promise.all([
      this.ctx.model.Devices.countDocuments({ bigtype: 0, ...params }),
      this.ctx.model.Devices.countDocuments({ bigtype: 1, ...params }),
      this.ctx.model.Devices.countDocuments({ bigtype: 7, ...params }),
      this.ctx.model.Devices.countDocuments({ bigtype: 5, ...params }),
      this.ctx.model.Devices.countDocuments({ bigtype: 9, ...params })
    ])
  }
  async exportDeviceList (allChildrenIds) {
    let xlsxName
    switch (this.ctx.query.bigtype) {
      case '0':
        xlsxName = '视频设备'
        break
      case '1':
        xlsxName = '报警主机'
        break
      case '7':
        xlsxName = '消防主机'
        break
      case '5':
        xlsxName = '解码器'
        break
      case '9':
        xlsxName = '拼接控制器'
        break
      default:
        this.ctx.status = 400
    }
    let selectDevice = [
      { $match: { bigtype: { $eq: Number(this.ctx.query.bigtype) }, shareServer: { $exists: false }, oid: { $in: allChildrenIds }, type: { $nin: ['alarmBox', 'alarmPillar'] } } },
      {
        $lookup: {
          from: 'orgs',
          localField: 'oid',
          foreignField: '_id',
          as: 'org'
        }
      },
      { $project: { name: 1, 'org.name': 1, ip: 1, manufacturer: 1, type: 1, cport: 1, status: 1 } }
    ]
    let deviceList = await this.ctx.model.Devices.aggregate(selectDevice)

    let influxData = await this.ctx.helper.doDevOnlineRate(this.app.influx, deviceList)
    let empTime = moment().hours() * 60 + moment().minutes()
    influxData.map(m => {
      m.status = m.status ? '在线' : '离线'
      m.org = m.org.length > 0 ? m.org[0].name : ''
      m.offTime = ''
      m.offTime = `${parseInt((empTime * (1 - m.rate / 100)) / 60)}时${parseInt((empTime * (1 - m.rate / 100)) % 60)}分`
      m.rate = m.rate + '%'
    })
    const data = [
      [
        '设备名称',
        '所属机构',
        'IP地址',
        '在线状态',
        '在线率',
        '厂商',
        '设备型号',
        '离线时长'
      ]
    ]
    influxData.forEach(val => {
      data.push([
        val.name,
        val.org,
        val.ip,
        val.status,
        val.rate,
        val.manufacturer,
        val.type,
        val.offTime
      ])
    })
    let buffer = xlsx.build([{ name: xlsxName, data }])
    const timeStr = new Date().toLocaleString().replace(/[-: ]/g, '')
    this.ctx.set('Content-Type', 'application/vnd.openxmlformats')
    let filename = `${xlsxName}-${timeStr}.xlsx`
    return { buffer, filename }
  }
}
module.exports = DevicesService
