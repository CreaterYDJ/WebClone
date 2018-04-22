import Vue from "vue";


import App from "./App";
import router from "./router";

// eslint-disable-next-line no-undef
if (!process.env.IS_WEB) Vue.use(require("vue-electron"));

Vue.config.productionTip = false;

import ElementUI from "element-ui";
Vue.use(ElementUI);
import "element-ui/lib/theme-chalk/index.css";


import TreeView from "vue-json-tree-view";
Vue.use(TreeView);


/* eslint-disable no-new */
new Vue({
    components: {App},
    router,
    template: "<App/>",
}).$mount("#app");
