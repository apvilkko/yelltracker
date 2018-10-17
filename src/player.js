import COMMANDS, {COMMAND_IMPL} from './commands';
import playSample from './playSample';
import noteToFreq from './noteToFreq';

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
  runtime.audio.channels = [];
  runtime.mod.channelSettings.forEach((channelSetting, index) => {
    if (channelSetting !== 255) {
      const channelGain = gain(ctx, 0.5);
      const sampleGain = gain(ctx);
      sampleGain.connect(channelGain);
      channelGain.connect(runtime.audio.mixBus);
      console.log('creating channel', index);
      runtime.audio.channels.push({
        setting: channelSetting,
        gain: channelGain,
        sampleGain: sampleGain,
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
    }
  });
};

const stop = (runtime, when = 0) => {
  runtime.audio.channels.forEach(channel => {
    if (channel && channel.bufferSource) {
      channel.bufferSource.stop(when);
    }
  });
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

const applyCommand = (runtime, note, ...rest) => {
  const command = COMMANDS[note.command];
  console.log('command', command, note.info);
  const handler = COMMAND_IMPL[command];
  if (handler) {
    handler(runtime, note, ...rest);
  } else {
    // console.error(`command ${command} not handled!`);
  }
};

const getPlayOptions = note => {
  const isInstrument = typeof note.instrument === 'number';
  const isCommand = !!note.command;
  let shouldPlay = true;
  if (isInstrument && isCommand && COMMANDS[note.command] === 'G') {
    shouldPlay = false;
  }
  return {
    isInstrument,
    isCommand,
    shouldPlay,
    // If instrument changes while using tone portamento (G) the new
    // sample seems to start from where the previous left off
    offset: 0, // TODO
  };
};

const noteMemory = {};

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
    const elapsed = now - (seq.lastProcessed.time || seq.startTime);
    const numTicks = Math.floor(elapsed / tickLen);
    const stopTick = seq.lastProcessed.tick + 1 + numTicks;
    let when;
    for (let i = seq.lastProcessed.tick + 1; i < stopTick; ++i) {
      let currentPattern = getPattern(runtime.mod, seq.songPosition);
      const tickCount = i - (seq.lastProcessed.tick + 1);
      when = now + tickCount * tickLen;
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
        // entered new row, trigger notes
        // console.log('trigger', seq.songPosition, seq.row);
        for (let j = 0; j < currentPattern[seq.row].length; ++j) {
          const note = currentPattern[seq.row][j];
          const options = getPlayOptions(note);
          if (options.isInstrument) {
            playSample(runtime, note, when, options);
            noteMemory[note.channel] = note;
          }
          if (options.isCommand) {
            applyCommand(runtime, note, when, {tickLen});
          }
        }
      }
    }
    runtime.sequencer.lastProcessed = {
      tick: stopTick,
      time: now,
    };
    if (shouldStop) {
      stop(runtime, when);
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
