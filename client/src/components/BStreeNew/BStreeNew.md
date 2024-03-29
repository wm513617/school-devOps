### BStreeNew 说明文档

该 tree 以`element-ui`的 tree 为基础，大量使用 element-ui 相关组件

---

> 该组件`树`封在`BStreeNewBox`分为 lazy 树、搜索两个部分
> 内置增、删、改、移动、刷新功能按钮组
> 配有收藏、预览、全部预览、复选框、单击、双击、拖拽等接口
> 配有 2 种搜索模式:
>
> 1. 后端搜索（查询数据库）
> 2. 前端搜索（查询已加载的数据）
>    BStreeNewBox

```
  <TreeBox
    ref="treebox"
    :searchToggle="false"                           -------->   是否使用搜索
    :searchType="0"                                 -------->   搜索类型
    :resourceToggle="true"                          -------->   是否加载资源
    :equipmentToggle="true"                         -------->   是否加载设备
    :btnGroup="false"                               -------->   是否显示按钮组
    :checkBox="false"                               -------->   是否显示复选框
    :iconToggle="true"                              -------->   是否显示树右侧的小图标
    :iconRight="iconRight"                          -------->   显示单独右侧小图
    :orgType="0"                                    -------->   机构类型
    :equType="[0]"                                  -------->   设备类型
    :resType="[0]"                                  -------->   资源类型
    :searchVal="searchVal"                          -------->   组件外原有的搜索框的输入值
    :playingIds="playingIds"                        -------->   视频播放开流成功返回的数组
    :scroll="true"                                  -------->   是否需要树有滚动效果(css样式滚动)
    :mapSpecial="mapSpecial"                        -------->   地图专用
    :newField="&mapId=4545"                         -------->   新增向后端发送的查询字段
    :delIcon="true"                                 -------->   是否显示树(资源)右侧的删除小图标(不与收藏和开启预览共存)
    @delData="delData"                              -------->   点击删除按钮返回data
    @clickData="handleNode"                         -------->   单击返回的节点data
    @favData="collectionClick"                      -------->   收藏项的data
    @previewData="openPreviewClick"                 -------->   资源的data
    @previewAllData="openAllPreviewClick"           -------->   设备/机构的子级的所有资源的data
    @checksData="(val)=>{talk('checksData', val)}"  -------->   复选框的data
    @dbclickData="dblClick"                         -------->   双击项的data
    @dragData="(val)=>{talk('dragData', val)}"      -------->   拖拽项的data
    @on-expand="expand"                             -------->   节点展开/闭合时触发，无数据
    :currentNodeKey="该node 节点的_id"               -------->   双向数据绑定选中特定的一行   _id
    :delFun="delFun"                                -------->   删除节点的筛选方法（可选）
  ></TreeBox>
```

> 抛入值
> |属性|名称|类型|默认值|可选值|备注|
> |:-|:-:|:-:|:-:|:-:|:-|
> |`searchToggle`|是否使用搜索|`Boolean`|`true`|(`true`,`false`)|-|
> |`searchType`|搜索类型|`Number`|`0`|`0`, `1`|`0`：查询数据库<br>`1`：查询现有树|
> |`resourceToggle`|是否加载资源|`Boolean`|`false`|(`true`,`false`)|-|
> |`equipmentToggle`|是否加载设备|`Boolean`|`false`|(`true`,`false`)|-|
> |`btnGroup`|是否显示按钮组|`Boolean`|`false`|(`true`,`false`)|-|
> |`checkBox`|是否显示复选框|`Boolean`|`false`|(`true`,`false`)|-|
> |`iconToggle`|是否显示树右侧的小图标|`Boolean`|`true`|(`true`,`false`)|-|
> |`scroll`|是否需要树有滚动效果|`Boolean`|`true`|(`true`,`false`)|-|
> |`mapSpecial`|地图专用|`String`|`''`|(`2D`,`3D`)|图标是否显示为绿色|
> |`orgType`|机构类型|`Number`|`0`|(`0`, `1`,`2`, `3`, `4`, `5`)|`0`：视频设备<br>`1`：报警主机<br>`2`：门禁设备<br>`3`：IP 对讲<br>`4`：巡更设备<br>`5`：解码器|
> |`equType`|设备类型|`Array`|`[0]`|(`0`, `1`,`2`, `3`, `4`, `5`)||
> |`resType`|资源类型|`Array`|`[0]`|(`0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `15`)|`0`：视频通道<br>`1`：视频报警输入<br>`2`：视频报警输出通道<br>`3`：对讲通道<br>`4`：门禁通道<br>`5`：解码通道<br>`6`：音频通道<br>`7`：解码报警输入<br>`8`：解码报警输出<br>`9`：报警主机报警输入<br>`10`：报警主机报警输出<br>`11`：消防输入防区<br>`12`：消防输出防区<br>`15`：拼接输入通道|
> |`searchVal`|外部搜索栏输入的值|`String`|`''`|-|-|
> |`playingIds`|视频播放开流成功返回的数组|`Array`|`[]`|-|-|
> |`newField`|新增向后端发送的查询字段|`String`|`''`|-|格式为`&mapId=123456`<br>如此反复<br>如：`&mapId=123456&tid=5566&cid=7788`|
> |`delIcon`|是否显示树`(资源)`右侧的`删除`小图标|`Boolean`|`false`|(`true`,`false`)|不与右侧小窗口共存，仅在`资源`的已添加上显示|
> |`iconRight`|单独显示`(资源)`右侧小图标|`Array`|`['collect', 'preview']`|(`collect`,`preview`)|只有在`iconToggle`为`true`时启用，`Array`中包含的`字段`将显示|
> |`delFun`|节点删除判断函数|`Function`|`{ state: true }`|(`{state: true, msg: ''}`,`{state: false, msg: ''}`)|在机构树`删除节点`需要作出额外过滤时，可使用；<br>返回为`对象`,`state`为`Boolean`值，`true`时，删除；`false`时，则弹出提示信息<br>若无`state`或`state`不为`Boolean`值，则报`参数错误`；<br>若`state`为`false`且无`msg`则报`未知错误`；|
>
> 抛出值
> |事件|名称|备注|
> |:-|:-:|-:|
> |`clickData`|单击返回的节点 data|Object|
> |`dbclickData`|双击项的 data|Object|
> |`favData`|收藏项的 data|Object|
> |`delData`|删除项的 data|Object|
> |`previewData`|预览项的 data|Object|
> |`previewAllData`|设备/机构的子级的所有资源的 data|Object|
> |`checksData`|复选框的 data|Array|
> |`dragData`|拖拽项的 data|Object|
> |`on-expand`|节点展开/闭合时触发，无数据|-|
> |`getOrgData`|自定义修改弹窗获取的 data|Object|
>
> 调用组件函数
>
> ```
> // 刷新(手动)
> this.$refs.treebox.$refs.treeLazy.refresh()
> // 刷新(自动)
> this.$refs.treebox.builtInRefreshs()
> PS:表示修改资源后，定点刷新该资源父节点下的所有数据
> // 查询（数据库）
> this.$refs.treeSear.searchRes(data)
> // 获取树的复选框数据
> // this.$refs.treebox.$refs.treeLazy.$refs.treeNewLazy.getCheckedNodes()
> this.$refs.treebox.getCheckedNodes()
> // 设置树的复选框数据
> this.$refs.treebox.setCheckedKeys(val)
> // val -> type: Array
> // 获取搜索的复选框的数据
> this.$refs.treebox.$refs.treeSear.ischeck
> // 自定义添加弹窗
> 1.确定
> this.$refs.treebox.save({code:0, name:''})
> code: {
>   type: Number
> }
> name: {
>   type:String
> }
> 2.取消
> this.$refs.treebox.orgCancel()
> ```

---

> `根`返回的数据 格式 —— data

```
  {
    children: [{_id: 1}]
    isroot: true
    name: "西安分公司"
    order: 0
    pinyin: "xi an fen gong si"
    tierType: "org"
    _id: "5b75146c5697ed6a9ee46b36"
  }
```

> `机构`返回的数据 格式 —— data

```
  {
    children: [{_id: 1}]
    isroot: false
    name: "北京_海淀区"
    order: 0
    pid: "5b75146c5697ed6a9ee46b36"
    pinyin: "bei jing _ hai dian qu"
    tierType: "org"
    _id: "5c203b9bce84ca3804d74334"
  }
```

> `设备`返回的数据 格式 —— data

```
  {
    OnlineRateStatus: 3
    adapterIp: ""
    adapterPort: null
    bigtype: 0
    connMode: "active"
    cport: 8000
    createdAt: "2019-01-05T08:15:06.472Z"
    decodecount: 0
    defenseicount: 0
    defenseocount: 0
    deviceStatus: 1
    devicealarm: false
    dport: 3720
    encodingcount: null
    entranceguardcount: 0
    equip: true
    intelligent: 0
    intelligentalarm: false
    intercomcount: 0
    ip: "192.168.14.128"
    ipcount: 1
    mainStream: ""
    manufacturer: "bstar"
    monitorypointalarm: false
    name: "infulxdb测试设备1"
    oid: "5b75146c5697ed6a9ee46b36"
    password: "123456"
    protocol: "tcp"
    series: "bsr"
    status: false
    subStream: ""
    tierType: "equ"
    type: "ipc"
    updatedAt: "2019-04-17T02:31:53.088Z"
    username: "admin"
    videoinputcount: 0
    voicecount: 0
    __v: 0
    _id: "5c30678a20169d603e14cfdc"
  }
```

> `资源`返回的数据 格式 —— data

```
  {
    chan: 1
    eid: {
      cport: 3721
      deviceStatus: 1
      dport: 3720
      ip: "192.168.20.40"
      manufacturer: "bstar"
      name: "20.40"
      type: "ipc"
      _id: "5c26d592cc13923fd8aa59b9"
    }
    gbDevId: "1320362849"
    gbParentDevId: null
    monitortype: 0
    name: "20.40_视频通道_通道1"
    pinyin: "20.40_ shi pin tong dao _ tong dao 1"
    status: 1
    stream: "main"
    tierType: "res"
    _id: "5c26d593cc13923fd8aa59e0"
  }
```

> `添加弹窗`示例——template
>
> - `v-slot:dialog="orgName"`
>   > `v-slot` 为 vue3.0 指令 <br> >> `dialog` 为具名插槽
>   > `orgName` 为组件插槽传参，可自定义 <br>
> - `orgName.visible` 弹窗的显隐性 Boolean
> - `orgName.orgName` 上级机构的名称 String
> - `orgName.title` 弹窗的 title 名称
>   > `getOrgData` 为自定义插槽的后端返回值

```
  vue3.0版
  <BStreeNewBox ref="treebox" :iconToggle="false" :searchToggle="true" :searchType="0" :equipmentToggle="false" :resourceToggle="false" :btnGroup="true" :orgType="0" :resType="[0]" @clickData="getDevicesDataClick" @getOrgData="(data)=>{formData = { code: data.code, name: data.name }}">
    <template v-slot:dialog="orgName">
      <el-dialog class="dialog" :visible="orgName.visible" :title="orgName.title" @close="orgCancel">
        <el-form :model="formData" label-position="left" label-width="100px" ref="orgFormData" :rules="orgFormRole">
          <el-fotmitem label="上级机构">
            <div class="ivu-form-item-content-span">{{orgName.orgName}}</div>
          </el-fotmitem>
          <el-fotmitem label="机构编号" prop="code">
            <el-input v-model="formData.code" placeholder="范围：0-65535" :maxlength="5" size="small"></el-input>
          </el-fotmitem>
          <el-fotmitem label="机构名称" prop="name">
            <el-input v-model="formData.name" :maxlength="64" size="small"></el-input>
          </el-fotmitem>
        </el-form>
        <div slot="footer">
          <Button type="ghost" @click="orgCancel" size="small">取消</Button>
          <Button type="primary" @click="orgSave" size="small">确认</Button>
        </div>
      </el-dialog>
    </template>
  </BStreeNewBox>
```

```
  vue2.6版
  <TreeBox ref="treebox" :iconToggle="false" :searchToggle="true" :searchType="0" :equipmentToggle="false" :resourceToggle="false" :btnGroup="true" :orgType="9" :resType="[0]" @clickData="handleNode" @getOrgData="(data)=>{formData = { code: data.code, name: data.name }}">
    <template slot="dialog" slot-scope="orgName">
      <el-dialog class="dialog" width="400px" :visible="orgName.visible" :title="orgName.title" @close="orgCancel">
        <el-form :model="formData" label-position="left" label-width="100px" ref="orgFormData" :rules="orgFormRole">
          <el-fotmitem label="上级机构">
            <div class="ivu-form-item-content-span">{{orgName.orgName}}</div>
          </el-fotmitem>
          <el-fotmitem label="机构编号" prop="code">
            <el-input v-model="formData.code" placeholder="范围：0-65535" :maxlength="5" size="small"></el-input>
          </el-fotmitem>
          <el-fotmitem label="机构名称" prop="name">
            <el-input v-model="formData.name" :maxlength="64" size="small"></el-input>
          </el-fotmitem>
        </el-form>
        <div slot="footer">
          <Button type="ghost" @click="orgCancel" size="small">取消</Button>
          <Button type="primary" @click="orgSave" size="small">确认</Button>
        </div>
      </el-dialog>
    </template>
  </BStreeNewBox>
```

> `添加弹窗`示例——javascript

```
  data() {
    const verifyName = (rule, value, callback) => {
      let nativecode = value.split('')
      let len = 0
      for (let i = 0; i < nativecode.length; i++) {
        let code = Number(nativecode[i].charCodeAt(0))
        if (code > 127) {
          len += 2
        } else {
          len++
        }
      }
      if (len > 64) {
        return callback(new Error('不能超过64位字符'))
      } else {
        callback()
      }
    }
    const verifyNumber = (rule, value, callback) => {
      let r = /(^[1-9]([0-9]*)$|^[0-9]$)/
      if (value === '') {
        return callback(new Error('不可以为空'))
      }
      if (r.test(value)) {
        if (Number(value) > 65535) {
          return callback(new Error('超过最大值'))
        } else {
          callback()
        }
      } else {
        return callback(new Error('请输入有效数字'))
      }
    }
    const noSpace = (rule, value, callback) => {
      let r = /\s+/g
      if (r.test(value)) {
        return callback(new Error('不可以输入空格！'))
      } else {
        callback()
      }
    }
    return {
      formData: {
        code: '', // 机构编号
        name: '' // 机构名称
      },
      orgFormRole: { // 验证规则
        name: [
          { required: true, message: '机构名称不能为空', trigger: 'change' },
          { validator: noSpace, trigger: 'change' },
          { validator: verifyName, trigger: 'change' }
        ],
        code: [{ required: true, validator: verifyNumber, trigger: 'change' }]
      },
    }
  },
  methods: {
    orgCancel() { // 取消
      this.$refs.treebox.orgCancel() // 关闭弹窗
      this.$refs.orgFormData.resetFields() // 清空form表单内容
    },
    orgSave() { // 确认
      this.$refs.orgFormData.validate(valid => { // form表单验证成功
        if (valid) {
          this.$refs.treebox.save(this.formData) // 调接口
        }
      })
    }
  }
```
<br>
> `delFun`——机构树自定义删除方法示例
```
  <TreeBox :delFun="delFun" ....

  async delFun(val) {
    let _v
    let url = '/onetree?'
    if (val.tierType === 'equ') { // 如果点击的是设备
      url += `eid=${val._id}`
    } else if (val.tierType === 'org') { // 如果点击的是机构
      url += `oid=${val._id}`
    }
    url += `&resource=true&restype=0` // 机构-资源
    await this.$http.get(url)
      .then(res => { // 将获得该 机构-资源 树，返回该结构下的所有资源
        ...
        ...
        _v = true
      })
      if (_v) {
        return { state: true}
      } else {
        return { state: false, msg: '万物皆虚，万事皆允' }
      }
  }
```
> `val` 参数解释
> 后端文档参见：`server\api\onetree\onetree.md`
> 数据结构参见：本文档`根`返回的数据 格式 —— data；`机构`返回的数据 格式 —— data；`设备`返回的数据 格式 —— data；`资源`返回的数据 格式 —— data
>


