export const readString = (input, length) => {
  const nullIndex = typeof length === 'undefined' ? input.indexOf(0) : length;
  const data = input.subarray(0, nullIndex > -1 ? nullIndex : input.length);
  return String.fromCharCode(...Array.from(data));
};

export const uint16le = input => (input[1] << 8) + input[0];
export const uint32le = input =>
  (input[3] << 24) + (input[2] << 16) + (input[1] << 8) + input[0];
export const uint16leArray = input => {
  const ret = [];
  for (let i = 0; i < input.length; i += 2) {
    ret.push(uint16le(input.subarray(i, i + 2)));
  }
  return ret;
};
export const uint8 = input => Number(input[0]);
export const toPointer = parapointer => parapointer << 4;
