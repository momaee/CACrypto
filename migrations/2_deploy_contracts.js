const BlockchainSplitwise = artifacts.require("BlockchainSplitwise");

module.exports = function(deployer) {
	console.log("migrations deploying...");
	deployer.deploy(BlockchainSplitwise).then(function() {
	    console.log("BlockchainSplitwise ADDRESS: " + BlockchainSplitwise.address);
	    console.log("\n\n----------------\nDEPLOYMENT DONE!\n----------------\n\n");
  });
};
