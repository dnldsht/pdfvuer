import Vue from 'vue';
import App from './App.vue';




new Vue({
    render: h => h(App),
}).$mount('#app')

// if (
//   typeof window !== "undefined" &&
//   "Worker" in window &&
//   navigator.appVersion.indexOf("MSIE 10") === -1
// ) {
//   console.log("i have a workse");
//   require("worker-loader!pdfjs-dist/es5/build/pdf.worker.js");
// }


