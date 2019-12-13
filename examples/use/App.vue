<template>
  <div>
    <h1>Select image</h1>
    <input type="file" accept="iamge/*" @change="onChange" />
    <h2>Crop Image</h2>
    <div class="wrapper" v-if="dataUrl">
      <a-vue-cropper :data-url="dataUrl" @input="onInput" />
    </div>
    <strong v-else>Please select image</strong>
    <img class="preview" :src="preview" v-if="preview" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      dataUrl: null,
      preview: null
    };
  },
  methods: {
    /**
     * Handle input change
     */
    onChange(event) {
      if (event.target !== null) {
        this.readFile(event.target.files[0]);
      }
    },
    /**
     * Handle new cropped image
     *
     * @param {Promise<Blob>}
     */
    onInput(promise) {
      promise.then(blob => {
        this.preview = URL.createObjectURL(blob);
      });
    },
    /**
     * Transform file object into data url
     *
     * @param {File} file
     */
    readFile(file) {
      let fileReader = new FileReader();

      fileReader.addEventListener('load', event => {
        if (event.target !== null) {
          this.dataUrl = event.target.result;
        }
      });

      fileReader.readAsDataURL(file);
    }
  }
};
</script>

<style scoped>
.wrapper {
  background: #212121;
  display: inline-block;
}
.preview {
  width: 300px;
  height: auto;
}
</style>
