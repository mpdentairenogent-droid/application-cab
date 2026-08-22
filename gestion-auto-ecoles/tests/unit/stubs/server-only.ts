// Stub pour les tests Vitest. Le vrai paquet `server-only` lève systématiquement une erreur à
// l'import (voir node_modules/server-only/index.js) : c'est le bundler Next.js qui, en dehors des
// tests, l'aliase vers un module vide côté serveur et ne laisse l'erreur se produire que dans un
// bundle client. Vitest n'ayant pas cette résolution spéciale, on la reproduit ici (voir l'alias
// "server-only" dans vitest.config.ts) pour pouvoir importer du code serveur dans les tests.
export {};
