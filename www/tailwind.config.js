const { fontFamily } = require("tailwindcss/defaultTheme")

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.{html,js,mjs,css}",
  ],
  theme: {
    extend: {
    },
  },
  plugins: [require("daisyui")],
}
