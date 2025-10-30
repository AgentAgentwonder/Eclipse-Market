module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './node_modules/@solana/wallet-adapter-react-ui/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        'solana-purple': '#9945FF',
        'solana-green': '#14F195',
        'deep-space': 'var(--color-deep-space, #050810)',
        'eclipse-orange': 'var(--color-eclipse-orange, #FF6B35)',
        'moonlight-silver': 'var(--color-moonlight-silver, #C0CCDA)',
        'shadow-accent': 'var(--color-shadow-accent, #1F2937)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'lunar-gradient': 'linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-middle), var(--color-gradient-end))',
        'eclipse-radial': 'radial-gradient(circle at 30% 50%, var(--color-eclipse-orange), transparent 50%)',
      },
      boxShadow: {
        'glow-subtle': '0 0 15px rgba(255, 107, 53, 0.2)',
        'glow-normal': '0 0 25px rgba(255, 107, 53, 0.4)',
        'glow-strong': '0 0 35px rgba(255, 107, 53, 0.65)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
    },
  },
  plugins: [],
}
