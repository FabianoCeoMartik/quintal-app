/** Paleta Quintal: azul-tinta (estrutura), rosa-orkut (ação), fundo azulado frio. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        tinta: '#1B2250',
        ceu: '#EEF2FB',
        azul: '#2B4BF2',
        rosa: '#F0457F',
        sombra: '#0E1226',
      },
      fontFamily: { sans: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
