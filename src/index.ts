import fetch from 'node-fetch';
import { exec } from '@actions/exec';
import * as github from '@actions/github';
import * as core from '@actions/core';
import makeTemplate from './template';
import { gitNoTag, changeFiles, getCommits, gitPrume } from './commands';

const pull_request = github.context.payload.pull_request;
const PR_ID = pull_request.number;
const URL = pull_request.comments_url;
const GITHUB_TOKEN = core.getInput('token') || process.env.token;
const branch = core.getInput('branch');

const postToGit = async (url, key, body) => {
  const rawResponse = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `token ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });
  if (!rawResponse.ok) {
    throw new Error(rawResponse.statusText);
  }
  const content = await rawResponse.json();
  return content;
};

/**
 * Action core
 */
(async () => {
  try {
    if (GITHUB_TOKEN === undefined) {
      throw new Error('Missing auth thoken');
    }
    if (branch === undefined) {
      throw new Error('Missing branch');
    }
    console.log('Generating changelog....');

    await exec(gitPrume);
    await exec(gitNoTag);

    // then we fetch the diff and grab the output
    let commits = {};
    let commitsStr = '';
    let myError = '';

    // get diff between master and current branch
    await exec(getCommits(PR_ID, branch), [], {
      listeners: {
        stdout: (data) => {
          const splitted = data.toString().split('\n');
          splitted.forEach((item) => {
            if (item === '') {
              return;
            }
            const sha = item.substr(0, 40);
            if (sha === '') {
              return;
            }
            const message = item.substr(41);
            commits[sha] = { message };
          });

          // remove
          commitsStr = `${commitsStr}${data.toString()}`;
        },
        stderr: (data) => {
          myError = `${myError}${data.toString()}`;
        },
      },
    });

    // If there were errors, we throw it
    if (myError !== '') {
      throw new Error(myError);
    }

    const shaKeys = Object.keys(commits).map(
      (sha) =>
        new Promise((resolve, reject) => {
          exec(changeFiles(sha), [], {
            listeners: {
              stdout: (data) => {
                commits[sha].files = data
                  .toString()
                  .split('\n')
                  .filter((i) => i);
                resolve(undefined);
              },
              stderr: (data) => {
                myError = `${myError}${data.toString()}`;
              },
            },
          });
        }),
    );

    await Promise.all(shaKeys);

    const { changesTemplate, versionBumpType } = makeTemplate(commits);
    
    console.log("Version Bump Type" + versionBumpType);
        
    await postToGit(URL, GITHUB_TOKEN, changesTemplate);

    core.setOutput("bump-type", versionBumpType)
    core.setOutput("content", changesTemplate)

  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();
