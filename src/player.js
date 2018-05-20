import COMMANDS, {NOTE_OFF} from './commands';

const gain = (ctx, value = 1.0) => {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(value, ctx.currentTime);
  return gain;
};

const setupAudio = runtime => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContext();
  const mixBus = gain(ctx, 0.8);
  mixBus.connect(ctx.destination);
  const debugBus = gain(ctx, 0.8);
  debugBus.connect(ctx.destination);
  runtime.audio = {ctx, mixBus, debugBus};
};

const MONO = 1;
const TUNING = 440;
const A4 = 69;

export const noteToFreq = (octave, semitone) => {
  const m = octave * 12 + semitone;
  return Math.pow(2, (m - A4) / 12) * TUNING;
};

const setupBuffers = runtime => {
  const ctx = runtime.audio.ctx;
  runtime.audio.instruments = {};
  runtime.audio.channels = [];
  runtime.mod.channelSettings.forEach((channelSetting, index) => {
    if (channelSetting !== 255) {
      const channelGain = gain(ctx, 0.5);
      channelGain.connect(runtime.audio.mixBus);
      runtime.audio.channels.push({
        setting: channelSetting,
        gain: channelGain,
      });
    }
  });
  runtime.mod.instruments.forEach((instrument, index) => {
    if (instrument.type === 1 && !instrument.error) {
      // Create 32-bit float -1.0..1.0 buffer from uint8 buffer
      const sampleDataView = new Float32Array(instrument.sampleData);
      instrument.c2freq = noteToFreq(4, 0);
      instrument.buffer = ctx.createBuffer(
        MONO,
        instrument.length,
        ctx.sampleRate
      );
      const data = instrument.buffer.getChannelData(0);
      for (let i = 0; i < instrument.buffer.length; ++i) {
        data[i] = (sampleDataView[i] - 128) / 128.0;
      }
      const sampleGain = gain(ctx);
      runtime.audio.instruments[index] = {sampleGain};
    }
  });
};

const clampVolume = volume => Math.min(volume / 63.0, 1.0);

const playSample = (runtime, note, when = 0) => {
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
  const bufferSource = runtime.audio.ctx.createBufferSource();
  const rtInst = runtime.audio.instruments[index];
  const noteOff = note.note === NOTE_OFF;
  if (!rtInst && !noteOff) {
    console.error('No instrument', note);
    return;
  }
  const oldBufferSource = channel.bufferSource;
  if (oldBufferSource) {
    oldBufferSource.stop(when);
  }
  if (rtInst) {
    bufferSource.connect(rtInst.sampleGain);
    bufferSource.buffer = inst.buffer;
    const noteFreq = isDebug
      ? noteToFreq(4, 0)
      : noteToFreq(note.octave, note.semitone);
    const rate =
      noteFreq / inst.c2freq * inst.c2spd / runtime.audio.ctx.sampleRate;
    bufferSource.playbackRate.setValueAtTime(
      rate,
      runtime.audio.ctx.currentTime
    );
    if (!isDebug) {
      channel.bufferSource = bufferSource;
      channel.lastInstrument =
        note.instrument > 0 ? note.instrument : channel.lastInstrument;
      const instVolume = clampVolume(inst.volume || 63);
      const noteVolume =
        typeof note.volume === 'number' ? clampVolume(note.volume) : 1.0;
      rtInst.sampleGain.gain.setValueAtTime(noteVolume * instVolume, when);
    }
    const destination = isDebug ? runtime.audio.debugBus : channel.gain;
    rtInst.sampleGain.connect(destination);
    bufferSource.start(when);
  }
};

const stop = runtime => {
  runtime.sequencer.playing = false;
  runtime.sequencer.startTime = 0;
  runtime.sequencer.songPosition = 0;
  runtime.sequencer.row = -1;
  runtime.sequencer.pattern = 0;
  runtime.sequencer.subtick = 0;
  runtime.sequencer.tick = -1;
  runtime.sequencer.lastProcessed = {
    tick: -1,
    time: 0,
  };
};

const setupSequencer = runtime => {
  const sequencer = {
    tempo: runtime.mod.initialTempo,
    speed: runtime.mod.initialSpeed,
  };
  runtime.sequencer = sequencer;
  stop(runtime);
};

const play = runtime => {
  runtime.sequencer.playing = true;
  runtime.sequencer.startTime = runtime.audio.ctx.currentTime;
};

const getPatternLength = pattern => {
  // TODO calculate real length
  return pattern.length;
};

const getPattern = (mod, songPosition) => {
  const currentPosition = songPosition === -1 ? 0 : songPosition;
  const index = mod.orderList[currentPosition];
  if (typeof index === 'undefined' || index === 255) {
    return null;
  }
  return mod.patterns[index];
};

const applyCommand = (runtime, note) => {
  if (note.command) {
    const command = COMMANDS[note.command];
    console.log('command', command, note.info);
    switch (command) {
      case 'A':
        runtime.sequencer.speed = note.info;
        break;
      case 'T':
        runtime.sequencer.tempo = note.info;
        break;
      default:
        break;
    }
  }
};

// Must match worker tick length
const TICK_INTERVAL_S = 0.2;

export const tick = runtime => {
  // console.log('tick');
  const seq = runtime.sequencer;
  if (!seq || !runtime.audio) {
    return;
  }
  if (seq.playing) {
    let shouldStop = false;
    const now = runtime.audio.ctx.currentTime;
    // real bpm = tempo * 6 / speed, 4 rows per beat
    const tickLen = 60.0 / (seq.tempo * 6.0 * 4.0);
    const numTicks = Math.floor(TICK_INTERVAL_S / tickLen);
    const stopTick = seq.lastProcessed.tick + 1 + numTicks;
    for (let i = seq.lastProcessed.tick + 1; i < stopTick; ++i) {
      let currentPattern = getPattern(runtime.mod, seq.songPosition);
      seq.subtick++;
      if (seq.subtick === seq.speed) {
        seq.subtick = 0;
        seq.row++;
        if (seq.row >= getPatternLength(currentPattern)) {
          seq.row = 0;
          seq.songPosition++;
          currentPattern = getPattern(runtime.mod, seq.songPosition);
          if (currentPattern === null) {
            shouldStop = true;
            break;
          }
        }
        const tickCount = i - (seq.lastProcessed.tick + 1);
        // entered new row, trigger notes
        // console.log('trigger', seq.songPosition, seq.row);
        for (let j = 0; j < currentPattern[seq.row].length; ++j) {
          const note = currentPattern[seq.row][j];
          applyCommand(runtime, note);
          if (typeof note.instrument === 'number') {
            playSample(runtime, note, now + tickCount * tickLen);
          }
        }
      }
    }
    runtime.sequencer.lastProcessed = {
      tick: stopTick,
      time: now,
    };
    if (shouldStop) {
      stop(runtime);
    }
  }
};

export const operations = {
  setupAudio,
  setupBuffers,
  playSample,
  setupSequencer,
  play,
  stop,
};
