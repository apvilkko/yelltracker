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
  SEMITONES[p.semitone] + p.octave + ' ' + lpad(p.instrument);

const pprintEffect = p =>
  p.command
    ? String.fromCharCode(p.command + 0x40) + p.info.toString(16).toUpperCase()
    : '.00';

export const pprint = p =>
  // p.channel +
  // ' ' +
  (p.note ? pprintNote(p) : '... ..') +
  ' ' +
  pprintVolume(p.volume) +
  ' ' +
  pprintEffect(p);

export const printPattern = p => {
  const out = [];
  p.forEach(row => {
    row.forEach((x, i) => {
      out.push(pprint(x));
      out.push(' | ');
    });
    out.push('\n');
  });
  console.log(out.join(''));
};
