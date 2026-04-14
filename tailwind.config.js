/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        daycoval: {
          // Navy — cor estrutural primária (sidebar, headers, botões principais)
          navy:        '#1B3A6B',
          'navy-dark': '#122848',
          'navy-mid':  '#2A5298',
          'navy-50':   '#EEF2F9',
          'navy-100':  '#D6E0F0',
          // Laranja — somente acento/CTA (Nova Sessão, Enviar, destaques)
          orange:        '#E8610A',
          'orange-dark': '#C4500A',
          'orange-50':   '#FFF3EA',
          'orange-100':  '#FFE1C6',
        },
      },
    },
  },
  plugins: [],
}
