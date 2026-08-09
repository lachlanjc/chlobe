const babelConfig = require("./babel.config.js");

module.exports = {
  plugins: {
    "@stylexjs/postcss-plugin": {
      babelConfig: {
        babelrc: false,
        parserOpts: {
          plugins: ["typescript", "jsx"],
        },
        plugins: babelConfig.plugins,
      },
      include: ["app/**/*.{js,jsx,ts,tsx}", "components/**/*.{js,jsx,ts,tsx}"],
      useCSSLayers: true,
    },
    autoprefixer: {},
  },
};
