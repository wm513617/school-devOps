export const rtspUrl = (data, ip) => {
  let url = ''
  if (data.rtsp[data.stream]) {
    url = data.rtsp[data.stream]
  } else {
    url = data.rtsp.sub
  }
  return url.replace(new RegExp('ip:port'), ip)
}
