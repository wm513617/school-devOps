module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema

  const DevicesSchema = new Schema(
    {
      bigtype: {
        // 设备大类   0：视频设备1：报警主机2：门禁设备3：ip对讲4：巡更设备5：解码器6：网络键盘,7：消防主机, 8:智能交通, 9:拼接控制器
        type: Number,
        default: 0,
        min: 0,
        max: 9,
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      },
      type: {
        // 设备类型
        type: String,
        default: 'ipc',
        enum: [
          'ipc',
          'nvr',
          'softDecoder',
          'hardDecoder',
          'doorAccess',
          'ticketGate',
          'fire',
          'keyboard',
          'alarmHost',
          'fingerPrint',
          'talkServer',
          'traffic',
          'stictchingCon',
          'alarmBox',
          'alarmPillar'
        ]
      },
      manufacturer: {
        type: String,
        default: 'dahua'
        // enum: ['dahua', 'hikvision', 'bstar', 'onvif','lida']
      }, // 厂商
      model: String, // 设备型号
      series: String, // 产品系列
      ip: {
        // ip地址
        type: String
        // required: true
      },
      intranetIp: String, // 内网ip
      adapterIp: String, // 适配器ip
      adapterPort: Number, // 适配器端口
      cport: Number, // 控制端口
      dport: Number, // 数据端口
      protocol: {
        type: String,
        default: 'rtsp',
        enum: ['tcp', 'udp', 'rtp', 'rtsp']
      }, // 传输协议
      username: {
        type: String
        // required: true
      }, // 用户名
      password: {
        type: String
        // required: true
      }, // 密码
      name: {
        // 设备名称
        type: String
        // required: true
      },
      ipcount: {
        type: Number,
        default: 0
      }, // ip通道数
      defenseicount: {
        type: Number,
        default: 0
      }, // 报警输入数量
      defenseocount: {
        type: Number,
        default: 0
      }, // 报警输出数量
      intercomcount: {
        type: Number,
        default: 0
      }, // 设备对讲数量
      decodecount: {
        type: Number,
        default: 0
      }, // 解码通道数
      voicecount: {
        type: Number,
        default: 0
      }, // 音频通道数
      encodingcount: {
        type: Number,
        default: 0
      }, // 编码通道数
      videoinputcount: {
        type: Number,
        default: 0
      }, // 视频输入通道数
      entranceguardcount: {
        type: Number,
        default: 0
      }, // 门禁通道数
      jointinputcount: {
        type: Number
      }, // 拼接控制器输入通道数
      status: {
        // 状态（false：离线 true：在线）
        type: Boolean,
        default: false // 默认离线添加
      },
      oid: {
        // 所属机构
        type: Schema.Types.ObjectId,
        ref: 'Orgs'
      },
      intelligent: {
        // 智能级别 //废物(在智能报警管理配置)
        type: Number,
        default: 0,
        required: true,
        enum: [0, 1, 2, 3] // 0：不支持智能 1普通智能 2人脸分析 3车辆识别
      },
      intelligentalarm: {
        // 智能报警显示
        type: Boolean,
        default: false
      },
      devicealarm: {
        // 设备报警显示
        type: Boolean,
        default: false
      },
      monitorypointalarm: {
        // 监控点报警显示
        type: Boolean,
        default: false
      },
      connMode: {
        type: String,
        default: 'active',
        enum: ['active', 'passive']
      },
      mainStream: {
        // 主码流url
        type: String,
        default: ''
      },
      subStream: {
        // 子码流url
        type: String,
        default: ''
      },
      deviceid: {
        // 设备编号
        type: Number
      },
      gridinstartnum: {
        type: Number // 消防主机防区输入起始编号
      },
      gridoutstartnum: {
        type: Number // 消防主机防区输出起始编号
      },
      shareServer: String, // 共享服务器
      shareType: String, // 共享类型
      nodeId: String, // 国标节点Id
      OnlineRateStatus: {
        type: Number, // 在线率是否异常 1: 正常 2：非正常 3：无记录
        default: 3
      },
      exid: {
        // 所属维修机构
        type: Schema.Types.ObjectId,
        ref: 'DeviceExtend'
      }
    },
    { timestamps: true }
  )

  DevicesSchema.methods = {}
  return mongoose.model('Devices', DevicesSchema)
}
