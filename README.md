# angle-dash

A dashboard made with Angular

## Setup

1. Clone the repository:

```bash
git clone https://github.com/ClutchForce/angle-dash.git
cd angle-dash
```

2. Install dependencies:

```bash
npm install
```

3. Run the app locally (dev server):

```bash
npm start
# open http://localhost:4200/home
```

## Build for production

Build the app (default Angular build):

```bash
npm run build
```

## Build and prepare for GitHub Pages

This project uses a `docs/` folder for publishing to GitHub Pages. The following script builds the app with the correct base href, moves the built files into the repo `docs/` folder, and creates a `404.html` fallback so client-side routing works on GitHub Pages:

```bash
npm run build:ghpages
```

After running the script, commit and push the `docs/` folder to GitHub and enable Pages from the `main` branch using the `docs/` folder as the source.

## Notes on routing

- The app uses standard path-based routing (e.g. `/home`, `/pie-chart`). Because GitHub Pages is a static host, direct navigation to nested routes will return a 404 unless a fallback is present. The `build:ghpages` script copies `index.html` to `404.html` to provide that fallback.
- If you prefer hash-based routing (URLs like `/#/home`), we can switch the router to use the hash location strategy instead; this avoids needing a 404 fallback.

## Troubleshooting

- If pages show a repository README instead of the app, ensure `docs/index.html` exists at the repository root (after running `npm run build:ghpages`) and that GitHub Pages is pointed to the `docs/` folder.
- If a route still 404s, double-check that `docs/404.html` is present and is a copy of the app entrypoint `index.html`.
