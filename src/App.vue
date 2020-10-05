<template>
  <div id="app" ref="app">
    <div class="buttons">
      <button @click="page--">-</button>
      {{ page }}/{{ pages }}
      <button @click="page++">+</button>
      <input class="ml-auto" type="text" placeholder="Cerca" />
      <button @click="test">search</button>
      <button @click="toggleFullScreen">
        {{ fullScreen ? "no full" : "full" }}
      </button>

      <select v-model="scale">
        <option value="page-width">page-width</option>
        <option :value="0.3">0.3</option>
        <option :value="1.3">1.3</option>
      </select>

      <button @click="zoomOut">zoomOut</button>

      <button @click="zoomIn">zoomIn</button>
    </div>

    <Pdf
      ref="pdf"
      :page.sync="page"
      :scale="scale"
      src="https://backend.nuvolar.it/domains/71/contents/21727/pdf"
      @numpages="pages = $event"
    />
  </div>
</template>

<style >
.cont-pdf {
  position: relative;
}
.buttons {
  width: 100%;
  display: flex;
  position: sticky;

  top: 0;

  z-index: 200;
}
.pdfViewer .page {
  margin: 0;
  border: none;
}
</style>
<script>
import Pdf from "./Pdfvuer";

// import Pdf from "vue-pdf";

export default {
  name: "App",
  components: {
    Pdf,
  },
  data: () => ({
    page: 1,
    pages: null,
    fullScreen: false,
    scale: "page-width",
  }),
  methods: {
    zoomOut() {
      this.$refs.pdf.zoomOut(1);
    },
    zoomIn() {
      this.$refs.pdf.zoomIn(1);
    },
    test() {
      const a = this.$refs.pdf.pdfFindController.executeCommand("find", {
        query: "This section provides an overview of our system",
        phraseSearch: true,
      });
      console.log(a);
    },
    toggleFullScreen() {
      if (this.fullScreen) {
        document.exitFullscreen();
      } else {
        this.$refs.app.requestFullscreen();
      }
      this.fullScreen = !this.fullScreen;
    },
  },
};
</script>


