module.exports = app => {
  app.once('server', server => {
    // websocket
  })
  // eslint-disable-next-line handle-callback-err
  app.on('error', (err, ctx) => {
    // report error
    // ctx.body = {}
  })
  app.on('request', ctx => {
    // log receive request
  })
  app.on('response', ctx => {
    // ctx.starttime is set by framework
  })
  app.messenger.on('recordSync', data => {
    const ctx = app.createAnonymousContext()
    ctx.helper.recordRate.GuardianOnline(ctx)
  })

  app.messenger.on('deviceSync', data => {
    const ctx = app.createAnonymousContext()
    ctx.helper.deviceOnlineRate.GuardianOnline(ctx)
  })

  app.beforeStart(async () => {
    // // 应用会等待这个函数执行完成才启动
    // app.cities = await app.curl('http://example.com/city.json', {
    //     method: 'GET',
    //     dataType: 'json',
    // });
    // // 也可以通过以下方式来调用 Service
    // const ctx = app.createAnonymousContext();
    // // // app.cities = await ctx.service.cities.load();

    // // 守护程序 维护设备在线率表
    // setTimeout(async () => {
    //   await ctx.helper.deviceOnlineRate.GuardianOnline(ctx)
    //   await ctx.helper.recordRate.GuardianOnline(ctx)
    // }, 50)
  })
}
