# localhub

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=flat-square)](https://friedinger.github.io/localhub/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Friedinger/localhub/build-deploy.yml?style=flat-square&label=Build%20and%20Deploy&color=lime)](https://github.com/Friedinger/localhub/actions/workflows/build-deploy.yml)
[![Last Commit](https://img.shields.io/github/last-commit/Friedinger/localhub?style=flat-square&color=orange)](https://github.com/Friedinger/localhub/commits/main)
[![License: MIT](https://img.shields.io/github/license/Friedinger/localhub?style=flat-square&color=yellow)](LICENSE)

One page that shows which local dev servers are running on which port. It scans
`localhost` in your browser and lists every port that answers with a web page,
including the page title where possible. No more guessing between 3000, 5173
and 8080.

## Features

- Scans a configurable list of ports (ranges like `3000-3010` are supported)
- Shows the page title if the dev server allows CORS (Vite and others do)
- Click a card to open the server
- Optional automatic rescan every 5 seconds
- Runs entirely in the browser, nothing is sent anywhere

## Notes

- Chrome and Edge ask once for permission to access local network devices
  when the page is opened from GitHub Pages. Allow it.
- Safari blocks HTTP requests from HTTPS pages, so run it locally there.
- Servers that only speak HTTPS or no HTTP (databases etc.) are not detected.

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run preview

npm run lint   # Prettier & ESLint
npm run fix    # Format and fix issues
```

## License

[MIT License](LICENSE) © 2026 Friedinger
