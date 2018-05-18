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

const setupBuffers = runtime => {
  const ctx = runtime.audio.ctx;
  runtime.audio.instruments = {};
  runtime.mod.instruments.forEach((instrument, index) => {
    if (instrument.type === 1 && !instrument.error) {
      // Create 32-bit float -1.0..1.0 buffer from uint8 buffer
      const sampleDataView = new Float32Array(instrument.sampleData);
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

const playSample = (runtime, note, when = 0) => {
  if (!runtime || !runtime.mod) {
    return false;
  }
  const isDebug = typeof note === 'number';
  const index = isDebug ? note : note.instrument;
  const inst = runtime.mod.instruments[index];
  const bufferSource = runtime.audio.ctx.createBufferSource();
  const rtInst = runtime.audio.instruments[index];
  bufferSource.connect(rtInst.sampleGain);
  bufferSource.buffer = inst.buffer;
  const rate = inst.c2spd / runtime.audio.ctx.sampleRate;
  bufferSource.playbackRate.setValueAtTime(rate, runtime.audio.ctx.currentTime);
  rtInst.sampleGain.connect(
    isDebug ? runtime.audio.debugBus : runtime.audio.mixBus
  );
  bufferSource.start(when);
};

const stop = runtime => {
  runtime.sequencer.playing = false;
  runtime.sequencer.startTime = 0;
  runtime.sequencer.songPosition = 0;
  runtime.sequencer.row = 0;
  runtime.sequencer.pattern = 0;
  runtime.sequencer.subtick = 0;
  runtime.sequencer.tick = 0;
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

export const tick = runtime => {
  console.log('tick');
  const seq = runtime.sequencer;
  if (!seq || !runtime.audio) {
    return;
  }
  if (seq.playing) {
    let shouldStop = false;
    const now = runtime.audio.ctx.currentTime;
    const ticksPerBeat = seq.speed * 4.0;
    const tickLen = 60.0 / seq.tempo / ticksPerBeat;
    const currentTick =
      seq.startTime === 0 ? 0 : Math.floor((now - seq.startTime) / tickLen);
    for (let i = seq.lastProcessed.tick + 1; i <= currentTick; ++i) {
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
        console.log('trigger', seq.songPosition, seq.row);
        for (let j = 0; j < currentPattern[seq.row].length; ++j) {
          const note = currentPattern[seq.row][j];
          if (note.channel === 0 && typeof note.instrument !== 'undefined') {
            playSample(runtime, note, now + tickCount * tickLen);
          }
        }
      }
    }
    runtime.sequencer.lastProcessed = {
      tick: currentTick,
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
