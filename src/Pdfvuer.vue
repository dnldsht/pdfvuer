<template>
  <div>
    <slot v-if="loading" name="loading" />
    <div id="viewerContainer" ref="container">
      <div id="viewer" class="pdfViewer" />
      <!-- <resizeSensor :initial="true" @resize="resizeScale" /> -->
    </div>
  </div>
</template>
<style >
#viewerContainer {
  overflow: auto;
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>

<script>
"use strict";

import "pdfjs-dist/web/pdf_viewer.css";
import pdfjsLib from "pdfjs-dist/webpack.js";
import {
  DefaultAnnotationLayerFactory,
  DefaultTextLayerFactory,
  PDFLinkService,
  PDFPageView,
  PDFViewer,
  EventBus,
  PDFFindController,
} from "pdfjs-dist/web/pdf_viewer.js";
import resizeSensor from "vue-resize-sensor";

function isPDFDocumentLoadingTask(obj) {
  return (
    typeof obj === "object" &&
    obj !== null &&
    obj.__PDFDocumentLoadingTask === true
  );
}

function createLoadingTask(src, options) {
  var source;
  if (typeof src === "string") source = { url: src };
  else if (typeof src === "object" && src !== null)
    source = Object.assign({}, src);
  else throw new TypeError("invalid src type");

  var loadingTask = pdfjsLib.getDocument(source).promise;
  loadingTask.__PDFDocumentLoadingTask = true; // since PDFDocumentLoadingTask is not public

  if (options && options.onPassword)
    loadingTask.onPassword = options.onPassword;

  if (options && options.onProgress)
    loadingTask.onProgress = options.onProgress;

  return loadingTask;
}

export default {
  createLoadingTask: createLoadingTask,
  components: {
    resizeSensor,
  },
  props: {
    src: {
      type: [String, Object, Promise],
      default: "",
    },
    page: {
      type: Number,
      default: 1,
    },
    rotate: {
      type: Number,
      default: 0,
    },
    scale: {
      type: [Number, String],
      default: "page-width",
    },
    resize: {
      type: Boolean,
      default: false,
    },
    annotation: {
      type: Boolean,
      default: false,
    },
    text: {
      type: Boolean,
      default: true,
    },
  },
  data: function () {
    return {
      internalSrc: this.src,

      pdfViewer: null,
      loading: true,
      findController: null,
    };
  },
  watch: {
    page: function (val) {
      this.pdfViewer.currentPageNumber = val;
      this.$emit("update:page", this.pdfViewer.currentPageNumber);
    },
    scale: function (val) {
      // this.drawScaled(val);
    },
    rotate: function (newRotate) {
      // if (this.pdfViewer) {
      //   this.pdfViewer.update(this.scale, newRotate);
      //   this.pdfViewer.draw();
      // }
    },
  },
  mounted: function () {
    var self = this;
    if (!isPDFDocumentLoadingTask(self.internalSrc)) {
      self.internalSrc = createLoadingTask(self.internalSrc);
      self.loading = true;
    }

    var container = this.$refs.container;

    const eventBus = new EventBus();

    // (Optionally) enable hyperlinks within PDF files.
    const pdfLinkService = new PDFLinkService({ eventBus: eventBus });

    self.findController = new PDFFindController({
      eventBus: eventBus,
      linkService: pdfLinkService,
    });

    self.pdfViewer = new PDFViewer({
      container: container,
      eventBus: eventBus,
      linkService: pdfLinkService,
      findController: self.findController,
    });

    pdfLinkService.setViewer(self.pdfViewer);

    let annotationLayer = undefined,
      textLayer = undefined;
    if (self.annotation) {
      annotationLayer = new DefaultAnnotationLayerFactory();
    }
    if (self.text) {
      textLayer = new DefaultTextLayerFactory();
    }

    eventBus.on("pagesinit", function () {
      // We can use pdfViewer now, e.g. let's change default scale.
      self.pdfViewer.currentScaleValue = "page-width";

      // We can try searching for things.
      // if (SEARCH_FOR) {
      //   pdfFindController.executeCommand("find", { query: SEARCH_FOR });
      // }
    });

    self.internalSrc
      .then(function (pdfDocument) {
        // Document loaded, retrieving the page.
        self.pdf = pdfDocument;
        self.pdfViewer.setDocument(pdfDocument);
        pdfLinkService.setDocument(pdfDocument, null);

        self.$emit("numpages", pdfDocument.numPages);
        self.loading = false;
      })

      .catch((err) => {
        self.$emit("error", err);
        self.loading = false;
      });
  },
  beforeDestroy() {
    if (this.internalSrc && this.internalSrc.loadingTask)
      this.internalSrc.loadingTask.destroy();
  },
  methods: {
    calculateScale: function (width = -1, height = -1) {
      this.pdfViewer.update(1, this.rotate); // Reset scaling to 1 so that "this.pdfViewer.viewport.width" gives proper width;
      if (width === -1 && height === -1) {
        width = this.$refs.container.offsetWidth;
      }

      return width / this.pdfViewer.viewport.width;
    },
    drawScaled: function (newScale) {
      if (this.pdfViewer) {
        if (newScale === "page-width") {
          newScale = this.calculateScale();
          this.$emit("update:scale", newScale);
        }
        this.pdfViewer.update(newScale, this.rotate);
        this.pdfViewer.draw();
        this.loading = false;
        this.$emit("loading", false);
      }
    },
    resizeScale: function () {
      if (this.resize) {
        this.drawScaled("page-width");
      }
    },
  },
};
</script>
