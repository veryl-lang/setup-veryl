const path = require('path');
const core = require('@actions/core');
const tc = require('@actions/tool-cache');
const Octokit = require("@octokit/action");
const { getDownloadObject } = require('./lib/utils');

async function setup() {
  try {
    // Get version of tool to be installed
    const version = core.getInput('version');

    // Get latest version
    const octokit = new Octokit();
    const resp = await octokit.request('GET /repos/veryl-lang/veryl/releases/latest', {
      owner: 'veryl-lang',
      repo: 'veryl',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    const latest = resp['name'];
    const resolvedVersion = version === 'latest' ? latest : version;
    core.info(`resolved version: ${ resolvedVersion }`);

    let toolPath = tc.find('veryl', resolvedVersion);

    if (!toolPath) {
      core.info('downloading Veryl binary');

      // Download the specific version of the tool, e.g. as a tarball/zipball
      const download = getDownloadObject(resolvedVersion);
      const pathToTarball = await tc.downloadTool(download.url);

      // Extract the tarball/zipball onto host runner
      const extract = download.url.endsWith('.zip') ? tc.extractZip : tc.extractTar;
      const extractedPath = await extract(pathToTarball);
      toolPath = await tc.cacheDir(extractedPath, 'veryl', resolvedVersion);
    } else {
      core.info('use cached binary');
    }

    // Expose the tool by adding it to the PATH
    core.addPath(toolPath);
  } catch (e) {
    core.setFailed(e);
  }
}

module.exports = setup

if (require.main === module) {
  setup();
}
