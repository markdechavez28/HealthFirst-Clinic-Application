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
          // palette derived from doctor pages using a color picker
          blue: "#3e68a3",        // primary/nav color (dark blue)
          blueDark: "#3a5a8c",    // slightly darker variant
          panel: "#a1c6ea",       // medium-light blue for panels/cards
          sidebar: "#e0e9f6",     // lightest blue for sidebar background
          teal: "#f0fdf4",        // pale green accent (used for borders etc.)
          tealDark: "#cdeacf",    // darker green variant if needed
          ink: "#0f172a",
          muted: "#64748b"
        },
        /* legacy/semantic names used throughout the doctor pages */
        navblue: "#2f567e",        // same as hf.blueDark
        txtblue: "#3a6898",        // same as hf.blue
        lightgreen: "#356f74",     // reuse hf.teal as a border/green accent
        bglightblue: "#d7e4ef",    // reuse hf.panel for light blue backgrounds
        bgdarkblue: "#2f567e"      // dark blue used on buttons/nav
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

