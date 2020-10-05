<template>
  <div>
    <slot v-if="loading" name="loading" />
    <div id="viewerContainer" ref="container">
      <div id="viewer" class="pdfViewer" />
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

const MIN_SCALE = 0.25;
const MAX_SCALE = 10.0;
const DEFAULT_SCALE_DELTA = 1.1;
const DEFAULT_SCALE_VALUE = "auto";

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
  props: {
    src: {
      type: [String, Object, Promise],
      default: "",
    },
    page: {
      type: Number,
      default: 1,
    },
    scale: {
      type: [Number, String],
      default: DEFAULT_SCALE_VALUE,
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
      console.log(val);
      this.pdfViewer.currentScaleValue = this.scale;
      console.log(this.pdfViewer.currentScale);
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
      self.pdfViewer.currentScaleValue = self.scale;
    });

    eventBus.on("pagechanging", function ({ pageNumber }) {
      // We can use pdfViewer now, e.g. let's change default scale.
      self.$emit("update:page", pageNumber);
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
      if (width === -1 && height === -1) {
        width = this.$refs.container.offsetWidth;
      }

      return width / this.pdfViewer.viewport.width;
    },

    zoomIn: function pdfViewZoomIn(ticks) {
      var newScale = this.pdfViewer.currentScale;
      do {
        newScale = (newScale * DEFAULT_SCALE_DELTA).toFixed(2);
        newScale = Math.ceil(newScale * 10) / 10;
        newScale = Math.min(MAX_SCALE, newScale);
      } while (--ticks && newScale < MAX_SCALE);
      this.pdfViewer.currentScaleValue = newScale;
    },

    zoomOut: function pdfViewZoomOut(ticks) {
      var newScale = this.pdfViewer.currentScale;
      do {
        newScale = (newScale / DEFAULT_SCALE_DELTA).toFixed(2);
        newScale = Math.floor(newScale * 10) / 10;
        newScale = Math.max(MIN_SCALE, newScale);
      } while (--ticks && newScale > MIN_SCALE);
      this.pdfViewer.currentScaleValue = newScale;
    },
  },
};
</script>
