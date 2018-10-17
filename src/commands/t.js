export default (runtime, note) => {
  runtime.sequencer.tempo = note.info;
};
