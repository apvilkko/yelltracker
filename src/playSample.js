import {NOTE_OFF} from './commands';
import noteToFreq from './noteToFreq';
import freqToRate from './freqToRate';

const clampVolume = volume => Math.min(volume / 63.0, 1.0);

const hasLoop = inst => inst.flags & 1;

const toSecs = (sampleRate, sampleOffset) => sampleOffset / sampleRate;

export default (runtime, note, when = 0, options) => {
  if (!runtime || !runtime.mod) {
    return false;
  }
  // console.log('playSample', note);
  const channel = runtime.audio.channels[note.channel] || {};
  const isDebug = typeof note === 'number';
  const index = isDebug
    ? note
    : (note.instrument === 0 ? channel.lastInstrument : note.instrument) - 1;
  const inst = runtime.mod.instruments[index];
  const noteOff = note.note === NOTE_OFF;
  const sampleGain = channel.sampleGain;
  if (!sampleGain && !noteOff) {
    console.error('No instrument', note);
    return;
  }
  const oldBufferSource = channel.bufferSource;
  if (oldBufferSource && options.shouldPlay) {
    oldBufferSource.playbackRate.cancelAndHoldAtTime(when);
    oldBufferSource.stop(when);
  }
  if (!noteOff) {
    let bufferSource;
    if (options.shouldPlay) {
      bufferSource = runtime.audio.ctx.createBufferSource();
      bufferSource.connect(sampleGain);
      bufferSource.buffer = inst.buffer;
      if (hasLoop(inst)) {
        bufferSource.loopStart = toSecs(
          runtime.audio.ctx.sampleRate,
          inst.loopStart
        );
        bufferSource.loopEnd = toSecs(
          runtime.audio.ctx.sampleRate,
          inst.loopEnd
        );
        bufferSource.loop = true;
      }
      const noteFreq = isDebug
        ? noteToFreq(4, 0)
        : noteToFreq(note.octave, note.semitone);
      const rate = freqToRate(runtime, index, noteFreq);
      channel.currentFreq = noteFreq;
      if (note.channel === 0) {
        console.log('playSample playbackRate to', rate, 'at', when);
      }
      bufferSource.playbackRate.setValueAtTime(rate, when);
    } else {
      bufferSource = oldBufferSource;
    }
    if (!isDebug) {
      channel.bufferSource = bufferSource;
      channel.lastInstrument =
        note.instrument > 0 ? note.instrument : channel.lastInstrument;
      const instVolume = clampVolume(inst.volume || 63);
      const noteVolume =
        typeof note.volume === 'number' ? clampVolume(note.volume) : 1.0;
      // console.log('setting sampleGain', index, noteVolume * instVolume, when);
      sampleGain.gain.setValueAtTime(noteVolume * instVolume, when);
    }
    if (options.shouldPlay) {
      // const destination = isDebug ? runtime.audio.debugBus : channel.gain;
      // sampleGain.connect(destination);
      bufferSource.start(when);
    }
  }
};
