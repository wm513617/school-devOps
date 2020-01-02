module.exports = app => {
  const mongoose = app.mongoose
  const Schema = mongoose.Schema

  const ResourcesSchema = new Schema(
    {
      name: {
        type: String,
        required: true
      }, // 通道名称
      chan: {
        type: Number,
        default: 1,
        required: true
      }, // 通道号
      type: {
      // 0：视频通道 1：视频报警输入 2：视频报警输出通道 3：对讲通道 4：门禁通道 5：解码通道 6：音频通道 7：解码报警输入
      // 8：解码报警输出 9：报警主机报警输入 10：报警主机报警输出 11：消防输入防区 12：消防输出防区 ,15 拼接输入通道
        type: Number,
        default: 0,
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15]
      },
      monitortype: {
      // 监控点类型
        type: Number,
        default: 0,
        enum: [0, 1, 2, 3, 4] // 0:枪机,1:红外枪机,2:半球,3:快球,4:全景
      },
      stream: {
      // 码流
        type: String,
        default: 'main',
        enum: ['main', 'sub1', 'sub2', 'pic'] // 主码流：main  子码流：sub1  第三码流：sub2  图片流：pic
      },
      keycode: String, // 键盘控制号
      status: {
      // 状态
        type: Number,
        default: 0,
        enum: [0, 1] // 0:停用,1:启用
      },
      isprerecord: {
        type: Boolean,
        default: false
      }, // 是否开启预录
      isdelayrecord: {
        type: Boolean,
        default: false
      }, // 是否开启延录
      precord: {
        type: Number,
        default: 30
      }, // 预录时间
      delayrecord: {
        type: Number,
        default: 300
      }, // 延录时间
      ip: String, // ip
      port: Number, // 端口号
      protocol: String, // 协议
      model: String, // 设备型号
      eid: {
      // 所属设备
        type: Schema.Types.ObjectId,
        ref: 'Devices',
        required: true
      },
      rtsp: {
        main: {
        // 主码流rtsp
          type: String
        },
        sub: {
        // 子码流rtsp
          type: String
        }
      }, // rtsp视频流地址（预留）
      channelid: Number, // 视频资源通道号（车辆使用）
      intelligent: {
      // 0：不支持智能 1普通智能 2人脸分析 3车辆识别
        type: Number,
        default: 0,
        enum: [0, 1, 2, 3]
      },
      passway: {
      // 出入口定义（0：普通 1：入口 2：出口）
        type: Number,
        default: 0,
        enum: [0, 1, 2]
      },
      server: {
      // 智能分析服务器id
        type: Schema.Types.ObjectId,
        ref: 'ServerSetting'
      },
      hasserver: {
      // 是否分配智能分析服务器
        type: Boolean,
        default: false
      },
      analysisType: {
      // 分析类型
        type: Number,
        required: true,
        default: 0,
        enum: [0, 1] // 0:通行系统 1：抓拍系统
      },
      level: {
      // 级别
        type: Number
      },
      alarmtype: {
      // 报警分类
        type: Schema.Types.ObjectId,
        ref: 'alarmType'
      },
      alarmouttype: {
      // 报警输出类型
        type: String,
        enum: [0, 1], // 0:常开，1:常闭
        default: 0
      },
      alarmtemplate: {
      // 布撤防时间
        type: Schema.Types.ObjectId,
        ref: 'alarmTimeTemplate'
      },
      maxdelaytime: {
      // 最大延迟时间
        type: Number,
        default: 300
      },
      minintervaltime: {
      // 最小间隔时间
        type: Number,
        default: 300
      },
      durationtime: {
      // 持续时间
        type: Number,
        default: 10
      },
      exportdelaytime: {
      // 输出延迟时间
        type: Number,
        default: 0
      },
      devloop: {
        type: String
      },
      mapsign: {
      // 地图标识
        signflag: {
          type: Boolean
        },
        signtype: {
          type: Number,
          enum: [0, 1, 2] // 0:图标,1:线,2:区域
        },
        signvalue: {
          type: String
        }
      },
      alarmaffirm: {
      // 报警确认
        affirmflag: {
          type: Boolean
        },
        autoaffirm: {
          status: {
            type: Boolean
          },
          intervaltime: {
            type: Number // 时间间隔
          }
        },
        handaffirm: {
          status: {
            type: Boolean
          }
        }
      },
      // 绑定资源
      res: {
        type: [Schema.Types.ObjectId],
        ref: 'Resources'
      },
      pinyin: String,
      shareServer: String, // 共享服务器
      shareType: String, // 共享类型
      nodeId: String, // 分享的节点ID
      gbPlaDevIp: String, // 国际设备IP 或者平台IP
      gbPlaDevPort: String, // 国际设备或者平台的PORT
      gbDevId: String, // 国际设备编码
      gbParentDevId: String, // 国际设备父节点编码
      gbPlaNvrId: String // 国标平台或者NVR国标编码
    },
    { timestamps: true }
  )

  return mongoose.model('Resources', ResourcesSchema)
}
