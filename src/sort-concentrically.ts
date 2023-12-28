import { window, TextEditor, workspace, Range, Uri } from 'vscode';

// Concentric CSS order taken from https://github.com/brandon-rhodes/ConcentricCSS
const defaultOrder = [
  /* browser default styles */
  'all',
  'appearance',

  /* box model */
  'boxSizing',

  /* position */
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',

  'float',
  'clear',

  /* flex */
  'flex',
  'flexBasis',
  'flexDirection',
  'flexFlow',
  'flexGrow',
  'flexShrink',
  'flexWrap',

  /* grid */
  'grid',
  'gridArea',
  'gridTemplate',
  'gridTemplateAreas',
  'gridTemplateRows',
  'gridTemplateColumns',
  'gridRow',
  'gridRowStart',
  'gridRowEnd',
  'gridColumn',
  'gridColumnStart',
  'gridColumnEnd',
  'gridAutoRows',
  'gridAutoColumns',
  'gridAutoFlow',
  'gridGap',
  'gridRowGap',
  'gridColumnGap',

  /* flex align */
  'alignContent',
  'alignItems',
  'alignSelf',

  /* flex justify */
  'justifyContent',
  'justifyItems',
  'justifySelf',

  /* order */
  'order',

  /* columns */
  'columns',
  'columnGap',
  'columnFill',
  'columnRule',
  'columnRuleWidth',
  'columnRuleStyle',
  'columnRuleColor',
  'columnSpan',
  'columnCount',
  'columnWidth',

  /* transform */
  'backfaceVisibility',
  'perspective',
  'perspectiveOrigin',
  'transform',
  'transformOrigin',
  'transformStyle',

  /* transitions */
  'transition',
  'transitionDelay',
  'transitionDuration',
  'transitionProperty',
  'transitionTimingFunction',

  /* visibility */
  'visibility',
  'opacity',
  'mixBlendMode',
  'isolation',
  'zIndex',

  /* margin */
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',

  /* outline */
  'outline',
  'outlineOffset',
  'outlineWidth',
  'outlineStyle',
  'outlineColor',

  /* border */
  'border',
  'borderTop',
  'borderRight',
  'borderBottom',
  'borderLeft',
  'borderWidth',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',

  /* borderStyle */
  'borderStyle',
  'borderTopStyle',
  'borderRightStyle',
  'borderBottomStyle',
  'borderLeftStyle',

  /* borderRadius */
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',

  /* borderColor */
  'borderColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',

  /* borderImage */
  'borderImage',
  'borderImageSource',
  'borderImageWidth',
  'borderImageOutset',
  'borderImageRepeat',
  'borderImageSlice',

  /* boxShadow */
  'boxShadow',

  /* background */
  'background',
  'backgroundAttachment',
  'backgroundClip',
  'backgroundColor',
  'backgroundImage',
  'backgroundOrigin',
  'backgroundPosition',
  'backgroundRepeat',
  'backgroundSize',
  'backgroundBlendMode',

  /* cursor */
  'cursor',

  /* padding */
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',

  /* width */
  'width',
  'minWidth',
  'maxWidth',

  /* height */
  'height',
  'minHeight',
  'maxHeight',

  /* overflow */
  'overflow',
  'overflowX',
  'overflowY',
  'resize',

  /* listStyle */
  'listStyle',
  'listStyleType',
  'listStylePosition',
  'listStyleImage',
  'captionSide',

  /* tables */
  'tableLayout',
  'borderCollapse',
  'borderSpacing',
  'emptyCells',

  /* animation */
  /* animation-[[name] [duration] [timingFunction] [delay] [iterationCount] [direction] [fillMode] [playState]]*/
  'animation',
  'animationName',
  'animationDuration',
  'animationTimingFunction',
  'animationDelay',
  'animationIterationCount',
  'animationDirection',
  'animationFillMode',
  'animationPlayState',

  /* verticalAlignment */
  'verticalAlign',

  /* textAlignment & decoration */
  'direction',
  'tabSize',
  'textAlign',
  'textAlignLast',
  'textJustify',
  'textIndent',
  'textTransform',
  'textDecoration',
  'textDecorationColor',
  'textDecorationLine',
  'textDecorationStyle',
  'textRendering',
  'textShadow',
  'textOverflow',

  /* textSpacing */
  'lineHeight',
  'wordSpacing',
  'letterSpacing',
  'whiteSpace',
  'wordBreak',
  'wordWrap',
  'color',

  /* font */
  'font',
  'fontFamily',
  'fontKerning',
  'fontSize',
  'fontSizeAdjust',
  'fontStretch',
  'fontWeight',
  'fontSmoothing',
  'osxFontSmoothing',
  'fontVariant',
  'fontStyle',

  /* content */
  'content',
  'quotes',

  /* counters */
  'counterReset',
  'counterIncrement',

  /* breaks */
  'pageBreakBefore',
  'pageBreakAfter',
  'pageBreakInside',

  /* mouse */
  'pointerEvents',

  /* intent */
  /* provides a way for authors to hint browsers about the kind of changes to be expected on an element, so that the browser can set up appropriate optimizations ahead of time before the element is actually changed. These kind of optimizations can increase the responsiveness of a page by doing potentially expensive work ahead of time before they are actually required. */
  'willChange'
];

type SortingAlgorithm = (a: string, b: string) => number;

function sortActiveSelection(algorithm: SortingAlgorithm, removeDuplicateValues: boolean): Thenable<boolean> | undefined {
  const textEditor = window.activeTextEditor;
  const selection = textEditor.selection;
  if (selection.isSingleLine) {
    return undefined;
  }
  return sortConcentrically(textEditor, selection.start.line, selection.end.line, algorithm, removeDuplicateValues);
}

function sortConcentrically(textEditor: TextEditor, startLine: number, endLine: number, algorithm: SortingAlgorithm, removeDuplicateValues: boolean): Thenable<boolean> {
  const lines: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    lines.push(textEditor.document.lineAt(i).text);
  }

  // Remove blank lines in selection
  if (workspace.getConfiguration('sortConcentrically').get('filterBlankLines') === true) {
    removeBlanks(lines);
  }

  lines.sort(algorithm);

  if (removeDuplicateValues) {
    removeDuplicates(lines, algorithm);
  }

  return textEditor.edit(editBuilder => {
    const range = new Range(startLine, 0, endLine, textEditor.document.lineAt(endLine).text.length);
    editBuilder.replace(range, lines.join('\n'));
  });
}

function removeDuplicates(lines: string[], algorithm: SortingAlgorithm | undefined): void {
  for (let i = 1; i < lines.length; ++i) {
    if (algorithm ? algorithm(lines[i - 1], lines[i]) === 0 : lines[i - 1] === lines[i]) {
      lines.splice(i, 1);
      i--;
    }
  }
}

function removeBlanks(lines: string[]): void {
  for (let i = 0; i < lines.length; ++i) {
    if (lines[i].trim() === '') {
      lines.splice(i, 1);
      i--;
    }
  }
}

interface ISettings {
  customOrder?: string[];
}

// tslint:disableNextLine
function getSettings(UriWorkspace: Uri): ISettings {
  const settings = workspace.getConfiguration(null, UriWorkspace).get('sortConcentrically') as ISettings;

  return settings;
}

const document = window.activeTextEditor.document;
const workspaceFolder = workspace.getWorkspaceFolder(document.uri);
const workspaceUri = workspaceFolder ? workspaceFolder.uri : null;

const settings = getSettings(workspaceUri);

const sortOrder = settings && settings.customOrder || defaultOrder;

function concentric(a: string, b: string): number {
  const aProp = a.match(/^([^:]+)/)[0].trim();
  const bProp = b.match(/^([^:]+)/)[0].trim();

  // leave to end of array if not in sortOrder list
  if (sortOrder.indexOf(aProp) === -1 && sortOrder.indexOf(bProp) === -1) {
    // both are not in sortOrder array, so alphabetise them
    return aProp > bProp ? 1 : -1;
  } else if (sortOrder.indexOf(aProp) === -1) {
    // move down a
    return 1;
  } else if (sortOrder.indexOf(bProp) === -1) {
    // move down b
    return -1;
  }

  // both are in sortOrder array, so sort them normally
  return sortOrder.indexOf(aProp) - sortOrder.indexOf(bProp);
}

function concentricUndefTop(a: string, b: string): number {
  const aProp = a.match(/^([^:]+)/)[0].trim();
  const bProp = b.match(/^([^:]+)/)[0].trim();

  // leave to end of array if not in sortOrder list
  if (sortOrder.indexOf(aProp) === -1 && sortOrder.indexOf(bProp) === -1) {
    // both are not in sortOrder array, so alphabetise them
    return aProp > bProp ? 1 : -1;
  } else if (sortOrder.indexOf(aProp) === -1) {
    // move up a
    return -1;
  } else if (sortOrder.indexOf(bProp) === -1) {
    // move up b
    return 1;
  }

  // both are in sortOrder array, so sort them normally
  return sortOrder.indexOf(aProp) - sortOrder.indexOf(bProp);
}

export const sortNormal = () => sortActiveSelection(concentric, false);
export const sortUndefTop = () => sortActiveSelection(concentricUndefTop, false);
