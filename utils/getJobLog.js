const api = require('../gitlab');

async function getJobLog(projectId, jobId) {
  return api.Jobs.showLog(projectId, jobId);
}

module.exports = getJobLog;
