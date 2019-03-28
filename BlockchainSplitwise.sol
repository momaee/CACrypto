// Please paste your contract's solidity code here
// Note that writing a contract here WILL NOT deploy it and allow you to access it from your client
// You should write and develop your contract in Remix and then, before submitting, copy and paste it here
pragma solidity >=0.4.22 <0.6.0;

contract BlockchainSplitwise {

    struct User {
        string name;
        mapping (address => uint32) myCredits;
        bool meOrOthers;
    }

    mapping (address => User) allUsers;
    address[] allUsersAddress;

    function lookup(address debtor, address creditor) public view returns (uint32 ret){
        ret = allUsers[creditor].myCredits[debtor];
    }

    function add_IOU(address creditor, uint32 amount, bool _meOrOthers) public{
        require(
            msg.sender != creditor,
            "You cant owe yourself!!."
        );
        if(!already_exist(creditor))
            allUsersAddress.push(creditor);
        if(!already_exist(msg.sender))
            allUsersAddress.push(msg.sender);

        allUsers[creditor].myCredits[msg.sender] = amount;
        allUsers[creditor].meOrOthers = _meOrOthers;
        allUsers[msg.sender].meOrOthers = _meOrOthers;
    }

    function already_exist(address adr) internal view returns (bool) {
        for(uint i=0; i<allUsersAddress.length; i++)
            if(allUsersAddress[i] == adr)
                return true;
        return false;
    }

    function get_all_users() public view returns (address[] memory) {
        return allUsersAddress;
    }
}
