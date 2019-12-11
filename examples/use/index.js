import Vue from 'vue';
import Vuex from 'vuex';
import AVueCropper from '@/avue-cropper';

import App from './App.vue';

Vue.use(Vuex);
Vue.use(AVueCropper);

new Vue({
  el: '#app',
  store: new Vuex.Store(),
  render: createElement => createElement(App)
});
