/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                zalando: ['var(--font-zalando)'],
                bricolage: ['var(--font-bricolage)'],
                geist: ['var(--font-sans)'],
            }
        },
    },
    plugins: [],
}
