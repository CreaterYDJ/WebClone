<template>
    <div>
        <!--TODO: 项目管理使用Chrome Tab Bar 自定义各平台关闭按钮-->
        <!--TODO: 分项目管理 为项目启动静态资源服务以便预览-->
        <div>
            <div class="header">
                <el-row>
                    <TitleBar>
                    </TitleBar>
                </el-row>
                <el-row>
                    <el-input placeholder="请输入内容" v-model="input.url">
                        <el-button slot="append" icon="el-icon-circle-check-outline" @click="handleGoto"></el-button>
                    </el-input>
                    <div style="padding: 8px">
                        <el-row>
                            是否拦截
                            <el-switch v-model="isCapture" @change="toggleCapture">
                            </el-switch>
                        </el-row>
                    </div>
                </el-row>
            </div>

        </div>

        <div class="main">

            <div>

                <template>
                    <el-table :data="requestList"
                              style="width: 100%"
                              height="500">
                        <el-table-column type="expand">
                            <template slot-scope="scope">
                                <tree-view :data="scope.row" :options="{maxDepth: 3}">
                                </tree-view>
                            </template>
                        </el-table-column>
                        <el-table-column label="请求ID" prop="id" width="100">
                        </el-table-column>

                        <el-table-column label="resourceType" prop="resourceType" width="100">
                        </el-table-column>

                        <el-table-column label="URL" width="500">
                            <template slot-scope="scope">

                                <p>From: {{scope.row.url}}</p>
                                <!--TODO: 点击本地路径打开本地文件所在目录-->
                                <p>To: <a href="javascript:void(0)" @click="handleReveal(toLocalPath(scope.row.url))">{{toLocalPath(scope.row.url)}}</a></p>
                            </template>
                        </el-table-column>
                        <el-table-column
                                prop="cacheStatus"
                                label="状态"
                                width="100">
                            <template slot-scope="scope">
                                <el-tag :type="cacheStatus[scope.row.id].type">
                                    {{cacheStatus[scope.row.id].text}}
                                </el-tag>
                            </template>
                        </el-table-column>

                    </el-table>
                </template>
            </div>

        </div>


    </div>
</template>

<script>
    const Vue = require("vue").default;
    const utils = require("../../utils");
    const {ipcRenderer} = require('electron');
    const remote = require('electron').remote;

    const TitleBar = require('./components/TitleBar').default;

    export default {
        components: {TitleBar},
        data: function () {
            return {
                isCapture: true,
                requestList: [],
                input: {
                    url: "http://baidu.com"
                },
                isDev: process.env.NODE_ENV === 'development',
                cacheStatus: []
            };
        },
        computed: {},
        watch: {},
        methods: {
            toLocalPath: utils.to_local_path,
            handleGoto: function () {
                ipcRenderer.send('goto-url', this.input.url)
            },
            toggleCapture: function (v) {

            },
            handleReveal:function (filename) {
                console.log(filename);
            }
        },
        mounted: function () {
            ipcRenderer.on('add-request', (event, arg) => {

                if (this.isCapture) {
                    try {
                        let remoteURL = arg.url;
                        let localPath = utils.to_local_path(remoteURL);
                        let id = arg.id;
                        this.requestList.push(arg);
                        Vue.set(this.cacheStatus, id, {type: "", text: ""});

                        // TODO: downloadFile 请求带上header
                        // TODO: 能不能直接取出响应内容

                        utils.downloadFile(remoteURL, localPath).then(() => {
                            Vue.set(this.cacheStatus, id, {type: "success", text: "下载成功"});
                            console.log(remoteURL, id, "下载成功")
                        }).catch(err => {
                            Vue.set(this.cacheStatus, id, {type: "danger", text: "下载失败"});
                        });

                    } catch (e) {
                        // console.error(e)
                    }
                }

            });


        }
    }
</script>

<style scoped>
    .header {

    }

    .main {

    }

    .footer {

    }


</style>
