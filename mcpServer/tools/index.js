const listRepositories = require("./listRepositories");
const getRepositoryBranches = require("./getRepositoryBranches");
const getRepositoryTree = require("./getRepositoryTree");
const getRepositoryFile = require("./getRepositoryFile");
const listDeploys = require("./listDeploys");
const getDeploy = require("./getDeploy");
const deleteDeploy = require("./deleteDeploy");
const openVscode = require("./openVscode");
const redeployEntorno = require("./redeployEntorno");
const createDeploy = require("./createDeploy");

module.exports = [
	listRepositories,
	getRepositoryBranches,
	getRepositoryTree,
	getRepositoryFile,
	listDeploys,
	getDeploy,
	deleteDeploy,
	openVscode,
	redeployEntorno,
	createDeploy,
];
