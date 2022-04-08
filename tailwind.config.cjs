module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    screens: {
      lg: '600px',
      xl: '1000px',
      xxl: '1400px',
    },
    extend: {
      colors: {
        accent: '#0076d6',
        'accent-dark': '#005ea2',
        'button-hover': '#adadad',
        'button-active': '#757575',
      },
      gridTemplateColumns: {
        'wide-input-layout': '1fr min-content min-content',
        'narrow-input-layout': '1fr',
      },
      gridTemplateRows: {
        'wide-input-layout': 'repeat(2, min-content)',
      }
    }
  },
  plugins: [
    require('@tailwindcss/line-clamp')
  ]
};
