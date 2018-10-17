export default (runtime, note) => {
  if (runtime && runtime.audio && runtime.audio.channels && note) {
    return runtime.audio.channels[note.channel];
  }
  return null;
};
