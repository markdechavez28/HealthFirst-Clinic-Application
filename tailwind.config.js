/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        hf: {
          teal: "#356f74",
          tealDark: "#2a5a5f",
          blue: "#3a6898",
          blueDark: "#2f567e",
          panel: "#d7e4ef",
          sidebar: "#e7f1f7",
          ink: "#0f172a",
          muted: "#64748b"
        }
      },
      boxShadow: {
        soft: "0 12px 24px rgba(15, 23, 42, 0.14)",
        card: "0 10px 20px rgba(15, 23, 42, 0.18)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      fontFamily: {
        hammersmith: ['Hammersmith One', 'sans-serif']
      }
    },
  },
  plugins: [],
}

