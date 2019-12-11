<template>
  <div
    class="avue-cropper-container"
    :style="containerStyle"
    @mousedown="dragStart"
    @touchstart="dragStart"
    @wheel="onScroll"
  >
    <div class="avue-cropper-viewport" :class="{ rounded }" :style="viewportStyle"></div>
    <template v-if="dataUrl">
      <img :src="dataUrl" :style="imageStyle" @load="onImgLoad" />
    </template>
  </div>
</template>

<script>
export default {
  props: {
    dataUrl: {
      type: String,
      default: null
    },
    emitResult: {
      type: Boolean,
      default: true
    },
    rounded: {
      type: Boolean,
      default: true
    },
    viewport: {
      type: Object,
      default: () => ({ x: 200, y: 200 })
    },
    boundary: {
      type: Object,
      default: () => ({ x: 300, y: 300 })
    }
  },
  data() {
    return {
      /**
       * @type {HTMLImageElement | null}
       */
      image: null,
      /**
       * @type {CanvasRenderingContext2D | null}
       */
      ctx: null,
      scale: 1,
      dragging: false,
      imageOffset: { x: 0, y: 0 },
      delta: { x: 0, y: 0 },
      scrollEndTimeoutId: null,
      minScale: 1,
      prevTouch: null
    };
  },
  computed: {
    containerStyle() {
      return {
        width: this.boundary.x + 'px',
        height: this.boundary.y + 'px'
      };
    },

    viewportStyle() {
      return {
        width: this.viewport.x + 'px',
        height: this.viewport.y + 'px'
      };
    },

    imageStyle() {
      return {
        top: `${this.imageOffset.y}px`,
        left: `${this.imageOffset.x}px`
      };
    }
  },
  watch: {
    dataUrl(val) {
      if (val === null) {
        this.clear();
      }
    }
  },
  mounted() {
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.dragEnd);
    window.addEventListener('touchmove', this.onTouchMove);
    window.addEventListener('touchcancel', this.dragEnd);
    window.addEventListener('touchend', this.dragEnd);

    let canvas = document.createElement('canvas');

    this.ctx = canvas.getContext('2d');
  },
  beforeDestroy() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.dragEnd);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchcancel', this.dragEnd);
    window.removeEventListener('touchend', this.dragEnd);

    this.ctx = null;
  },
  methods: {
    clear() {
      this.image = null;
      this.imageOffset.x = 0;
      this.imageOffset.y = 0;
      this.scale = 1;
    },

    transformImage() {
      if (this.image !== null) {
        let x = this.delta.x * this.scale;
        let y = this.delta.y * this.scale;

        this.image.style.transform = `translate(${x}px, ${y}px) scale(${this.scale})`;
      }
    },

    cropImage() {
      return new Promise(resolve => {
        if (this.image !== null && this.ctx !== null) {
          const { width, height } = this.image;

          let sWidth = this.viewport.x / this.scale;
          let sHeight = this.viewport.y / this.scale;
          let sx = (width - sWidth) / 2 - this.delta.x;
          let sy = (height - sHeight) / 2 - this.delta.y;
          let dx = 0;
          let dy = 0;
          let dWidth = this.viewport.x / this.scale;
          let dHeight = this.viewport.y / this.scale;

          this.ctx.canvas.width = dWidth;
          this.ctx.canvas.height = dHeight;

          this.ctx.drawImage(this.image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

          this.ctx.canvas.toBlob(resolve, 'img/jpeg', 1);
        }
      });
    },

    calculateLimits() {
      if (this.image !== null) {
        const { width, height } = this.image;

        // Caluclete offset to set image in center of boundary box
        this.imageOffset.x = (this.boundary.x - width) / 2;
        this.imageOffset.y = (this.boundary.y - height) / 2;
      }
    },

    onImgLoad(event) {
      this.image = event.target;

      const { width, height } = this.image;

      // Set origin to center of the image
      this.image.style.transformOrigin = `${width / 2}px ${height / 2}px`;

      this.delta.x = 0;
      this.delta.y = 0;

      // Get scale along shorter edge
      this.scale = width < height ? this.boundary.x / width : this.boundary.y / height;

      this.minScale =
        this.viewport.x > this.viewport.y ? this.viewport.x / width : this.viewport.y / height;

      this.calculateLimits();

      this.transformImage();

      this.emitInput();
    },

    onScroll(event) {
      event.preventDefault();

      if (this.scrollEndTimeoutId !== null) {
        clearTimeout(this.scrollEndTimeoutId);

        this.scrollEndTimeoutId = null;
      }

      this.scrollEndTimeoutId = setTimeout(() => {
        this.emitInput();

        this.scrollEndTimeoutId = null;
      }, 250);

      if (this.image !== null) {
        let nextScale = this.scale + Math.sign(event.deltaY) / 10;

        this.scale = nextScale < this.minScale ? this.minScale : nextScale;
      }

      this.validateBounding();

      this.transformImage();
    },

    emitInput() {
      if (this.emitResult) {
        this.$emit('input', this.cropImage());
      }
    },

    validateBounding() {
      if (this.image !== null) {
        let maxBoundingX = this.image.width / 2 - this.viewport.x / 2 / this.scale;

        if (this.delta.x < -maxBoundingX) {
          this.delta.x = -maxBoundingX;
        }

        if (this.delta.x > maxBoundingX) {
          this.delta.x = maxBoundingX;
        }

        let maxBoundingY = this.image.height / 2 - this.viewport.y / 2 / this.scale;

        if (this.delta.y < -maxBoundingY) {
          this.delta.y = -maxBoundingY;
        }

        if (this.delta.y > maxBoundingY) {
          this.delta.y = maxBoundingY;
        }
      }
    },

    dragEnd() {
      this.dragging = false;
      this.prevTouch = null;

      this.emitInput();
    },

    dragStart(event) {
      this.dragging = true;

      event.preventDefault();
    },

    onTouchMove(event) {
      if (this.dragging) {
        if (event.touches.length == 1) {
          let touch = event.touches[0];

          if (this.prevTouch === null) {
            this.prevTouch = touch;
          } else {
            let movementX = this.prevTouch.screenX - touch.screenX;
            let movementY = this.prevTouch.screenY - touch.screenY;

            this.prevTouch = touch;

            this.delta.x -= movementX / this.scale;
            this.delta.y -= movementY / this.scale;

            this.validateBounding();

            this.transformImage();
          }
        }
      }
    },

    onMouseMove(event) {
      if (this.dragging) {
        this.delta.x += event.movementX / this.scale;
        this.delta.y += event.movementY / this.scale;

        this.validateBounding();

        this.transformImage();
      }
    }
  }
};
</script>

<style scoped>
.avue-cropper-container {
  position: relative;
  overflow: hidden;
  z-index: 2;
}

.avue-cropper-container img {
  z-index: 1;
  position: absolute;
}

.avue-cropper-viewport {
  z-index: 3;
  border: solid #f4f4f4 2px;
  margin: auto;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  box-shadow: 0 0 2000px 2000px rgba(0, 0, 0, 0.5);
}
.avue-cropper-viewport.rounded {
  border-radius: 50%;
}
</style>