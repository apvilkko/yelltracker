const fs = require('fs');

export const readFile = filename => new Uint8Array(fs.readFileSync(filename));
