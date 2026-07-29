# Deebyanshu Jha Portfolio

software engineering portfolio built with React, Vite, TypeScript, Tailwind CSS, Motion, Lucide React, React Three Fiber, Drei, and React Router.

## Run Locally

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Checks

```powershell
npm run lint
npm run build
npm run verify:hero
npm run verify:app
```

The Playwright verification scripts expect the dev server to be running locally.

## GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`. It builds the portfolio with the correct Vite base path for:

`https://deebyanshujha.github.io/my_portfolio/`
