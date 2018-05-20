const COMMANDS = {};

for (let i = 1; i < 27; ++i) {
  COMMANDS[i] = String.fromCharCode(i + 0x40);
}

export const NOTE_OFF = 0xfe;

export default COMMANDS;
