export default (runtime, index, noteFreq) => {
  const inst = runtime.mod.instruments[index];
  return noteFreq / inst.c2freq * inst.c2spd / runtime.audio.ctx.sampleRate;
};
