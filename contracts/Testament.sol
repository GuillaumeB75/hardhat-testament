// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "./Ownable.sol";

contract Testament is Ownable {
    using Address for address payable;

    mapping(address => uint256) private _beneficiaryBalance;
    address private _doctor;
    bool private _isDead;

    event withdrewHeritage(address indexed beneficiary, uint256 amount);
    event bequeathed(address indexed recipient, uint256 amount);
    event doctorSwapped(address indexed doctor);
    event dead(bool isdead);
    event setup(address indexed owner, address indexed doctor);

    constructor(address owner_, address doctor_) Ownable(owner_) {
        require(owner_ != doctor_, "Testament: owner can not be the doctor");
        _doctor = doctor_;
        emit setup(owner_, doctor_);
    }

    modifier onlyDoctor() {
        require(msg.sender == _doctor, "Testament: You can not call this function you are not the doctor");
        _;
    }

    function pronouncedDead() public onlyDoctor {
        require(_isDead == false, "Testament: the Owner is already in Heaven or not.");
        _isDead = true;
        emit dead(_isDead);
    }

    function withdrawHeritage() public {
        require(_isDead == true, "Testament: The person is not dead yet");
        require(_beneficiaryBalance[msg.sender] > 0, "Testament : can not withdraw 0 ether");
        uint256 amount = _beneficiaryBalance[msg.sender];
        _beneficiaryBalance[msg.sender] = 0;
        payable(msg.sender).sendValue(amount);
        emit withdrewHeritage(msg.sender, amount);
    }

    function bequeath(address account) public payable onlyOwner {
        require(account != address(0), "Testament: transfer to zero address");
        require(_isDead != true, "Testament: the owner is dead you can not bequeath to anyone anymore");
        _beneficiaryBalance[account] += msg.value;
        emit bequeathed(account, msg.value);
    }

    function changeDoctor(address newDoctor) public onlyOwner {
        require(msg.sender != newDoctor, "Testament: Owner can not be set as doctor");
        require(newDoctor != address(0), "Testament: cannot be the zero address");
        _doctor = newDoctor;
        emit doctorSwapped(newDoctor);
    }

    function doctor() public view returns (address) {
        return _doctor;
    }

    function isDeceased() public view returns (bool) {
        return _isDead;
    }

    function addressHeritageBalance(address recipient) public view returns (uint256) {
        return _beneficiaryBalance[recipient];
    }
}
