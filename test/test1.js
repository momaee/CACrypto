const BCSplitwise = artifacts.require("BlockchainSplitwise");

var splitwise = null;
contract('BlockchainSplitwise contract test', function(accounts) {

  it("test 1", function() {
    return BCSplitwise.deployed().then(function(instance) {
        splitwise = instance;
        console.log("instance address is:", splitwise.address);
        return splitwise.add_IOU(accounts[1],30,true,{from:accounts[0], gas:3e6});
    }).then(function(r){
        console.log("add_IOU test 1", r);
        return splitwise.lookup.call(accounts[0], accounts[1]);
    }).then(function(r){
        console.log("lookup test 1, must print 30 ", r.toNumber());
        return splitwise.add_IOU(accounts[2],40,true,{from:accounts[0], gas:3e6});
    }).then(function(r){
        console.log("add_IOU test 2", r);
        return splitwise.lookup.call(accounts[0], accounts[2]);
    }).then(function(r){
        console.log("lookup test 2, must print 40 ", r.toNumber());
        return splitwise.lookup.call(accounts[1], accounts[2]);
    }).then(function(r){
        console.log("lookup test 3, must print 0 ", r.toNumber());
        return splitwise.add_IOU(accounts[2],10,true,{from:accounts[0], gas:3e6});
    }).then(function(r){
        console.log("add_IOU test 3", r);
        return splitwise.lookup.call(accounts[0], accounts[2]);
    }).then(function(r){
        console.log("lookup test 4, must print 10 ", r.toNumber());
    });

  });

});
