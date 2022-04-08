module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    screens: {
      lg: '800px',
      xl: '1000px',
      xxl: '1200px',
    },
    extend: {
      colors: {
        accent: '#0076d6',
        hover: '#005ea2',
        border: '#757575',
        button: '#e5e7eb',
        'button-hover': '#adadad',
        'button-active': '#757575',
      },
      gridTemplateColumns: {
        'input-layout': '1fr min-content min-content'
      },
      gridTemplateRows: {
        'input-layout': 'repeat(2, min-content)'
      }
    }
  },
  plugins: [
    require('@tailwindcss/line-clamp')
  ]
};
