const memory = {};

export default channel => effect => {
  if (!memory[channel]) {
    memory[channel] = {};
  }
  if (!memory[channel][effect]) {
    memory[channel][effect] = {};
  }
  return memory[channel][effect];
};
