module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@solana/wallet-adapter-react-ui/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        'solana-purple': '#9945FF',
        'solana-green': '#14F195'
      }
    },
  },
  plugins: [],
}
