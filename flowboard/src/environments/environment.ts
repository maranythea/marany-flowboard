const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

export const environment = {
  production: !isLocalhost,
  apiUrl: isLocalhost
    ? 'http://localhost:3000/api'
    : 'https://marany-flowboard-ccpv.vercel.app/api',
};
