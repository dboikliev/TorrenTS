require.config({
    baseUrl: "../",

    // Framework paths
    paths: {
      "lib": "build/lib",
      "src": "build/src",
      "crypto-js": "node_modules/crypto-js/crypto-js",
      "es6-promise": "node_modules/es6-promise/dist/es6-promise",
      "webrtc-adapter": "node_modules/webrtc-adapter/out/adapter"

    },
});

require(["webrtc-adapter", "es6-promise"]);
require(["src/app"]);