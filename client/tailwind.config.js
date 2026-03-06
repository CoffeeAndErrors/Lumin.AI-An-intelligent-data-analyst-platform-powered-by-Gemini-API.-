/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    theme: {
        extend: {
            colors: {
                void: "#080808",
                surface: "#0f0f0f",
                elevated: "#141414",
                panel: "#111111",
                silver: {
                    100: "#e8e8e8",
                    200: "#d4d4d4",
                    300: "#b8b8b8",
                    400: "#8c8c8c",
                    500: "#646464",
                    600: "#404040",
                    700: "#2a2a2a",
                    800: "#1a1a1a",
                    900: "#111111",
                }
            },
            fontFamily: {
                display: ["Syne", "sans-serif"],
                mono: ["IBM Plex Mono", "monospace"],
            },
            backgroundImage: {
                'chrome': 'linear-gradient(135deg, #d4d4d4 0%, #707070 50%, #d4d4d4 100%)',
                'spotlight': 'radial-gradient(ellipse 80% 40% at 50% -5%, rgba(255,255,255,0.05) 0%, transparent 100%)',
            },
            boxShadow: {
                card: "0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.5)",
                glow: "0 0 0 1px rgba(255,255,255,0.06), 0 0 30px rgba(180,180,180,0.06)",
                'glow-hover': "0 0 0 1px rgba(255,255,255,0.12), 0 0 40px rgba(180,180,180,0.1)",
                'chrome-glow': "0 0 20px rgba(180,180,180,0.15)",
            }
        },
    },
    plugins: [],
}
