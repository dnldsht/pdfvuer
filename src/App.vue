<template>
  <div id="app">
    <div class="buttons">
      <button @click="page--">-</button>
      {{page}}/{{pages}}
      <button @click="page++">+</button>
      <input class="ml-auto" type="text" placeholder="Cerca" />
      <button @click="test">search</button>
    </div>

    <Pdf
      @numpages="pages = $event"
      :page.sync="page"
      ref="pdf"
      src="https://backend.nuvolar.it/domains/71/contents/21727/pdf"
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
  }),
  methods: {
    test() {
      const a = this.$refs.pdf.pdfFindController.executeCommand("find", {
        query: "This section provides an overview of our system",
        phraseSearch: true,
      });
      console.log(a);
    },
  },
};
</script>


