import getCurrentChannel from './getCurrentChannel';
import effectMemory from './effectMemory';
import freqToRate from '../freqToRate';
import noteToFreq from '../noteToFreq';

/**

Gxx Tone portamento with speed xx

This command will start changing the current pitch to match
the note given with this command. Subsequent G-commands will
continue sliding the pitch until the note is reached at which
time the portamento will be stopped.

--
Peculiarities in the Scream Tracker implementation of this effect:

If the current note is empty, the destination note is set to the last note to
show up in the channel, even if it has occurred without the Gxx effect.
Gxx doesn't clear the target note when it is reached, so any future Gxx with no
note will keep sliding back to this particular note.
 */

export default (runtime, note, when, {tickLen}) => {
  const channel = getCurrentChannel(runtime, note);
  const memory = effectMemory(note.channel)('G');
  if (note.note) {
    memory.targetNote = note;
  }
  const speed = runtime.sequencer.speed;
  // const amount = speed * (note.info > 0 ? note.info : memory.info) * 0.38;
  const amount = 100000;
  const bufferSource = channel ? channel.bufferSource : null;
  if (!bufferSource || !memory.targetNote) {
    return;
  }
  const target = memory.targetNote;
  const targetFreq = noteToFreq(target.octave, target.semitone);
  const currentFreq = channel.currentFreq;
  let tickFreq = currentFreq;
  let transitionLength = tickLen;
  if (targetFreq > currentFreq) {
    tickFreq += amount;
    const completeness = (targetFreq - currentFreq) / (tickFreq - currentFreq);
    console.log('completeness up', completeness, tickFreq > targetFreq);
    if (tickFreq > targetFreq) {
      tickFreq = targetFreq;
      transitionLength *= completeness;
    }
  } else {
    tickFreq -= amount;
    const completeness = (currentFreq - targetFreq) / (currentFreq - tickFreq);
    console.log('completeness down', completeness, targetFreq > tickFreq);
    if (targetFreq > tickFreq) {
      tickFreq = targetFreq;
      transitionLength *= completeness;
    }
  }
  const tickRate = freqToRate(runtime, channel.lastInstrument - 1, tickFreq);
  /* console.log(
    'currentFreq',
    currentFreq,
    'targetNote',
    memory.targetNote,
    'tickRate',
    tickRate,
    'tickFreq',
    tickFreq,
    'transitionLength',
    transitionLength,
    'speed',
    speed,
    'amount',
    amount
  ); */
  if (note.channel === 0) {
    console.log(
      'playbackRate to',
      tickRate,
      'cancel old at',
      when,
      'set new at',
      when + transitionLength,
      'transitionLength',
      transitionLength
    );
  }
  bufferSource.playbackRate.cancelAndHoldAtTime(when);
  bufferSource.playbackRate.linearRampToValueAtTime(
    tickRate,
    when + transitionLength
  );
  channel.currentFreq = tickFreq;
  if (note.info > 0) {
    memory.info = note.info;
  }
};
