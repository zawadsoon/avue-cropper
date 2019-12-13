import Vue from 'vue';
import AVueCropper from '@/avue-cropper';

import App from './App.vue';

Vue.use(AVueCropper);

new Vue({
  el: '#app',
  render: createElement => createElement(App)
});
