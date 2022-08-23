import fetch from 'node-fetch';
import { exec } from '@actions/exec';
import * as github from '@actions/github';
import * as core from '@actions/core';
import makeTemplate from './template';
import {gitNoTag, changeFiles, getCommits, gitPrune, getRemoteUrl} from './commands';

const pull_request = github.context.payload.pull_request;
const PR_ID = pull_request.number;
const URL = pull_request.comments_url;
const GITHUB_TOKEN = core.getInput('token') || process.env.token;
const branch = core.getInput('branch');
const currentVersion = core.getInput('version');

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
    console.log('Get remote URL')

    let myError = '';
    let remoteUrl = '';
    await exec(getRemoteUrl, [], {
      listeners: {
        stdout: (data) => {
          const splitted = data.toString().split('\n');
          splitted.forEach((item) => {
            if (item === '') {
              return;
            }
            remoteUrl = item;
          });
        },
        stderr: (data) => {
          myError = `${myError}${data.toString()}`;
        },
      }
    })

    if (myError !== '') {
      throw new Error(myError);
    }

    if (remoteUrl.indexOf('https://') == 0) {
      remoteUrl = 'https://' + GITHUB_TOKEN + '@' + remoteUrl.substring(8);
    }
    console.log('Remote url: ' + remoteUrl);
    console.log(pull_request);

    await exec(gitPrune(remoteUrl));
    await exec(gitNoTag(remoteUrl));

    // then we fetch the diff and grab the output
    let commits = {};
    let commitsStr = '';

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

    await exec('chmod +x ./src/version-script.sh');
    await exec('./src/version-script.sh',[currentVersion, (versionBumpType || 'bug')], {
      listeners: {
        stdout: (data) => {
          console.log(data);
          console.log("setting next version");
          core.setOutput("next-version", data);
        },
        stderr: (data) => {
          myError = `${myError}${data.toString()}`;
        },
      },
    });   


    await postToGit(URL, GITHUB_TOKEN, changesTemplate);
    core.setOutput("content", changesTemplate);
    
       // If there were errors, we throw it
    if (myError !== '') {
        throw new Error(myError);
    }
  
  } catch (e) {
    console.error('Failed due to : ',e);
    process.exit(1);
  }
})();
