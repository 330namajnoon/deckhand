const { Gitlab } = require('@gitbeaker/rest');

// GITLAB_HOST y GITLAB_TOKEN se definen en ecosystem.config.js (pm2) o en el
// entorno del shell. Ver .env.example.
const gitlabApi = new Gitlab({
  host: process.env.GITLAB_HOST,
  token: process.env.GITLAB_TOKEN,
});

module.exports =  gitlabApi;