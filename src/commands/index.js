import {default as A} from './a';
import {default as G} from './g';
import {default as T} from './t';

const COMMANDS = {};

for (let i = 1; i < 27; ++i) {
  COMMANDS[i] = String.fromCharCode(i + 0x40);
}

const NOTE_OFF = 0xfe;

const COMMAND_IMPL = {
  A,
  G,
  T,
};

export {COMMANDS as default, NOTE_OFF, COMMAND_IMPL};
