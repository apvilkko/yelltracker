import COMMANDS, {NOTE_OFF} from './commands';

const SEMITONES = {
  0: 'C-',
  1: 'C#',
  2: 'D-',
  3: 'D#',
  4: 'E-',
  5: 'F-',
  6: 'F#',
  7: 'G-',
  8: 'G#',
  9: 'A-',
  10: 'A#',
  11: 'B-',
};

const lpad = value => (value < 10 ? '0' + value : value);

const pprintVolume = value => (value || value === 0 ? lpad(value) : '..');

const pprintNote = p =>
  (p.note === NOTE_OFF ? '^^.' : SEMITONES[p.semitone] + p.octave) +
  ' ' +
  (p.instrument === 0 ? '..' : lpad(p.instrument));

const pprintEffect = p =>
  p.command
    ? COMMANDS[p.command] + lpad(p.info.toString(16)).toUpperCase()
    : '.00';

export const pprint = p =>
  // p.channel +
  // ' ' +
  (p.note ? pprintNote(p) : '... ..') +
  ' ' +
  pprintVolume(p.volume) +
  ' ' +
  pprintEffect(p);

export const printPattern = (p, numChannels = 4) => {
  const out = [];
  p.forEach(row => {
    let ch = 0;
    while (true) {
      const thisCh = row.find(x => x.channel === ch);
      if (thisCh) {
        out.push(pprint(thisCh));
      } else {
        out.push('... .. .. .00');
      }
      out.push(' | ');
      ch++;
      if (ch >= numChannels) {
        break;
      }
    }
    out.push('\n');
  });
  console.log(out.join(''));
};
