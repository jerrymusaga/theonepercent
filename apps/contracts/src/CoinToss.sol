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
    uint256 public constant POOL_MULTIPLIER = 100; // 1x multiplier (100/100) - fair 1:1 ratio
    uint256 public constant MAX_STAKE_ALLOWED = 50 ether; // Cap at 50 CELO maximum stake
    uint256 public constant PENALTY_PERCENTAGE = 30;
    uint256 public constant CREATOR_REWARD_PERCENTAGE = 5;
    
    event PoolCreated(uint256 indexed poolId, address indexed creator, uint256 entryFee, uint256 maxPlayers);
    event PlayerJoined(uint256 indexed poolId, address indexed player, uint256 currentPlayers, uint256 maxPlayers);
    event PoolActivated(uint256 indexed poolId, uint256 totalPlayers, uint256 prizePool);
    event PlayerMadeChoice(uint256 indexed poolId, address indexed player, PlayerChoice choice, uint256 round);
    event RoundResolved(uint256 indexed poolId, uint256 round, PlayerChoice winningChoice, uint256 eliminatedCount, uint256 remainingCount);
    event GameCompleted(uint256 indexed poolId, address indexed winner, uint256 prizeAmount);
    event PoolAbandoned(uint256 indexed poolId, address indexed creator, uint256 refundAmount);
    event StakeDeposited(address indexed creator, uint256 amount, uint256 poolsEligible);
    event StakeWithdrawn(address indexed creator, uint256 amount, uint256 penalty);
    event CreatorRewardClaimed(address indexed creator, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    function stakeForPoolCreation() external payable {
        require(msg.value >= BASE_STAKE, "Minimum stake is 5 CELO");
        require(msg.value <= MAX_STAKE_ALLOWED, "Maximum stake is 50 CELO");
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
        require(stakeAmount >= BASE_STAKE, "Stake amount too low");
        
        // Formula: pools = (stakeAmount / BASE_STAKE) * POOL_MULTIPLIER / 100
        // Examples with 1x multiplier and 50 CELO stake cap:
        // 5 CELO: (5/5) * 1.0 = 1 pool
        // 10 CELO: (10/5) * 1.0 = 2 pools
        // 15 CELO: (15/5) * 1.0 = 3 pools  
        // 25 CELO: (25/5) * 1.0 = 5 pools
        // 50 CELO: (50/5) * 1.0 = 10 pools (maximum allowed)
        
        uint256 baseUnits = stakeAmount / BASE_STAKE;
        uint256 totalPools = (baseUnits * POOL_MULTIPLIER) / 100;
        
        return totalPools;
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
    
    function joinPool(uint256 _poolId) external payable nonReentrant {
        Pool storage pool = pools[_poolId];
        
        // Enhanced validation
        require(pool.id != 0, "Pool does not exist");
        require(pool.status == PoolStatus.OPENED, "Pool is not open for joining");
        require(msg.value == pool.entryFee, "Incorrect entry fee");
        require(pool.currentPlayers < pool.maxPlayers, "Pool is full");
        require(!pool.hasJoined[msg.sender], "Already joined this pool");
        require(msg.sender != pool.creator, "Pool creator cannot join their own pool");
        
        // Update player state
        pool.hasJoined[msg.sender] = true;
        pool.players.push(msg.sender);
        pool.currentPlayers++;
        pool.prizePool += msg.value;
        
        // Initialize player game state
        pool.playerChoices[msg.sender] = PlayerChoice.NONE;
        pool.isEliminated[msg.sender] = false;
        
        emit PlayerJoined(_poolId, msg.sender, pool.currentPlayers, pool.maxPlayers);
        
        // Check if pool should be activated
        _checkPoolActivation(_poolId);
    }
    
    function _checkPoolActivation(uint256 _poolId) internal {
        Pool storage pool = pools[_poolId];
        
        // Require at least 50% capacity OR full capacity
        uint256 minPlayersRequired = (pool.maxPlayers + 1) / 2; // Rounds up for 50%
        
        if (pool.currentPlayers >= minPlayersRequired && 
            (pool.currentPlayers == pool.maxPlayers || canActivatePool(_poolId))) {
            
            // Activate the pool
            pool.status = PoolStatus.ACTIVE;
            pool.currentRound = 1;
            
            // Initialize remaining players for the game
            pool.remainingPlayers = pool.players;
            
            emit PoolActivated(_poolId, pool.currentPlayers, pool.prizePool);
        }
    }
    
    function canActivatePool(uint256 _poolId) public view returns (bool) {
        Pool storage pool = pools[_poolId];
        uint256 minPlayersRequired = (pool.maxPlayers + 1) / 2;
        
        return pool.currentPlayers >= minPlayersRequired && 
               pool.status == PoolStatus.OPENED;
    }
    
    function activatePool(uint256 _poolId) external {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.OPENED, "Pool is not open");
        require(canActivatePool(_poolId), "Pool doesn't meet activation requirements");
        require(msg.sender == pool.creator || msg.sender == owner(), "Only pool creator or owner can activate");
        
        // Manual activation by pool creator or contract owner if 50% threshold met
        _checkPoolActivation(_poolId);
    }
    
    function makeSelection(uint256 _poolId, PlayerChoice _choice) external {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.ACTIVE, "Pool is not active");
        require(pool.status != PoolStatus.ABANDONED, "Pool has been abandoned");
        require(_choice == PlayerChoice.HEADS || _choice == PlayerChoice.TAILS, "Invalid choice");
        require(!pool.isEliminated[msg.sender], "Player is eliminated");
        require(pool.hasJoined[msg.sender], "Player not in this pool");
        require(pool.playerChoices[msg.sender] == PlayerChoice.NONE, "Choice already made this round");
        
        pool.playerChoices[msg.sender] = _choice;
        
        emit PlayerMadeChoice(_poolId, msg.sender, _choice, pool.currentRound);
        
        // Auto-resolve round if all players have chosen
        if (_allPlayersChosen(_poolId)) {
            _executeRound(_poolId);
        }
    }
    
    function _executeRound(uint256 _poolId) internal {
        Pool storage pool = pools[_poolId];
        
        // Count choices
        (uint256 headsCount, uint256 tailsCount, address[] memory headsPlayers, address[] memory tailsPlayers) = _countChoices(_poolId);
        
        PlayerChoice winningChoice;
        address[] memory winners;
        address[] memory losers;
        
        if (headsCount < tailsCount) {
            // Heads minority wins
            winningChoice = PlayerChoice.HEADS;
            winners = headsPlayers;
            losers = tailsPlayers;
        } else if (tailsCount < headsCount) {
            // Tails minority wins  
            winningChoice = PlayerChoice.TAILS;
            winners = tailsPlayers;
            losers = headsPlayers;
        } else {
            // Tie - use blockhash to decide
            winningChoice = _resolvetie(_poolId);
            if (winningChoice == PlayerChoice.HEADS) {
                winners = headsPlayers;
                losers = tailsPlayers;
            } else {
                winners = tailsPlayers;
                losers = headsPlayers;
            }
        }
        
        // Eliminate losers
        for (uint256 i = 0; i < losers.length; i++) {
            pool.isEliminated[losers[i]] = true;
        }
        
        // Update remaining players
        pool.remainingPlayers = winners;
        
        // Reset choices for next round
        _resetPlayerChoices(_poolId);
        
        emit RoundResolved(_poolId, pool.currentRound, winningChoice, losers.length, winners.length);
        
        // Check if game is complete
        if (winners.length == 1) {
            pool.status = PoolStatus.COMPLETED;
            emit GameCompleted(_poolId, winners[0], _calculateWinnerPrize(_poolId));
        } else {
            pool.currentRound++;
        }
    }
    
    function _allPlayersChosen(uint256 _poolId) internal view returns (bool) {
        Pool storage pool = pools[_poolId];
        for (uint256 i = 0; i < pool.remainingPlayers.length; i++) {
            address player = pool.remainingPlayers[i];
            if (pool.playerChoices[player] == PlayerChoice.NONE) {
                return false;
            }
        }
        return true;
    }
    
    function _countChoices(uint256 _poolId) internal view returns (
        uint256 headsCount, 
        uint256 tailsCount,
        address[] memory headsPlayers,
        address[] memory tailsPlayers
    ) {
        Pool storage pool = pools[_poolId];
        
        // First pass - count
        for (uint256 i = 0; i < pool.remainingPlayers.length; i++) {
            address player = pool.remainingPlayers[i];
            if (pool.playerChoices[player] == PlayerChoice.HEADS) {
                headsCount++;
            } else if (pool.playerChoices[player] == PlayerChoice.TAILS) {
                tailsCount++;
            }
        }
        
        // Initialize arrays
        headsPlayers = new address[](headsCount);
        tailsPlayers = new address[](tailsCount);
        
        // Second pass - populate arrays
        uint256 headsIndex = 0;
        uint256 tailsIndex = 0;
        
        for (uint256 i = 0; i < pool.remainingPlayers.length; i++) {
            address player = pool.remainingPlayers[i];
            if (pool.playerChoices[player] == PlayerChoice.HEADS) {
                headsPlayers[headsIndex] = player;
                headsIndex++;
            } else if (pool.playerChoices[player] == PlayerChoice.TAILS) {
                tailsPlayers[tailsIndex] = player;
                tailsIndex++;
            }
        }
    }
    
    function _resolvetie(uint256 _poolId) internal view returns (PlayerChoice) {
        // Use blockhash for randomness in tie situations
        uint256 randomValue = uint256(keccak256(abi.encodePacked(block.prevrandao, _poolId, block.timestamp)));
        return (randomValue % 2 == 0) ? PlayerChoice.HEADS : PlayerChoice.TAILS;
    }
    
    function _resetPlayerChoices(uint256 _poolId) internal {
        Pool storage pool = pools[_poolId];
        for (uint256 i = 0; i < pool.remainingPlayers.length; i++) {
            pool.playerChoices[pool.remainingPlayers[i]] = PlayerChoice.NONE;
        }
    }
    
    function _calculateWinnerPrize(uint256 _poolId) internal view returns (uint256) {
        Pool storage pool = pools[_poolId];
        uint256 creatorFee = (pool.prizePool * CREATOR_REWARD_PERCENTAGE) / 100;
        return pool.prizePool - creatorFee;
    }
    
    function claimPrize(uint256 _poolId) external nonReentrant {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.COMPLETED, "Pool is not completed");
        require(pool.remainingPlayers.length == 1, "No clear winner");
        require(pool.remainingPlayers[0] == msg.sender, "Only winner can claim prize");
        
        uint256 prize = _calculateWinnerPrize(_poolId);
        pool.prizePool = 0; // Prevent double claiming
        
        payable(msg.sender).transfer(prize);
    }
    
    function unstakeAndClaim() external nonReentrant {
        PoolCreator storage creator = poolCreators[msg.sender];
        require(creator.hasActiveStake, "No active stake");
        
        bool allPoolsCompleted = areAllPoolsCompleted(msg.sender);
        
        if (!allPoolsCompleted) {
            // Handle early unstaking - abandon incomplete pools and refund players
            _abandonCreatorPools(msg.sender);
            
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
    
    function _abandonCreatorPools(address _creator) internal {
        PoolCreator storage creator = poolCreators[_creator];
        
        for (uint256 i = 0; i < creator.createdPoolIds.length; i++) {
            uint256 poolId = creator.createdPoolIds[i];
            Pool storage pool = pools[poolId];
            
            if (pool.status == PoolStatus.OPENED) {
                // Safe to abandon - no active gameplay yet
                pool.status = PoolStatus.ABANDONED;
                _refundPoolPlayers(poolId);
                emit PoolAbandoned(poolId, _creator, pool.prizePool);
                
            } else if (pool.status == PoolStatus.ACTIVE) {
                // CRITICAL: Pool has active gameplay - DO NOT abandon
                // Instead, transfer pool ownership to contract for completion
                pool.creator = address(this); // Contract becomes the "creator"
                
                emit PoolAbandoned(poolId, _creator, 0); // Signal creator abandoned, but pool continues
            }
        }
    }
    
    function _refundPoolPlayers(uint256 _poolId) internal {
        Pool storage pool = pools[_poolId];
        
        // Refund all players their entry fees
        for (uint256 i = 0; i < pool.players.length; i++) {
            address player = pool.players[i];
            if (pool.hasJoined[player]) {
                payable(player).transfer(pool.entryFee);
            }
        }
        
        // Reset prize pool to 0 after refunds
        pool.prizePool = 0;
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
            
            // Only give rewards if creator still owns the pool
            if (pool.status == PoolStatus.COMPLETED && pool.creator == _creator) {
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
    
    function getRemainingPlayers(uint256 _poolId) external view returns (address[] memory) {
        return pools[_poolId].remainingPlayers;
    }
    
    function getCurrentRound(uint256 _poolId) external view returns (uint256) {
        return pools[_poolId].currentRound;
    }
    
    function getPlayerChoice(uint256 _poolId, address _player) external view returns (PlayerChoice) {
        return pools[_poolId].playerChoices[_player];
    }
    
    function hasPlayerChosen(uint256 _poolId, address _player) external view returns (bool) {
        return pools[_poolId].playerChoices[_player] != PlayerChoice.NONE;
    }
    
    function isPlayerEliminated(uint256 _poolId, address _player) external view returns (bool) {
        return pools[_poolId].isEliminated[_player];
    }
    
    function getGameProgress(uint256 _poolId) external view returns (
        uint256 currentRound,
        uint256 remainingPlayersCount,
        uint256 totalPlayersCount,
        bool isGameComplete
    ) {
        Pool storage pool = pools[_poolId];
        return (
            pool.currentRound,
            pool.remainingPlayers.length,
            pool.currentPlayers,
            pool.status == PoolStatus.COMPLETED
        );
    }
    
    function claimRefundFromAbandonedPool(uint256 _poolId) external nonReentrant {
        Pool storage pool = pools[_poolId];
        require(pool.status == PoolStatus.ABANDONED, "Pool is not abandoned");
        require(pool.hasJoined[msg.sender], "Not a participant in this pool");
        require(pool.prizePool > 0, "Pool has no funds to refund");
        
        // Mark player as having been refunded to prevent double claims
        pool.hasJoined[msg.sender] = false;
        
        payable(msg.sender).transfer(pool.entryFee);
        
        // Reduce prize pool by refunded amount
        pool.prizePool -= pool.entryFee;
    }
    
    function isPoolAbandoned(uint256 _poolId) external view returns (bool) {
        return pools[_poolId].status == PoolStatus.ABANDONED;
    }
    
    function withdrawAbandonedPoolFees() external onlyOwner {
        // Owner can withdraw creator fees from pools that were transferred to contract
        uint256 totalFees = 0;
        
        // This would require tracking transferred pools, but for now we'll keep it simple
        // In practice, fees from contract-owned completed pools would accumulate
        
        if (totalFees > 0) {
            payable(owner()).transfer(totalFees);
        }
    }
    
    function getPoolOriginalCreator(uint256 _poolId) external view returns (address) {
        // This would require additional storage to track original creators
        // For now, we return the current creator
        return pools[_poolId].creator;
    }
}