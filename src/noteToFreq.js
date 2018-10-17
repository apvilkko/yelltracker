const TUNING = 440;
const A4 = 69;

export default (octave, semitone) => {
  const m = octave * 12 + semitone;
  return Math.pow(2, (m - A4) / 12) * TUNING;
};
