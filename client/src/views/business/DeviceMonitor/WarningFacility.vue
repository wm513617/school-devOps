<template>
  <div class="car-list">
    <div class="table-box">
      <Table size="small" :data="videoData" style="width: 100%" :height="tableHeight" v-loading="loading" @selection-change="changeChecked" highlight-current-row>
        <TableColumn type="selection" width="55"></TableColumn>
        <TableColumn label="序号" type="index" min-width="100" align="center"></TableColumn>
        <TableColumn label="报警设备名称" prop="name" min-width="300" show-overflow-tooltip></TableColumn>
        <TableColumn label="所属机构" prop="oid.name" min-width="200"></TableColumn>
        <TableColumn label="设备IP" prop="ip" min-width="150" align="center"></TableColumn>
        <TableColumn label="在线状态" min-width="100" align="center">
          <template slot-scope="scope">
            <span v-if="!scope.row.status">-</span>
            <div v-else :class="scope.row.status==='online'?'online-color':'offline-color'"></div>
          </template>
        </TableColumn>
        <TableColumn label="在线率" min-width="100" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.rate">{{scope.row.rate}}%</span>
            <span v-else>0%</span>
          </template>
        </TableColumn>
        <TableColumn label="厂商" prop="manufacturer" min-width="200" align="center"></TableColumn>
        <TableColumn label="设备型号" prop="type" min-width="100" align="center"></TableColumn>
        <TableColumn label="离线时长" min-width="150" align="center">
          <template slot-scope="scope">
            <span>{{scope.row.offTime}}</span>
          </template>
        </TableColumn>
        <TableColumn min-width="100" label="详情" align="center">
          <template slot-scope="scope">
            <i class="el-icon-document" style="cursor: pointer" @click="tableOpenModal(scope)"></i>
          </template>
        </TableColumn>
      </Table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WarningFacility',
  props: {
    videoData: {
      type: Array
    },
    onlineColor: {
      type: String,
      default: '#4699f9'
    },
    offlineColor: {
      type: String,
      default: '#ddd'
    },
    basicColor: {
      type: String,
      default: '#0f2343'
    },
    tableHeight: {
      type: Number,
      default: 500
    },
    loading: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
    }
  },
  computed: {},
  created() { },
  methods: {
    tableOpenModal(scope) {
      this.$emit('openModal', scope.row)
      console.log(scope)
    },
    changeChecked(val) {
      this.$emit('changeChecked', val)
    }
  }
}
</script>

<style scoped>
.car-list {
  height: 100%;
}
.online-color,
.offline-color {
  height: 15px;
  width: 15px;
  border-radius: 50%;
  margin: auto auto;
}
.online-color {
  background: #62c370;
}
.offline-color {
  background: #c42847;
}
</style>
