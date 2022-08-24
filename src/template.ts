// Header(aka heading): H1, H2, H3 and H4 but in markdown
// Scope: Main group separations after Headers
import { IChanges } from './common';
import { changesHeader, getHeader } from './headers';
import { getMessageDetails } from './message';
import { getMarkdownOfHead } from './markdown';

const VERSION_FRAGMENT = {
  MAJOR: "major",
  FEATURE: "feature", 
  BUG: "bug",
  ALPHA: "alpha",
  BETA: "beta",
  RC: "rc"
}

const breakline = `
`;

let versionBumpType = "";

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
  versionBumpType: string;
}

export default function MakeTemplate(commits): MakeTemplate {
  Object.keys(commits).forEach((sha) => prepareOutput(sha, commits[sha]));

  let changesTemplate: string[] = [];
  const featLogs = changes['feat'];
  if (featLogs) {
    if(versionBumpType.length == 0) versionBumpType = VERSION_FRAGMENT.FEATURE
    changesTemplate.push(getMarkdownOfHead('## ✨ Features', featLogs));
  }

  const fixLogs = changes['fix'];
  if (fixLogs) {
    if(versionBumpType.length == 0) versionBumpType = VERSION_FRAGMENT.BUG
    changesTemplate.push(getMarkdownOfHead('## 🐞 Fixes', fixLogs));
  }

  const refactorLogs = changes['refactor'];
  if (refactorLogs) {
    if(versionBumpType.length > 0) versionBumpType = VERSION_FRAGMENT.BUG
    changesTemplate.push(getMarkdownOfHead('## ♻️ Refactors', refactorLogs));
  }

  let testLogs = changes['test'];
  if (testLogs) {
    if(versionBumpType.length == 0) versionBumpType = VERSION_FRAGMENT.BUG
    changesTemplate.push(getMarkdownOfHead('## 🧪 Tests', testLogs));
  }

  const ciLogs = changes['ci'];
  if (ciLogs) {
    if(versionBumpType.length == 0) versionBumpType = VERSION_FRAGMENT.BUG
    changesTemplate.push(getMarkdownOfHead('## 🏗 CI', ciLogs));
  }

  const botLogs = changes['bot']
  if(botLogs) {
    if(versionBumpType.length == 0) versionBumpType = VERSION_FRAGMENT.RC
  }

  const changesLogs = changes[changesHeader];

  if (changesLogs) {
    if(versionBumpType.length == 0) versionBumpType = VERSION_FRAGMENT.BUG
    changesTemplate.push(getMarkdownOfHead('## 📋 Changes', changesLogs));
  }

  if(versionBumpType.length == 0) versionBumpType = VERSION_FRAGMENT.BUG
  console.log("-----------DEBUG-----------")
  console.log(changes);
  console.log(versionBumpType);
  return { 
    changesTemplate: changesTemplate.join(`${breakline}${breakline}`), 
    versionBumpType
  };
}
