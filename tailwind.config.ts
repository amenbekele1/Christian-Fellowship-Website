import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        // ── Brand palette ──────────────────────────────────────────
        // Warm brown scale  (logo #3D2800, Bible cover #6B4F0F)
        brown: {
          50:  "#FAF7F0",   // page background
          100: "#F0E6D3",   // section background
          200: "#E0CBB0",   // borders
          300: "#C4A882",   // muted text, dividers
          400: "#9A7B5C",   // secondary text
          500: "#7A5C3E",   // body text
          600: "#5C3D20",   // subheadings
          700: "#3D2410",   // dark headings
          800: "#2C1A0E",   // sidebar bg
          900: "#1C0F07",   // sidebar header, darkest
        },

        // Gold scale  (logo #C9A84C)
        gold: {
          50:  "#FFFAEE",
          100: "#FBF3D8",
          200: "#F5E3BB",
          300: "#EDD090",
          400: "#DDB95A",
          500: "#C9A84C",   // ← logo gold, primary accent
          600: "#B8943A",
          700: "#9A7A2C",
          800: "#7A5F20",
          900: "#5C4514",
        },

        // Neutral warm grays (replace cool grays)
        warm: {
          50:  "#FDFCFA",
          100: "#F7F4EE",
          200: "#EDE8DF",
          300: "#DDD5C8",
          400: "#C4B9A8",
          500: "#A89880",
          600: "#8A7A64",
          700: "#6B5E4A",
          800: "#4D4235",
          900: "#2E2720",
        },
      },

      fontFamily: {
        sans:      ["var(--font-sans)", "system-ui", "sans-serif"],
        display:   ["var(--font-display)", "Georgia", "serif"],
        scripture: ["var(--font-scripture)", "Georgia", "serif"],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      boxShadow: {
        "warm-sm": "0 1px 3px rgba(44, 26, 14, 0.08), 0 1px 2px rgba(44, 26, 14, 0.04)",
        "warm":    "0 4px 12px rgba(44, 26, 14, 0.10), 0 2px 4px rgba(44, 26, 14, 0.06)",
        "warm-lg": "0 10px 30px rgba(44, 26, 14, 0.14), 0 4px 8px rgba(44, 26, 14, 0.08)",
        "gold":    "0 4px 16px rgba(201, 168, 76, 0.30)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in": {
          "0%":   { opacity: "0", transform: "translateX(-20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-up":        "fade-up 0.55s ease-out both",
        "fade-in":        "fade-in 0.4s ease-out both",
        "scale-in":       "scale-in 0.35s ease-out both",
        "slide-in":       "slide-in 0.4s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
