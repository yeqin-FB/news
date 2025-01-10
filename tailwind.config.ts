import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  darkMode: "class",
  plugins: [nextui()],
};
// module.exports = {
//   theme: {
//     extend: {
//       colors: {
//         primary: {
//           50: '#f0f9ff',
//           // ... other shades
//           900: '#0c4a6e',
//         },
//         secondary: {
//           50: '#fdf4ff',
//           // ... other shades  
//           900: '#701a75',
//         }
//       }
//     }
//   }
// }
export default config;
