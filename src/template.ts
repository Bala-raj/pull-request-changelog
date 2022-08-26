// Header(aka heading): H1, H2, H3 and H4 but in markdown
// Scope: Main group separations after Headers
import { IChanges } from './common';
import { changesHeader, getHeader } from './headers';
import { getMessageDetails } from './message';
import { getMarkdownOfHead } from './markdown';

const breakline = `
`;

let changes: IChanges[] = [];

//
//
//
//

const prepareOutput = (sha, contentObject) => {
  const { prefix, heading, message } = getMessageDetails(contentObject.message);

  // Check if commit has a valid message
  if (!prefix && !message) {
    return;
  }

  // Prepare
  const h = getHeader(prefix);
  if (!changes[h]) {
    changes[h] = [];
  }

  const showPrefix = h === changesHeader ? prefix : '';
  changes[h].push({
    scope: heading || 'no-scope',
    message: `<details>
    <summary>${sha.substr(0, 7)} - ${showPrefix}${message}</summary>
    ${breakline}#### Changed files${breakline}${contentObject.files
      .map((file) => `- ${file}`)
      .join('\n')}
  </details>`,
  });
};

interface MakeTemplate {
  changesTemplate: string;
  versionMask: number[];
}

export default function MakeTemplate(commits): MakeTemplate {
  Object.keys(commits).forEach((sha) => prepareOutput(sha, commits[sha]));
  let versionMask: number[] = [];
  let changesTemplate: string[] = [];

  const featLogs = changes['feat'];
  if (featLogs) {
    if(versionMask.length == 0) versionMask = [1,0,0];
    changesTemplate.push(getMarkdownOfHead('## ✨ Features', featLogs));
  }

  const fixLogs = changes['fix'];
  if (fixLogs) {
    if(versionMask.length == 0) versionMask = versionMask = [0,0,1];
    changesTemplate.push(getMarkdownOfHead('## 🐞 Fixes', fixLogs));
  }

  const refactorLogs = changes['refactor'];
  if (refactorLogs) {
    if(versionMask.length == 0) versionMask = versionMask = [0,0,1];
    changesTemplate.push(getMarkdownOfHead('## ♻️ Refactors', refactorLogs));
  }

  let testLogs = changes['test'];
  if (testLogs) {
    if(versionMask.length == 0) versionMask = versionMask = [0,0,1];
    changesTemplate.push(getMarkdownOfHead('## 🧪 Tests', testLogs));
  }

  const ciLogs = changes['ci'];
  if (ciLogs) {
    if(versionMask.length == 0) versionMask = versionMask = [0,0,1];
    changesTemplate.push(getMarkdownOfHead('## 🏗 CI', ciLogs));
  }

  const botLogs = changes['bot']
  if(botLogs) {
    if(versionMask.length == 0) versionMask = versionMask = [0,0,1];
  }

  const changesLogs = changes[changesHeader];

  if (changesLogs) {
    if(versionMask.length == 0) versionMask = versionMask = [0,0,1];
    changesTemplate.push(getMarkdownOfHead('## 📋 Changes', changesLogs));
  }

  if(versionMask.length == 0) versionMask = versionMask = [0,0,1];

  return { 
    changesTemplate: changesTemplate.join(`${breakline}${breakline}`),
    versionMask
  };
}
