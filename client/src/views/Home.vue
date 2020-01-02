<template>
  <div class="home">
    <Button @click="$pubsub.publish('error', { info: 'home err' })">错误</Button>
    <Button @click="$pubsub.publish('authSuccess')">登录</Button>
    <Button @click="$pubsub.publish('authFail')">注销</Button>
  </div>
</template>

<script>
export default {
}
</script>

<style lang="less">
</style>
