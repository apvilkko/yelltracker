export const stringNullTerm = input => {
  const nullIndex = input.indexOf(0);
  const data = input.subarray(0, nullIndex > -1 ? nullIndex : input.length);
  return String.fromCharCode(...Array.from(data));
};

export const uint16le = input => ((input[1] << 8) + input[0]);
export const uint16leArray = input => {
  const ret = [];
  for (let i = 0; i < input.length; i += 2) {
    ret.push(uint16le(input.subarray(i, i + 2)));
  }
  return ret;
};
export const uint8 = input => Number(input[0]);
