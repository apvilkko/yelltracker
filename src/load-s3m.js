// Scream Tracker file format reader
// ref: http://www.shikadi.net/moddingwiki/S3M_Format

import {
  readString,
  uint16le,
  uint32le,
  uint16leArray,
  uint8,
  toPointer,
} from './convert';

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

  sig2: [++i, (i += 3)],

  globalVolume: [++i, i],
  initialSpeed: [++i, i],
  initialTempo: [++i, i],
  masterVolume: [++i, i],
  ultraClickRemoval: [++i, i],
  defaultPan: [++i, i],

  reserved2: [++i, (i += 7)],
  ptrSpecial: [++i, ++i],
  channelSettings: [++i, (i += 31)],
};

const ORDER_LIST_START = i + 1;

const createPcmMap = start => {
  let i = start;
  return {
    ptrDataH: [i, i],
    ptrDataL: [++i, ++i],
    length: [++i, (i += 3)],
    loopStart: [++i, (i += 3)],
    loopEnd: [++i, (i += 3)],
    volume: [++i, i],
    reserved: [++i, i],
    pack: [++i, i],
    flags: [++i, i],
    c2spd: [++i, (i += 3)],
    internal: [++i, (i += 11)],
    title: [++i, (i += 27)],
    sig: [++i, (i += 3)],
  };
};

const actions = {
  HEADER: {
    title: readString,
    sig1: uint8,
    type: uint8,
    sig2: readString,
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
  PCM: {
    ptrDataH: uint8,
    ptrDataL: uint16le,
    length: uint32le,
    loopStart: uint32le,
    loopEnd: uint32le,
    volume: uint8,
    reserved: uint8,
    pack: uint8,
    flags: uint8,
    c2spd: uint32le,
    title: readString,
    sig: readString,
  },
};

const identity = x => x;

const createGetter = data => dataMap => key =>
  data.subarray(dataMap[key][0], dataMap[key][1] + 1);

const toArray = (data, action, start, end) =>
  (action || identity)(data.subarray(start, end));

const readInstrument = data => start => {
  const ret = {};
  let j = start;
  ret.type = uint8(data.subarray(j, j + 1));
  if (ret.type !== 0 && ret.type !== 1) {
    ret.error = 'unsupported instrument';
    return ret;
  }
  j++;
  ret.filename = readString(data.subarray(j, (j += 12)));

  const PCM = createPcmMap(j);
  const getter = createGetter(data)(PCM);
  Object.keys(PCM).forEach(key => {
    const action = actions.PCM[key] || identity;
    ret[key] = action(getter(key));
    // console.log(key, ret[key], ret[key].length);
  });

  if (ret.sig !== 'SCRS') {
    ret.error = 'invalid instrument';
  }
  ret.ptrData = (ret.ptrDataH << 16) + ret.ptrDataL;
  const sampleStart = toPointer(ret.ptrData);
  ret.sampleData = data.subarray(sampleStart, sampleStart + ret.length);
  return ret;
};

const readInstruments = (parapointers, data) =>
  parapointers.map(toPointer).map(readInstrument(data));

export default input => {
  const ret = {error: null};
  const getHeader = createGetter(input)(HEADER);
  Object.keys(HEADER).forEach(key => {
    const action = actions.HEADER[key] || identity;
    ret[key] = action(getHeader(key));
    // console.log(key, ret[key], ret[key].length);
  });
  if (ret.sig1 !== 0x1a || ret.type !== 0x10 || ret.sig2 !== 'SCRM') {
    ret.error = 'invalid header';
  }
  let j = ORDER_LIST_START;
  console.log('read orderList from ', j);
  ret.orderList = toArray(input, null, j, (j += ret.orderCount));
  ret.ptrInstruments = toArray(
    input,
    uint16leArray,
    j,
    (j += ret.instrumentCount * 2)
  );
  ret.ptrPatterns = toArray(
    input,
    uint16leArray,
    j,
    (j += ret.patternPtrCount * 2)
  );

  ret.instruments = readInstruments(ret.ptrInstruments, input);

  return ret;
};
