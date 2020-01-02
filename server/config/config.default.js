const path = require('path')
const fs = require('fs')
const dotenv = require('dotenv')
const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../node.conf'))) // 开发使用本地调试
// const envConfig = dotenv.parse(fs.readFileSync('/opt/bstar/maintenance/conf/node.conf')) // 部署使用
for (let k in envConfig) {
  process.env[k] = envConfig[k]
}
// 获取本机ip
function getIPAdress (ip) {
  if (process.env.EGG_SERVER_ENV === 'prod') {
    return ip
  }
  var interfaces = require('os').networkInterfaces()
  if (ip === '127.0.0.1') {
    for (var devName in interfaces) {
      var iface = interfaces[devName]
      for (var i = 0; i < iface.length; i++) {
        var alias = iface[i]
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
          return alias.address
        }
      }
    }
  } else {
    return ip
  }
}
module.exports = appInfo => {
  const config = (exports = {})
  config.keys = appInfo.name
  config.middleware = ['robot', 'compress']
  config.cluster = {
    listen: {
      port: Number(process.env.PORT),
      hostname: process.env.HOST_NAME
    }
  }
  config.notfound = {
    pageUrl: '/index.html'
  }
  config.compress = {
    threshold: 2048
  }
  config.static = {
    prefix: '/',
    dir: path.join(appInfo.baseDir, 'app/public'),
    dynamic: true,
    preload: false,
    maxAge: 0
  }
  config.view = {
    defaultViewEngine: 'nunjucks',
    mapping: {
      '.tpl': 'nunjucks'
    }
  }
  config.robot = {
    ua: [/Baiduspider/i]
  }
  config.security = {
    csrf: { enable: false },
    xframe: { enable: false }
  }
  config.onerror = {
    all (err, ctx) {
      ctx.body = { error: err }
      // ctx.status = 200
      ctx.status = 500
    }
  }
  config.bodyParser = {
    jsonLimit: '10mb'
  }
  config.jsonp = {
    csrf: true
  }
  config.logger = {
    level: process.env.LOGGER_LEVEL,
    appLogName: `device-and-record.log`,
    dir: '/opt/bstar/maintenance/log/egg/professional'
  }
  config.session = {
    renew: true
  }
  config.mongoose = {
    client: {
      url: process.env.MONGOOSE_URL,
      options: {}
    }
  }
  config.influx = {
    host: process.env.INFLUX_HOST,
    port: 8086,
    database: 'bstar',
    username: null,
    password: null
  }
  config.redis = {
    client: {
      host: process.env.REDIS_HOST,
      // host: process.env.VIDEO_HOST,
      port: process.env.REDIS_PORT,
      password: null,
      db: 15
    }
  }
  config.videoDiagnosisHost = `${getIPAdress(process.env.VIDEODIAGNOSIS_HOST.split(':')[0])}:${process.env.VIDEODIAGNOSIS_HOST.split(':')[1]}`
  config.picHost = getIPAdress(process.env.PIC_HOST)
  config.videoHost = getIPAdress(process.env.VIDEO_HOST)
  config.storageDevice = getIPAdress(process.env.VIDEO_HOST)
  return config
}
