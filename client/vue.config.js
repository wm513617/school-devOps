module.exports = {
  configureWebpack: {
    devtool: 'source-map'
  },
  devServer: {
    port: 9988,
    proxy: {
      '/ops': {
        target: ' http://192.168.20.7:9999',
        ws: true,
        changeOrigin: true
      },
      '/onetree': {
        target: ' http://localhost:9999',
        ws: true,
        changeOrigin: true
      }
    }
  }
}
