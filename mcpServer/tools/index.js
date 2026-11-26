const listRepositories = require("./listRepositories");
const getRepoCatalog = require("./getRepoCatalog");
const listSkills = require("./listSkills");
const getSkill = require("./getSkill");
const getRepositoryBranches = require("./getRepositoryBranches");
const getRepositoryTree = require("./getRepositoryTree");
const getRepositoryFile = require("./getRepositoryFile");
const searchRepository = require("./searchRepository");
const listDeploys = require("./listDeploys");
const listActiveDeploys = require("./listActiveDeploys");
const listPipelines = require("./listPipelines");
const getPipelineJobs = require("./getPipelineJobs");
const retryPipeline = require("./retryPipeline");
const runPipeline = require("./runPipeline");
const getDeploy = require("./getDeploy");
const deleteDeploy = require("./deleteDeploy");
const openVscode = require("./openVscode");
const redeployEntorno = require("./redeployEntorno");
const createDeploy = require("./createDeploy");
const openSettings = require("./openSettings");
const remoteLoadContext = require("./remoteLoadContext");
const remoteExec = require("./remoteExec");
const remoteReadFile = require("./remoteReadFile");
const remoteWriteFile = require("./remoteWriteFile");
const remoteEditFile = require("./remoteEditFile");
const remoteListDir = require("./remoteListDir");
const remoteDbQuery = require("./remoteDbQuery");
const listRemoteActions = require("./listRemoteActions");

module.exports = [
	listRepositories,
	getRepoCatalog,
	listSkills,
	getSkill,
	getRepositoryBranches,
	getRepositoryTree,
	getRepositoryFile,
	searchRepository,
	listDeploys,
	listActiveDeploys,
	listPipelines,
	getPipelineJobs,
	retryPipeline,
	runPipeline,
	getDeploy,
	deleteDeploy,
	openVscode,
	redeployEntorno,
	createDeploy,
	openSettings,
	remoteLoadContext,
	remoteExec,
	remoteReadFile,
	remoteWriteFile,
	remoteEditFile,
	remoteListDir,
	remoteDbQuery,
	listRemoteActions,
];
