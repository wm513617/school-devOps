module.exports = agent => {
  // 录像检测维护
  const recordProcessPool = new Set() // 录像检测线程池
  agent.messenger.on('egg-ready', () => {
    agent.messenger.sendRandom('recordSync', true)
  })
  agent.messenger.on('record-Add', data => {
    recordProcessPool.add(data)
  })
  agent.messenger.on('record-Sbu', data => {
    sbuRecord(data)
  })

  function sbuRecord(data) {
    if (recordProcessPool.size >= 1) {
      recordProcessPool.delete(data)
      if (recordProcessPool.size === 0) {
        agent.messenger.sendRandom('recordSync', true)
      }
    }
  }

  // 录像检测维护
  const deviceProcessPool = new Set() // 录像检测线程池
  agent.messenger.on('egg-ready', () => {
    agent.messenger.sendRandom('deviceSync', true)
  })
  agent.messenger.on('device-Add', data => {
    deviceProcessPool.add(data)
  })
  agent.messenger.on('device-Sbu', data => {
    sbudevice(data)
  })

  function sbudevice(data) {
    if (deviceProcessPool.size >= 1) {
      deviceProcessPool.delete(data)
      if (deviceProcessPool.size === 0) {
        agent.messenger.sendRandom('deviceSync', true)
      }
    }
  }
}
