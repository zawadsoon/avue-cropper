import AVueCropperComponent from './avue-cropper-component.vue';

function devMode() {
  return process.env.NODE_ENV !== 'production';
}

export default {
  install(Vue) {
    Vue.component('AVueCropper', AVueCropperComponent);

    if (devMode()) {
      console.info('[avue-cropper] is plugged in.');
    }
  }
};
