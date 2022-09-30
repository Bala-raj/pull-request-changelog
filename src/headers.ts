export const changesHeader = 'changes';

// MARK: - Preidentified Headers
const headers = {
  'feat:': 'feat',
  'fix:': 'fix',
  'docs:': 'docs',
  'ci:': 'ci',
  'test:': 'test',
  'refactor:': 'refactor',
  'major:': 'major',
};

export const getHeader = (prefix: string): string =>
  headers[prefix] || changesHeader;
