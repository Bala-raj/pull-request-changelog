export const gitPrune = (url): string =>
  `git fetch --no-tags --prune ${url} +refs/pull/*/head:refs/remotes/origin/pr/*`;

export const gitNoTag = (url): string =>
  `git fetch --no-tags ${url} +refs/heads/*:refs/remotes/origin/*`;

export const changeFiles = (sha): string =>
  `git diff-tree --no-commit-id --name-only -r ${sha}`;

export const getRemoteUrl =
    'git config --get remote.origin.url';