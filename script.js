// =============================================================================
//                                  Config
// =============================================================================

// sets up web3.js
if (typeof web3 !== 'undefined')  {
	web3 = new Web3(web3.currentProvider);
} else {
	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

// Default account is the first one
web3.eth.defaultAccount = web3.eth.accounts[0];

// Constant we use later
var GENESIS = '0x0000000000000000000000000000000000000000000000000000000000000000';

// This is the ABI for your contract (get it from Remix, in the 'Compile' tab)
// ============================================================
var abi = [
    {
      "constant": true,
      "inputs": [
        {
          "name": "debtor",
          "type": "address"
        },
        {
          "name": "creditor",
          "type": "address"
        }
      ],
      "name": "lookup",
      "outputs": [
        {
          "name": "ret",
          "type": "uint32"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0x713584a6"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "creditor",
          "type": "address"
        },
        {
          "name": "amount",
          "type": "uint32"
        },
        {
          "name": "_meOrOthers",
          "type": "bool"
        }
      ],
      "name": "add_IOU",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function",
      "signature": "0x2a80c8e0"
    },
    {
      "constant": true,
      "inputs": [],
      "name": "get_all_users",
      "outputs": [
        {
          "name": "",
          "type": "address[]"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function",
      "signature": "0xe04070aa"
    }
  ]; // FIXME: fill this in with your contract's ABI
// ============================================================
abiDecoder.addABI(abi);
// call abiDecoder.decodeMethod to use this - see 'getAllFunctionCalls' for more

// Reads in the ABI
var BlockchainSplitwiseContractSpec = web3.eth.contract(abi);

// This is the address of the contract you want to connect to; copy this from Remix
var contractAddress = '0x3F7D26B56B66a77D5100c7BAD15D0a0208A6437B' // FIXME: fill this in with your contract's address/hash

var BlockchainSplitwise = BlockchainSplitwiseContractSpec.at(contractAddress)

// console.log('Current directory: ' + window.location.pathname);
// BCSplitwiseAbi = JSON.parse(' file:///home/mohammad/CACrypto/build/contracts/BlockchainSplitwise.json');
// BlockchainSplitwise = new web3.eth.contract(abi, {from: web3.eth.defaultAccount, gas: 3e6});


// var fs=require('fs');
// var data=fs.readFileSync('./build/contracts/BlockchainSplitwise.json', 'utf8');
// var words=JSON.parse(data);
//
// fetch('./build/contracts/BlockchainSplitwise.json').then(response => {
//   return response.json();
// }).then(data => {
//   // Work with your JSON data here..
//   console.log(data.abi);
// }).catch(err => {
//   // What do when the request fails
//   console.log('The request failed!');
// });


// =============================================================================
//                            Functions To Implement
// =============================================================================

// TODO: Add any helper functions here!

// TODO: Return a list of all users (creditors or debtors) in the system
// You can return either:
//   - a list of everyone who has ever sent or received an IOU
// OR
//   - a list of everyone currently owing or being owed money
function getUsers() {
	var allUsers = BlockchainSplitwise.get_all_users();

	graph = [];
	for(var i=0; i<allUsers.length; i++)
		for(var j=0; j<allUsers.length; j++)
			graph.push({
				debtor: allUsers[i],
				crdtor: allUsers[j],
				amount: BlockchainSplitwise.lookup(allUsers[i], allUsers[j])
			})
	log("print all graph", graph);
	return allUsers;
}

// TODO: Get the total amount owed by the user specified by 'user'
function getTotalOwed(user) {
	var totalOwed = 0;
	var allUsers = BlockchainSplitwise.get_all_users();
	for(var i=0; i<allUsers.length; i++)
		totalOwed += +(BlockchainSplitwise.lookup(user, allUsers[i]));
	return totalOwed;
}

// TODO: Get the last time this user has sent or received an IOU, in seconds since Jan. 1, 1970
// Return null if you can't find any activity for the user.
// HINT: Try looking at the way 'getAllFunctionCalls' is written. You can modify it if you'd like.
function getLastActive(user) {
	all_funcs = getAllFunctionCalls(contractAddress, "add_IOU");
	var t = 0;
	for(var i=0; i<all_funcs.length; i++){
		if((all_funcs[i]['from'] == user || all_funcs[i]['args'][0] == user) && all_funcs[i]['args'][2] == true)
			if(all_funcs[i]['time'] > t)
				t = all_funcs[i]['time'];
	}
	if(t == 0)
		t = null;
	return t;
}

// TODO: add an IOU ('I owe you') to the system
// The person you owe money is passed as 'creditor'
// The amount you owe them is passed as 'amount'
function add_IOU(creditor, amount) {
	var path = [];
	var lastDebt = 0;
	var newDebt = 0;
	amount = +amount;
	path = doBFS(creditor, web3.eth.defaultAccount, getNeighbors);
	log("path src creditor and dst defaultAccount", path);
	if(path == null){
		lastDebt = +(BlockchainSplitwise.lookup(web3.eth.defaultAccount,creditor));
		newDebt = lastDebt + amount;
		BlockchainSplitwise.add_IOU(creditor, newDebt, true, {gas: 3e6});
		return;
	}

	var minEdge = 0;
	for(var i=0; i<path.length-1; i++){
		if(i==0)
			minEdge = +(BlockchainSplitwise.lookup(path[i],path[i+1]));

		if(+(BlockchainSplitwise.lookup(path[i],path[i+1])) < minEdge)
			minEdge = +(BlockchainSplitwise.lookup(path[i],path[i+1]));
	}

	if(minEdge < amount){
		for(var i=0; i<path.length-1; i++){
			lastDebt = +(BlockchainSplitwise.lookup(path[i],path[i+1]));
			newDebt = lastDebt - minEdge;
			BlockchainSplitwise.add_IOU(path[i+1], newDebt, false, {from: path[i], gas: 3e6});
		}
		lastDebt = amount;
		newDebt = lastDebt - minEdge;
		BlockchainSplitwise.add_IOU(creditor, newDebt, true, {gas: 3e6});

	}else {
		for(var i=0; i<path.length-1; i++){
			lastDebt = +(BlockchainSplitwise.lookup(path[i],path[i+1]));
			newDebt = lastDebt - amount;
			BlockchainSplitwise.add_IOU(path[i+1], newDebt, false, {from: path[i], gas: 3e6});
		}
		lastDebt = amount;
		newDebt = lastDebt - amount;
		BlockchainSplitwise.add_IOU(creditor, newDebt, true, {gas: 3e6});
	}

}

// =============================================================================
//                              Provided Functions
// =============================================================================
// Reading and understanding these should help you implement the above

// This searches the block history for all calls to 'functionName' (string) on the 'addressOfContract' (string) contract
// It returns an array of objects, one for each call, containing the sender ('from') and arguments ('args')
function getAllFunctionCalls(addressOfContract, functionName) {
	var curBlock = web3.eth.blockNumber;
	var function_calls = [];
	while (curBlock !== GENESIS) {
	  var b = web3.eth.getBlock(curBlock, true);
	  var txns = b.transactions;
	  var blockTime = b.timestamp;
	  for (var j = 0; j < txns.length; j++) {
	  	var txn = txns[j];
	  	// check that destination of txn is our contract
	  	if (txn.to === addressOfContract) {
	  		var func_call = abiDecoder.decodeMethod(txn.input);
	  		// check that the function getting called in this txn is 'functionName'
	  		if (func_call && func_call.name === functionName) {
	  			var args = func_call.params.map(function (x) {return x.value});
	  			function_calls.push({
	  				from: txn.from,
	  				args: args,
					time: blockTime
	  			})
	  		}
	  	}
	  }
	  curBlock = b.parentHash;
	}
	return function_calls;
}

// We've provided a breadth-first search implementation for you, if that's useful
// It will find a path from start to end (or return null if none exists)
// You just need to pass in a function ('getNeighbors') that takes a node (string) and returns its neighbors (as an array)
function doBFS(start, end, getNeighbors) {
	var queue = [[start]];
	while (queue.length > 0) {
		var cur = queue.shift();
		var lastNode = cur[cur.length-1]
		if (lastNode === end) {
			return cur;
		} else {
			var neighbors = getNeighbors(lastNode);
			for (var i = 0; i < neighbors.length; i++) {
				queue.push(cur.concat([neighbors[i]]));
			}
		}
	}
	return null;
}

function getNeighbors(user){
	var neighbors = [];
	var allUsers = BlockchainSplitwise.get_all_users();

	for(var i=0; i<allUsers.length; i++){
		if(BlockchainSplitwise.lookup(user, allUsers[i]) != 0)
			neighbors.push(allUsers[i])
	}
	return neighbors;
}
// =============================================================================
//                                      UI
// =============================================================================

// This code updates the 'My Account' UI with the results of your functions
$("#total_owed").html("$"+getTotalOwed(web3.eth.defaultAccount));
$("#last_active").html(timeConverter(getLastActive(web3.eth.defaultAccount)));
$("#myaccount").change(function() {
	web3.eth.defaultAccount = $(this).val();
	$("#total_owed").html("$"+getTotalOwed(web3.eth.defaultAccount));
	$("#last_active").html(timeConverter(getLastActive(web3.eth.defaultAccount)))
});

// Allows switching between accounts in 'My Account' and the 'fast-copy' in 'Address of person you owe
var opts = web3.eth.accounts.map(function (a) { return '<option value="'+a+'">'+a+'</option>' })
$(".account").html(opts);
$(".wallet_addresses").html(web3.eth.accounts.map(function (a) { return '<li>'+a+'</li>' }))

// This code updates the 'Users' list in the UI with the results of your function
$("#all_users").html(getUsers().map(function (u,i) { return "<li>"+u+"</li>" }));

// This runs the 'add_IOU' function when you click the button
// It passes the values from the two inputs above
$("#addiou").click(function() {
  add_IOU($("#creditor").val(), $("#amount").val());
  window.location.reload(true); // refreshes the page after
});

// This is a log function, provided if you want to display things to the page instead of the JavaScript console
// Pass in a description of what you're printing, and then the object to print
function log(description, obj) {
	$("#log").html($("#log").html() + description + ": " + JSON.stringify(obj, null, 2) + "\n\n");
}
