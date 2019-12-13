import Vue from "vue";
import App from "./App.vue";

import AVueCropper from "avue-cropper";

Vue.config.productionTip = false;

Vue.use(AVueCropper);

new Vue({
  render: h => h(App)
}).$mount("#app");
