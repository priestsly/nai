module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber': {
          dark: '#0a0a12',
          primary: '#0fffc1',
          secondary: '#fe00fe',
          accent: '#00f9f9'
        }
      }
    },
  },
  plugins: [],
}