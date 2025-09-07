// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CoinToss is Ownable, ReentrancyGuard {
    
    enum PlayerChoice { NONE, HEADS, TAILS }
    enum PoolStatus { OPENED, ACTIVE, COMPLETED, ABANDONED }
    
    struct Pool {
        uint256 id;
        address creator;
        uint256 entryFee;
        uint256 maxPlayers;
        uint256 currentPlayers;
        uint256 prizePool;
        PoolStatus status;
        uint256 createdAt;
        address[] players;
        mapping(address => bool) hasJoined;
        mapping(address => PlayerChoice) playerChoices;
        mapping(address => bool) isEliminated;
        uint256 currentRound;
        address[] remainingPlayers;
    }
    
    struct PoolCreator {
        uint256 stakedAmount;
        uint256 poolsCreated;
        uint256 poolsRemaining;
        uint256 totalPools;
        bool hasActiveStake;
        uint256 stakedAt;
        uint256[] createdPoolIds;
    }
    
    mapping(uint256 => Pool) public pools;
    mapping(address => PoolCreator) public poolCreators;
    
    uint256 public currentPoolId;
    uint256 public constant BASE_STAKE = 5 ether; // 5 CELO
    uint256 public constant PENALTY_PERCENTAGE = 30;
    uint256 public constant CREATOR_REWARD_PERCENTAGE = 5;
    
    event PoolCreated(uint256 indexed poolId, address indexed creator, uint256 entryFee, uint256 maxPlayers);
    event PlayerJoined(uint256 indexed poolId, address indexed player);
    event StakeDeposited(address indexed creator, uint256 amount, uint256 poolsEligible);
    event StakeWithdrawn(address indexed creator, uint256 amount, uint256 penalty);
    event CreatorRewardClaimed(address indexed creator, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    function stakeForPoolCreation() external payable {
        require(msg.value >= BASE_STAKE, "Minimum stake is 5 CELO");
        require(!poolCreators[msg.sender].hasActiveStake, "Already has active stake");
        
        uint256 poolsEligible = calculatePoolsEligible(msg.value);
        
        poolCreators[msg.sender] = PoolCreator({
            stakedAmount: msg.value,
            poolsCreated: 0,
            poolsRemaining: poolsEligible,
            totalPools: poolsEligible,
            hasActiveStake: true,
            stakedAt: block.timestamp,
            createdPoolIds: new uint256[](0)
        });
        
        emit StakeDeposited(msg.sender, msg.value, poolsEligible);
    }
    
    function calculatePoolsEligible(uint256 stakeAmount) public pure returns (uint256) {
        if (stakeAmount >= 10 ether) {
            return 6;
        } else if (stakeAmount >= 5 ether) {
            return 2;
        }
        return 0;
    }
    
    function createPool(uint256 _entryFee, uint256 _maxPlayers) external {
        require(poolCreators[msg.sender].hasActiveStake, "Must stake CELO to create pools");
        require(poolCreators[msg.sender].poolsRemaining > 0, "No remaining pools available");
        require(_entryFee > 0, "Entry fee must be greater than 0");
        require(_maxPlayers >= 2, "Pool must have at least 2 players");
        
        currentPoolId++;
        
        Pool storage newPool = pools[currentPoolId];
        newPool.id = currentPoolId;
        newPool.creator = msg.sender;
        newPool.entryFee = _entryFee;
        newPool.maxPlayers = _maxPlayers;
        newPool.currentPlayers = 0;
        newPool.prizePool = 0;
        newPool.status = PoolStatus.OPENED;
        newPool.createdAt = block.timestamp;
        newPool.currentRound = 0;
        
        poolCreators[msg.sender].poolsCreated++;
        poolCreators[msg.sender].poolsRemaining--;
        poolCreators[msg.sender].createdPoolIds.push(currentPoolId);
        
        emit PoolCreated(currentPoolId, msg.sender, _entryFee, _maxPlayers);
    }
    
    function joinPool(uint256 _poolId) external payable {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.OPENED, "Pool is not open for joining");
        require(msg.value == pool.entryFee, "Incorrect entry fee");
        require(pool.currentPlayers < pool.maxPlayers, "Pool is full");
        require(!pool.hasJoined[msg.sender], "Already joined this pool");
        
        pool.hasJoined[msg.sender] = true;
        pool.players.push(msg.sender);
        pool.currentPlayers++;
        pool.prizePool += msg.value;
        
        if (pool.currentPlayers == pool.maxPlayers) {
            pool.status = PoolStatus.ACTIVE;
            pool.remainingPlayers = pool.players;
        }
        
        emit PlayerJoined(_poolId, msg.sender);
    }
    
    function unstakeAndClaim() external nonReentrant {
        PoolCreator storage creator = poolCreators[msg.sender];
        require(creator.hasActiveStake, "No active stake");
        
        bool allPoolsCompleted = areAllPoolsCompleted(msg.sender);
        
        if (!allPoolsCompleted) {
            uint256 penalty = (creator.stakedAmount * PENALTY_PERCENTAGE) / 100;
            uint256 returnAmount = creator.stakedAmount - penalty;
            
            creator.hasActiveStake = false;
            creator.stakedAmount = 0;
            creator.poolsRemaining = 0;
            
            payable(owner()).transfer(penalty);
            payable(msg.sender).transfer(returnAmount);
            
            emit StakeWithdrawn(msg.sender, returnAmount, penalty);
        } else {
            uint256 totalReward = calculateCreatorReward(msg.sender);
            uint256 returnAmount = creator.stakedAmount + totalReward;
            
            creator.hasActiveStake = false;
            creator.stakedAmount = 0;
            creator.poolsRemaining = 0;
            
            payable(msg.sender).transfer(returnAmount);
            
            emit StakeWithdrawn(msg.sender, returnAmount, 0);
            emit CreatorRewardClaimed(msg.sender, totalReward);
        }
    }
    
    function areAllPoolsCompleted(address _creator) public view returns (bool) {
        PoolCreator storage creator = poolCreators[_creator];
        
        for (uint256 i = 0; i < creator.createdPoolIds.length; i++) {
            uint256 poolId = creator.createdPoolIds[i];
            if (pools[poolId].status != PoolStatus.COMPLETED && 
                pools[poolId].status != PoolStatus.ABANDONED) {
                return false;
            }
        }
        return true;
    }
    
    function calculateCreatorReward(address _creator) public view returns (uint256) {
        PoolCreator storage creator = poolCreators[_creator];
        uint256 totalReward = 0;
        
        for (uint256 i = 0; i < creator.createdPoolIds.length; i++) {
            uint256 poolId = creator.createdPoolIds[i];
            Pool storage pool = pools[poolId];
            
            if (pool.status == PoolStatus.COMPLETED) {
                totalReward += (pool.prizePool * CREATOR_REWARD_PERCENTAGE) / 100;
            }
        }
        
        return totalReward;
    }
    
    function getPoolInfo(uint256 _poolId) external view returns (
        address creator,
        uint256 entryFee,
        uint256 maxPlayers,
        uint256 currentPlayers,
        uint256 prizePool,
        PoolStatus status
    ) {
        Pool storage pool = pools[_poolId];
        return (
            pool.creator,
            pool.entryFee,
            pool.maxPlayers,
            pool.currentPlayers,
            pool.prizePool,
            pool.status
        );
    }
    
    function getCreatorInfo(address _creator) external view returns (
        uint256 stakedAmount,
        uint256 poolsCreated,
        uint256 poolsRemaining,
        bool hasActiveStake
    ) {
        PoolCreator storage creator = poolCreators[_creator];
        return (
            creator.stakedAmount,
            creator.poolsCreated,
            creator.poolsRemaining,
            creator.hasActiveStake
        );
    }
    
    function getCreatedPools(address _creator) external view returns (uint256[] memory) {
        return poolCreators[_creator].createdPoolIds;
    }
}