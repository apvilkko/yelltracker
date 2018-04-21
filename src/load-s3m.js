// Scream Tracker file format reader

import {stringNullTerm, uint16le, uint16leArray, uint8} from './convert';

let i = 27;

const HEADER = {
  title: [0, i],
  sig1: [++i, i],
  type: [++i, i],
  reserved1: [++i, ++i],

  orderCount: [++i, ++i],
  instrumentCount: [++i, ++i],
  patternPtrCount: [++i, ++i],
  flags: [++i, ++i],
  trackerVersion: [++i, ++i],
  sampleType: [++i, ++i],

  sig2: [++i, i += 3],

  globalVolume: [++i, i],
  initialSpeed: [++i, i],
  initialTempo: [++i, i],
  masterVolume: [++i, i],
  ultraClickRemoval: [++i, i],
  defaultPan: [++i, i],

  reserved2: [++i, i += 7],
  ptrSpecial: [++i, ++i],
  channelSettings: [++i, i += 31],
};

const actions = {
  HEADER: {
    title: stringNullTerm,
    sig1: uint8,
    type: uint8,
    sig2: stringNullTerm,
    orderCount: uint16le,
    instrumentCount: uint16le,
    patternPtrCount: uint16le,
    flags: uint16le,
    trackerVersion: uint16le,
    sampleType: uint16le,
    globalVolume: uint8,
    initialSpeed: uint8,
    initialTempo: uint8,
    masterVolume: uint8,
    ultraClickRemoval: uint8,
    defaultPan: uint8,
  },
};

const identity = x => x;

const createGetter = data => dataMap => key =>
  data.subarray(dataMap[key][0], dataMap[key][1] + 1);

const toArray = (data, action, start, end) =>
  (action || identity)(data.subarray(start, end));

export default input => {
  const ret = {error: null};
  const getHeader = createGetter(input)(HEADER);
  Object.keys(HEADER).forEach(key => {
    const action = actions.HEADER[key] || identity;
    ret[key] = action(getHeader(key));
    // console.log(key, ret[key], ret[key].length);
  });
  if (ret.sig1 !== 0x1A || ret.type !== 0x10 || ret.sig2 !== 'SCRM') {
    ret.error = 'invalid header';
  }
  ret.orderList = toArray(input, null, ++i, i += ret.orderCount);
  ret.ptrInstruments = toArray(input, uint16leArray,
    i, i += (ret.instrumentCount * 2));
  ret.ptrPatterns = toArray(input, uint16leArray,
    i, i += (ret.patternPtrCount * 2));
  return ret;
};
