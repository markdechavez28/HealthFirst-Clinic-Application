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
        },
        // Flat color names for convenience
        bgdarkblue: "#2f567e",
        bglightblue: "#d7e4ef",
        txtblue: "#3a6898",
        txtgray: "#64748b",
        lightgreen: "#2a5a5f",
        navblue: "#e7f1f7"
      },
      boxShadow: {
        soft: "0 1px 3px rgba(15, 23, 42, 0.08)",
        card: "0 2px 8px rgba(15, 23, 42, 0.06)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      fontFamily: {
        hammersmith: ['Inter', 'system-ui', 'sans-serif'],
        formal: ['Lato', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}

