const listRepositories = require("./listRepositories");
const getRepoCatalog = require("./getRepoCatalog");
const listSkills = require("./listSkills");
const getSkill = require("./getSkill");
const getRepositoryBranches = require("./getRepositoryBranches");
const getRepositoryTree = require("./getRepositoryTree");
const getRepositoryFile = require("./getRepositoryFile");
const listDeploys = require("./listDeploys");
const listActiveDeploys = require("./listActiveDeploys");
const listPipelines = require("./listPipelines");
const getPipelineJobs = require("./getPipelineJobs");
const getDeploy = require("./getDeploy");
const deleteDeploy = require("./deleteDeploy");
const openVscode = require("./openVscode");
const redeployEntorno = require("./redeployEntorno");
const createDeploy = require("./createDeploy");

module.exports = [
	listRepositories,
	getRepoCatalog,
	listSkills,
	getSkill,
	getRepositoryBranches,
	getRepositoryTree,
	getRepositoryFile,
	listDeploys,
	listActiveDeploys,
	listPipelines,
	getPipelineJobs,
	getDeploy,
	deleteDeploy,
	openVscode,
	redeployEntorno,
	createDeploy,
];
