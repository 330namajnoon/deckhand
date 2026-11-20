const api = require('../gitlab');

async function getRepositoryFile(projectId, ref, filePath) {
  const file = await api.RepositoryFiles.show(projectId, filePath, ref);
  const content = Buffer.from(file.content, 'base64').toString('utf8');

  return { filePath, content };
}

module.exports = getRepositoryFile;
