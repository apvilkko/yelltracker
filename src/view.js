import {h} from 'preact';

const WIDTH = 80;
const HEIGHT = 50;

export const createCharView = () => {
  const view = [];
  for (let y = 0; y < HEIGHT; ++y) {
    const row = [];
    for (let x = 0; x < WIDTH; ++x) {
      row.push({});
    }
    view.push(row);
  }
  return view;
};

export const renderView = (currentView, view) => {
  // console.log('renderView', currentView, view);
  const chars = [];
  for (let y = 0; y < HEIGHT; ++y) {
    const row = [];
    for (let x = 0; x < WIDTH; ++x) {
      const el = view[y][x];
      const char = el.text;
      let className = [];
      if (el.color) {
        className.push(el.color + ' ');
      }
      if (el.bg) {
        className.push(`${el.bg}-bg`);
      }
      row.push(<span className={className.join('')}>{char || ' '}</span>);
    }
    chars.push(<div className="row">{row}</div>);
  }
  return chars;
};

export const setText = view => (text, x, y) => {
  for (let i = 0; i < text.text.length; ++i) {
    view[y][x + i] = Object.assign(view[y][x + i], text, {
      text: text.text[i],
    });
  }
};

const labels = [
  ['Song', 8, 3],
  ['Instrument', 2, 4],
  ['Order', 7, 5],
  ['Pattern', 5, 6],
  ['Row', 23, 6],
  ['Channel', 33, 6],
  ['File', 47, 3],
  ['Chord', 46, 4],
  ['C.Tempo', 44, 5],
  ['C.Speed', 44, 6],
  ['Baseoctave', 64, 6],
  ['FreeMem:', 63, 8],
  ['FreeEMS:', 63, 9],
];

const HELP_COORDS = [[3, 10], [27, 10]];
const TITLE_COORDS = {
  col1: 13,
  col2: 52,
  y: 3,
};

const helps = [
  ['ESC', 'Main Menu'],
  ['F1..F4', 'Edit Screen'],
  ['F10', 'Quick-Help'],
  ['CTRL-L', 'Load Module'],
  ['CTRL-Q', 'Quit to DOS'],
  ['F5/F8', 'Play / Stop'],
];

export const setupView = view => {
  const setter = setText(view);
  for (let i = 0; i < HEIGHT; ++i) {
    setter(
      {text: Array.from({length: WIDTH}).map(_ => ' '), bg: 'beige'},
      0,
      i
    );
  }
  setter({text: 'Yell Tracker V0.01', color: 'gold'}, 6, 1);
  labels.forEach(label => {
    setter({text: label[0], color: 'brown'}, label[1], label[2]);
  });
  helps.forEach((help, i) => {
    const col = i % 2;
    const offset = Math.floor(i / 2);
    let keyText = help[0] + ' ';
    while (keyText.length < 9) {
      keyText += '.';
    }
    setter(
      {text: keyText + ' ' + help[1], color: 'gold', bg: 'beige'},
      HELP_COORDS[col][0],
      HELP_COORDS[col][1] + offset
    );
  });
  return view;
};

const TITLE_LENGTH = 29;
const rpad = (text, len = TITLE_LENGTH) =>
  `${text}${Array.from({length: len - text.length})
    .map(_ => ' ')
    .join('')}`;

const titleText = text => ({text, color: 'green', bg: 'black'});

export const setModData = view => mod => {
  console.log('setModData', view, mod);
  if (mod.error) {
    return view;
  }
  const setter = setText(view);
  const y = TITLE_COORDS.y;
  setter(titleText(rpad(mod.title)), TITLE_COORDS.col1, y);
  setter(titleText('01'), TITLE_COORDS.col1, y + 1);
  setter(
    titleText(rpad(mod.instruments[0].title, TITLE_LENGTH - 3)),
    TITLE_COORDS.col1 + 3,
    y + 1
  );
  setter(titleText('00'), TITLE_COORDS.col1, y + 3);
  setter(titleText(rpad(mod.filename, 24)), TITLE_COORDS.col2, y);
  setter(titleText('none'), TITLE_COORDS.col2, y + 1);
  return view;
};
