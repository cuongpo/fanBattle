// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FanClubFactory is Ownable {
    enum FanType { CITY, PSG, ARS }

    struct FanClub {
        string name;
        string description;
        FanType fanType;
        address tokenAddress;
        string image;       // IPFS link for the fan club image
        uint256 totalShares;
        uint256 sharePrice; // Calculated as (totalShares^2) / 400
        address creator;
        mapping(address => uint256) sharesOwned;
        address[] shareholders; // List of users who own shares
    }

    // FanType to ERC20 token address mapping
    mapping(FanType => address) public fanTypeTokens;

    // Array to store all fan clubs
    FanClub[] public fanClubs;

    event FanClubCreated(uint256 indexed clubId, string name, FanType fanType, address creator, string image);
    event SharesBought(uint256 indexed clubId, address buyer, uint256 amount, uint256 price);
    event SharesSold(uint256 indexed clubId, address seller, uint256 amount, uint256 price);
    event FanTypeTokenUpdated(FanType fanType, address tokenAddress);

    // Constructor that passes the initial owner to the Ownable contract
    constructor() Ownable(msg.sender) {}

    // Set the ERC20 token address for a specific FanType
    function setFanTypeToken(FanType _fanType, address _tokenAddress) external onlyOwner {
        require(_tokenAddress != address(0), "Invalid token address");
        fanTypeTokens[_fanType] = _tokenAddress;
        emit FanTypeTokenUpdated(_fanType, _tokenAddress);
    }

    // Create a new fan club with an image (IPFS link)
    function createFanClub(
        string memory _name,
        string memory _description,
        FanType _fanType,
        string memory _image // IPFS link for the image
    ) external {
        address tokenAddr = fanTypeTokens[_fanType];
        require(tokenAddr != address(0), "Token for FanType not set");

        IERC20 fanToken = IERC20(tokenAddr);
        require(fanToken.balanceOf(msg.sender) >= 10 * (10 ** 18), "Insufficient fan tokens");

        // Transfer 10 fan tokens from the user to the contract (burning)
        bool success = fanToken.transferFrom(msg.sender, address(this), 10 * (10 ** 18));
        require(success, "Token transfer failed");

        // Create a new FanClub with the provided image link
        FanClub storage newClub = fanClubs.push();
        newClub.name = _name;
        newClub.description = _description;
        newClub.fanType = _fanType;
        newClub.tokenAddress = tokenAddr;
        newClub.image = _image;  // Store the IPFS link
        newClub.totalShares = 0;
        newClub.sharePrice = 0;
        newClub.creator = msg.sender;

        emit FanClubCreated(fanClubs.length - 1, _name, _fanType, msg.sender, _image);
    }

    // Buy shares of a specific fan club
    function buyShares(uint256 _clubId, uint256 _amount) external {
        require(_clubId < fanClubs.length, "FanClub does not exist");
        require(_amount > 0, "Amount must be greater than zero");

        FanClub storage club = fanClubs[_clubId];
        address tokenAddr = club.tokenAddress;
        IERC20 fanToken = IERC20(tokenAddr);

        uint256 totalPrice = calculatePrice(club.totalShares + _amount);
        require(fanToken.balanceOf(msg.sender) >= totalPrice, "Insufficient tokens to buy shares");

        // Transfer tokens from buyer to the contract
        bool success = fanToken.transferFrom(msg.sender, address(this), totalPrice);
        require(success, "Token transfer failed");

        // Update share information
        club.totalShares += _amount;
        club.sharePrice = calculatePrice(club.totalShares);

        // Check if user is a new shareholder
        if (club.sharesOwned[msg.sender] == 0) {
            club.shareholders.push(msg.sender);
        }

        club.sharesOwned[msg.sender] += _amount;

        emit SharesBought(_clubId, msg.sender, _amount, totalPrice);
    }

    // Sell shares of a specific fan club
    function sellShares(uint256 _clubId, uint256 _amount) external {
        require(_clubId < fanClubs.length, "FanClub does not exist");
        require(_amount > 0, "Amount must be greater than zero");

        FanClub storage club = fanClubs[_clubId];
        require(club.sharesOwned[msg.sender] >= _amount, "Not enough shares to sell");

        address tokenAddr = club.tokenAddress;
        IERC20 fanToken = IERC20(tokenAddr);

        uint256 totalPrice = calculatePrice(club.totalShares) - calculatePrice(club.totalShares - _amount);
        require(fanToken.balanceOf(address(this)) >= totalPrice, "Contract has insufficient tokens");

        // Transfer tokens from the contract to the seller
        bool success = fanToken.transfer(msg.sender, totalPrice);
        require(success, "Token transfer failed");

        // Update share information
        club.totalShares -= _amount;
        club.sharePrice = calculatePrice(club.totalShares);
        club.sharesOwned[msg.sender] -= _amount;

        // If user has sold all shares, remove from shareholders list
        if (club.sharesOwned[msg.sender] == 0) {
            removeShareholder(_clubId, msg.sender);
        }

        emit SharesSold(_clubId, msg.sender, _amount, totalPrice);
    }

    // Remove shareholder from the list when they have zero shares
    function removeShareholder(uint256 _clubId, address _shareholder) internal {
        FanClub storage club = fanClubs[_clubId];
        uint256 length = club.shareholders.length;

        for (uint256 i = 0; i < length; i++) {
            if (club.shareholders[i] == _shareholder) {
                club.shareholders[i] = club.shareholders[length - 1];
                club.shareholders.pop();
                break;
            }
        }
    }

    // Calculate the price based on the number of shares
    function calculatePrice(uint256 _shares) public pure returns (uint256) {
        return (_shares * _shares) / 400;
    }

    // Get the list of all users who have at least 1 share of the specified fan club
    function getShareholders(uint256 _clubId) external view returns (address[] memory, uint256[] memory) {
        require(_clubId < fanClubs.length, "FanClub does not exist");

        FanClub storage club = fanClubs[_clubId];
        uint256 numShareholders = club.shareholders.length;
        address[] memory shareholders = new address[](numShareholders);
        uint256[] memory shares = new uint256[](numShareholders);

        for (uint256 i = 0; i < numShareholders; i++) {
            address shareholder = club.shareholders[i];
            shareholders[i] = shareholder;
            shares[i] = club.sharesOwned[shareholder];
        }

        return (shareholders, shares);
    }
}
