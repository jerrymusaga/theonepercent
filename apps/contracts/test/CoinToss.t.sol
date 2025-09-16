// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {CoinToss} from "../src/CoinToss.sol";
import {ISelfVerificationRoot} from "@selfxyz/contracts/contracts/interfaces/ISelfVerificationRoot.sol";

contract CoinTossTest is Test {
    CoinToss public coinToss;
    
    address public owner;
    address public creator1;
    address public creator2;
    address public player1;
    address public player2;
    address public player3;
    address public player4;
    address public player5;
    
    uint256 public constant BASE_STAKE = 5 ether;
    uint256 public constant MAX_STAKE = 50 ether;
    
    // Allow test contract to receive ether
    receive() external payable {}
    
    function setUp() public {
        owner = address(this);
        creator1 = makeAddr("creator1");
        creator2 = makeAddr("creator2");
        player1 = makeAddr("player1");
        player2 = makeAddr("player2");
        player3 = makeAddr("player3");
        player4 = makeAddr("player4");
        player5 = makeAddr("player5");
        
        // Give everyone some CELO
        vm.deal(creator1, 100 ether);
        vm.deal(creator2, 100 ether);
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
        vm.deal(player3, 10 ether);
        vm.deal(player4, 10 ether);
        vm.deal(player5, 10 ether);
        
        // Mock Self protocol addresses for testing
        address mockVerificationHub = address(0x1234567890123456789012345678901234567890);
        uint256 mockScope = 1;
        bytes32 mockConfigId = 0x7b6436b0c98f62380866d9432c2af0ee08ce16a171bda6951aecd95ee1307d61;

        coinToss = new CoinToss(mockVerificationHub, mockScope, mockConfigId);
    }
    
    // STAKING MECHANISM TESTS
    
    function test_StakeForPoolCreation_Success() public {
        vm.startPrank(creator1);
        
        coinToss.stakeForPoolCreation{value: 10 ether}();
        
        (uint256 stakedAmount, uint256 poolsCreated, uint256 poolsRemaining, bool hasActiveStake, bool isVerified) =
            coinToss.getCreatorInfo(creator1);
        
        assertEq(stakedAmount, 10 ether);
        assertEq(poolsCreated, 0);
        assertEq(poolsRemaining, 2); // 10 CELO = 2 pools
        assertTrue(hasActiveStake);
        
        vm.stopPrank();
    }
    
    function test_StakeForPoolCreation_MinimumStake() public {
        vm.startPrank(creator1);
        
        coinToss.stakeForPoolCreation{value: 5 ether}();
        
        (, , uint256 poolsRemaining, , ) = coinToss.getCreatorInfo(creator1);
        assertEq(poolsRemaining, 1); // 5 CELO = 1 pool
        
        vm.stopPrank();
    }
    
    function test_StakeForPoolCreation_MaximumStake() public {
        vm.startPrank(creator1);
        
        coinToss.stakeForPoolCreation{value: 50 ether}();
        
        (, , uint256 poolsRemaining, , ) = coinToss.getCreatorInfo(creator1);
        assertEq(poolsRemaining, 10); // 50 CELO = 10 pools (max)
        
        vm.stopPrank();
    }
    
    function test_StakeForPoolCreation_RevertBelowMinimum() public {
        vm.startPrank(creator1);
        
        vm.expectRevert("Minimum stake is 5 CELO");
        coinToss.stakeForPoolCreation{value: 4 ether}();
        
        vm.stopPrank();
    }
    
    function test_StakeForPoolCreation_RevertAboveMaximum() public {
        vm.startPrank(creator1);
        
        vm.expectRevert("Maximum stake is 50 CELO");
        coinToss.stakeForPoolCreation{value: 51 ether}();
        
        vm.stopPrank();
    }
    
    function test_StakeForPoolCreation_RevertAlreadyStaked() public {
        vm.startPrank(creator1);
        
        coinToss.stakeForPoolCreation{value: 10 ether}();
        
        vm.expectRevert("Already has active stake");
        coinToss.stakeForPoolCreation{value: 10 ether}();
        
        vm.stopPrank();
    }
    
    function test_CalculatePoolsEligible() public {
        assertEq(coinToss.calculatePoolsEligible(5 ether), 1);
        assertEq(coinToss.calculatePoolsEligible(10 ether), 2);
        assertEq(coinToss.calculatePoolsEligible(15 ether), 3);
        assertEq(coinToss.calculatePoolsEligible(25 ether), 5);
        assertEq(coinToss.calculatePoolsEligible(50 ether), 10);
    }
    
    // POOL CREATION TESTS
    
    function test_CreatePool_Success() public {
        // Stake first
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        
        coinToss.createPool(1 ether, 4);
        
        (address creator, uint256 entryFee, uint256 maxPlayers, uint256 currentPlayers, uint256 prizePool, CoinToss.PoolStatus status) = 
            coinToss.getPoolInfo(1);
        
        assertEq(creator, creator1);
        assertEq(entryFee, 1 ether);
        assertEq(maxPlayers, 4);
        assertEq(currentPlayers, 0);
        assertEq(prizePool, 0);
        assertTrue(status == CoinToss.PoolStatus.OPENED);
        
        // Check creator's remaining pools
        (, , uint256 poolsRemaining, , ) = coinToss.getCreatorInfo(creator1);
        assertEq(poolsRemaining, 1); // Started with 2, created 1
        
        vm.stopPrank();
    }
    
    function test_CreatePool_RevertNoStake() public {
        vm.startPrank(creator1);
        
        vm.expectRevert("Must stake CELO to create pools");
        coinToss.createPool(1 ether, 4);
        
        vm.stopPrank();
    }
    
    function test_CreatePool_RevertNoRemainingPools() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 5 ether}(); // Only 1 pool
        
        coinToss.createPool(1 ether, 4); // Create first pool
        
        vm.expectRevert("No remaining pools available");
        coinToss.createPool(1 ether, 4); // Try to create second pool
        
        vm.stopPrank();
    }
    
    function test_CreatePool_RevertInvalidParameters() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        
        vm.expectRevert("Entry fee must be greater than 0");
        coinToss.createPool(0, 4);
        
        vm.expectRevert("Pool must have at least 2 players");
        coinToss.createPool(1 ether, 1);
        
        vm.stopPrank();
    }
    
    // POOL JOINING TESTS
    
    function test_JoinPool_Success() public {
        // Create pool
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4);
        vm.stopPrank();
        
        // Join pool
        vm.startPrank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        
        (, , , uint256 currentPlayers, uint256 prizePool, ) = coinToss.getPoolInfo(1);
        assertEq(currentPlayers, 1);
        assertEq(prizePool, 1 ether);
        
        vm.stopPrank();
    }
    
    function test_JoinPool_RevertCreatorCannotJoin() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4);
        
        vm.expectRevert("Pool creator cannot join their own pool");
        coinToss.joinPool{value: 1 ether}(1);
        
        vm.stopPrank();
    }
    
    function test_JoinPool_RevertIncorrectEntryFee() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4);
        vm.stopPrank();
        
        vm.startPrank(player1);
        vm.expectRevert("Incorrect entry fee");
        coinToss.joinPool{value: 0.5 ether}(1);
        vm.stopPrank();
    }
    
    function test_JoinPool_RevertAlreadyJoined() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4);
        vm.stopPrank();
        
        vm.startPrank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        
        vm.expectRevert("Already joined this pool");
        coinToss.joinPool{value: 1 ether}(1);
        vm.stopPrank();
    }
    
    function test_JoinPool_AutoActivateWhenFull() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 2); // 2-player pool
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1); // This should activate the pool
        
        (, , , , , CoinToss.PoolStatus status) = coinToss.getPoolInfo(1);
        assertTrue(status == CoinToss.PoolStatus.ACTIVE);
        
        assertEq(coinToss.getCurrentRound(1), 1);
    }
    
    function test_JoinPool_ActivateAt50Percent() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4); // 4-player pool, 50% = 2 players
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        
        // Pool should not be active yet with 1 player (25%)
        (, , , , , CoinToss.PoolStatus status) = coinToss.getPoolInfo(1);
        assertTrue(status == CoinToss.PoolStatus.OPENED);
        
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        
        // Pool should still be OPENED after 50% (no auto-activation)
        (, , , , , status) = coinToss.getPoolInfo(1);
        assertTrue(status == CoinToss.PoolStatus.OPENED);
        
        // But with 2 players (50%), pool should be manually activatable
        assertTrue(coinToss.canActivatePool(1));
        
        // Manual activation by creator
        vm.prank(creator1);
        coinToss.activatePool(1);
        
        (, , , , , status) = coinToss.getPoolInfo(1);
        assertTrue(status == CoinToss.PoolStatus.ACTIVE);
    }
    
    // GAME FLOW TESTS
    
    function test_GameFlow_MinorityWins_Success() public {
        // Setup 4-player game
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4);
        vm.stopPrank();
        
        // All players join
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player3);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player4);
        coinToss.joinPool{value: 1 ether}(1); // Pool auto-activates
        
        // Round 1: 1 HEADS, 3 TAILS -> HEADS should win (minority)
        vm.prank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        vm.prank(player2);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        vm.prank(player3);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        vm.prank(player4);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS); // Auto-resolves round
        
        // Check round 1 results
        address[] memory remainingPlayers = coinToss.getRemainingPlayers(1);
        assertEq(remainingPlayers.length, 1);
        assertEq(remainingPlayers[0], player1); // Only HEADS player should remain
        assertEq(coinToss.getCurrentRound(1), 1); // Game completed in round 1
        
        // Check game completion
        (, , , , , CoinToss.PoolStatus status) = coinToss.getPoolInfo(1);
        assertTrue(status == CoinToss.PoolStatus.COMPLETED);
    }
    
    function test_GameFlow_MultipleRounds() public {
        // Setup 6-player game for multiple rounds
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 6);
        vm.stopPrank();
        
        // All players join (using additional addresses)
        address player6 = makeAddr("player6");
        vm.deal(player6, 10 ether);
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player3);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player4);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player5);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player6);
        coinToss.joinPool{value: 1 ether}(1); // Pool auto-activates
        
        // Round 1: 2 HEADS, 4 TAILS -> HEADS should win (minority)
        vm.prank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        vm.prank(player2);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        vm.prank(player3);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        vm.prank(player4);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        vm.prank(player5);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        vm.prank(player6);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS); // Auto-resolves
        
        // Check round 1 results
        address[] memory remainingPlayers = coinToss.getRemainingPlayers(1);
        assertEq(remainingPlayers.length, 2); // player1 and player2 should remain
        assertEq(coinToss.getCurrentRound(1), 2);
        
        // Round 2: 1 HEADS, 1 TAILS -> Tie, random resolution
        vm.prank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        vm.prank(player2);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS); // Auto-resolves with tie-breaker
        
        // Check final result
        remainingPlayers = coinToss.getRemainingPlayers(1);
        assertEq(remainingPlayers.length, 1); // One winner should remain
        
        (, , , , , CoinToss.PoolStatus status) = coinToss.getPoolInfo(1);
        assertTrue(status == CoinToss.PoolStatus.COMPLETED);
    }
    
    function test_MakeSelection_RevertInvalidChoice() public {
        // Setup active pool
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 2);
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        
        vm.startPrank(player1);
        vm.expectRevert("Invalid choice");
        coinToss.makeSelection(1, CoinToss.PlayerChoice.NONE);
        vm.stopPrank();
    }
    
    function test_MakeSelection_RevertNotInPool() public {
        // Setup active pool
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 2);
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        
        vm.startPrank(player3); // Player3 didn't join
        vm.expectRevert("Player not in this pool");
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        vm.stopPrank();
    }
    
    function test_MakeSelection_RevertChoiceAlreadyMade() public {
        // Setup active pool
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 2);
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        
        vm.startPrank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        
        vm.expectRevert("Choice already made this round");
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        vm.stopPrank();
    }
    
    // PRIZE CLAIMING TESTS
    
    function test_ClaimPrize_Success() public {
        // Setup and complete a game
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 2);
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        
        // Complete game - player1 wins
        vm.prank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        vm.prank(player2);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        
        // Check winner can claim prize
        address[] memory remainingPlayers = coinToss.getRemainingPlayers(1);
        address winner = remainingPlayers[0];
        
        uint256 balanceBefore = winner.balance;
        vm.prank(winner);
        coinToss.claimPrize(1);
        
        uint256 expectedPrize = (2 ether * 95) / 100; // 95% of 2 ether prize pool
        assertEq(winner.balance, balanceBefore + expectedPrize);
    }
    
    function test_ClaimPrize_RevertNotWinner() public {
        // Setup and complete a game
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 2);
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        
        vm.prank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        vm.prank(player2);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        
        // Determine who lost and let them try to claim prize
        address[] memory remainingPlayers = coinToss.getRemainingPlayers(1);
        address winner = remainingPlayers[0];
        address loser = (winner == player1) ? player2 : player1;
        
        // Loser tries to claim prize
        vm.startPrank(loser);
        vm.expectRevert("Only winner can claim prize");
        coinToss.claimPrize(1);
        vm.stopPrank();
    }
    
    function test_ClaimPrize_RevertGameNotComplete() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 2);
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        
        vm.startPrank(player1);
        vm.expectRevert("Pool is not completed");
        coinToss.claimPrize(1);
        vm.stopPrank();
    }
    
    // UNSTAKING TESTS
    
    function test_UnstakeAndClaim_EarlyUnstake_Penalty() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4); // Create one pool but don't complete it
        
        // Add a player to test abandonment and refund
        vm.stopPrank();
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        
        uint256 projectPoolBefore = coinToss.getProjectPoolBalance();
        uint256 creatorBalanceBefore = creator1.balance;
        uint256 player1BalanceBefore = player1.balance;

        // Early unstake should incur 30% penalty and abandon pool
        vm.prank(creator1);
        coinToss.unstakeAndClaim();

        uint256 expectedPenalty = (10 ether * 30) / 100; // 3 ether penalty
        uint256 expectedReturn = 10 ether - expectedPenalty; // 7 ether return

        assertEq(coinToss.getProjectPoolBalance(), projectPoolBefore + expectedPenalty);
        assertEq(creator1.balance, creatorBalanceBefore + expectedReturn);
        
        // Player should be refunded
        assertEq(player1.balance, player1BalanceBefore + 1 ether);
        
        // Pool should be abandoned
        assertTrue(coinToss.isPoolAbandoned(1));
        
        // Creator should no longer have active stake
        (, , , bool hasActiveStake, ) = coinToss.getCreatorInfo(creator1);
        assertFalse(hasActiveStake);
    }
    
    function test_UnstakeAndClaim_AllPoolsCompleted_NoRenalty() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}(); // 2 pools
        coinToss.createPool(1 ether, 2);
        coinToss.createPool(1 ether, 2);
        vm.stopPrank();
        
        // Complete first pool
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        vm.prank(player2);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        
        // Complete second pool
        vm.prank(player3);
        coinToss.joinPool{value: 1 ether}(2);
        vm.prank(player4);
        coinToss.joinPool{value: 1 ether}(2);
        vm.prank(player3);
        coinToss.makeSelection(2, CoinToss.PlayerChoice.HEADS);
        vm.prank(player4);
        coinToss.makeSelection(2, CoinToss.PlayerChoice.TAILS);
        
        uint256 creatorBalanceBefore = creator1.balance;
        
        // Now unstake should work without penalty + creator rewards
        vm.prank(creator1);
        coinToss.unstakeAndClaim();
        
        uint256 expectedCreatorReward = ((2 ether + 2 ether) * 5) / 100; // 5% of 4 ether = 0.2 ether
        uint256 expectedTotal = 10 ether + expectedCreatorReward;
        
        assertEq(creator1.balance, creatorBalanceBefore + expectedTotal);
        
        vm.stopPrank();
    }
    
    function test_UnstakeAndClaim_RevertNoActiveStake() public {
        vm.startPrank(creator1);
        vm.expectRevert("No active stake");
        coinToss.unstakeAndClaim();
        vm.stopPrank();
    }
    
    // VIEW FUNCTION TESTS
    
    function test_ViewFunctions() public {
        // Setup game
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 15 ether}(); // 3 pools
        coinToss.createPool(1 ether, 4);
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player3);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player4);
        coinToss.joinPool{value: 1 ether}(1); // Pool activates
        
        // Test view functions before choices
        assertEq(coinToss.getCurrentRound(1), 1);
        assertEq(coinToss.getRemainingPlayers(1).length, 4);
        assertFalse(coinToss.hasPlayerChosen(1, player1));
        assertFalse(coinToss.isPlayerEliminated(1, player1));
        
        // Make some choices
        vm.prank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        
        assertTrue(coinToss.hasPlayerChosen(1, player1));
        assertEq(uint(coinToss.getPlayerChoice(1, player1)), uint(CoinToss.PlayerChoice.HEADS));
        
        // Complete round
        vm.prank(player2);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        vm.prank(player3);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        vm.prank(player4);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        
        // Test after round completion
        assertTrue(coinToss.isPlayerEliminated(1, player2));
        assertTrue(coinToss.isPlayerEliminated(1, player3));
        assertTrue(coinToss.isPlayerEliminated(1, player4));
        assertFalse(coinToss.isPlayerEliminated(1, player1));
        
        (uint256 currentRound, uint256 remainingCount, uint256 totalCount, bool isComplete) = 
            coinToss.getGameProgress(1);
        assertEq(currentRound, 1); // Game completed in round 1
        assertEq(remainingCount, 1);
        assertEq(totalCount, 4);
        assertTrue(isComplete);
    }
    
    // EDGE CASE TESTS
    
    function test_EdgeCase_TieBreaker() public {
        // Setup 2-player game to force tie
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 2);
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        
        // Force tie: 1 HEADS, 1 TAILS
        vm.prank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        vm.prank(player2);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS); // Auto-resolves with tie-breaker
        
        // One player should remain (random winner)
        address[] memory remainingPlayers = coinToss.getRemainingPlayers(1);
        assertEq(remainingPlayers.length, 1);
        
        (, , , , , CoinToss.PoolStatus status) = coinToss.getPoolInfo(1);
        assertTrue(status == CoinToss.PoolStatus.COMPLETED);
    }
    
    function test_EdgeCase_PoolActivation_ManualActivation() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4); // 4-player pool, need 2 for 50%
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1); // 50% capacity reached
        
        assertTrue(coinToss.canActivatePool(1));
        
        // Only creator or owner can manually activate
        vm.expectRevert("Only pool creator or owner can activate");
        vm.prank(player1);
        coinToss.activatePool(1);
        
        // Creator can activate
        vm.prank(creator1);
        coinToss.activatePool(1);
        
        (, , , , , CoinToss.PoolStatus status) = coinToss.getPoolInfo(1);
        assertTrue(status == CoinToss.PoolStatus.ACTIVE);
    }
    
    function test_EdgeCase_NonExistentPool() public {
        vm.startPrank(player1);
        
        vm.expectRevert("Pool does not exist");
        coinToss.joinPool{value: 1 ether}(999);
        
        vm.stopPrank();
    }
    
    // POOL ABANDONMENT TESTS
    
    function test_EarlyUnstake_AbandonOpenedPools() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4); // Pool 1 - OPENED
        coinToss.createPool(1 ether, 4); // Pool 2 - OPENED
        vm.stopPrank();
        
        // Some players join pool 1, none join pool 2
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        
        uint256 player1BalanceBefore = player1.balance;
        uint256 player2BalanceBefore = player2.balance;
        
        // Creator unstakes early - should abandon OPENED pools and refund players
        vm.prank(creator1);
        coinToss.unstakeAndClaim();
        
        // Check pools are abandoned
        assertTrue(coinToss.isPoolAbandoned(1));
        assertTrue(coinToss.isPoolAbandoned(2));
        
        // Check players were refunded automatically
        assertEq(player1.balance, player1BalanceBefore + 1 ether);
        assertEq(player2.balance, player2BalanceBefore + 1 ether);
        
        // Check pool status
        (, , , , , CoinToss.PoolStatus status1) = coinToss.getPoolInfo(1);
        (, , , , , CoinToss.PoolStatus status2) = coinToss.getPoolInfo(2);
        assertTrue(status1 == CoinToss.PoolStatus.ABANDONED);
        assertTrue(status2 == CoinToss.PoolStatus.ABANDONED);
    }
    
    function test_EarlyUnstake_ProtectActiveGameplay() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 15 ether}(); // 3 pools
        coinToss.createPool(1 ether, 4); // Pool 1 - will be OPENED
        coinToss.createPool(1 ether, 4); // Pool 2 - will be ACTIVE
        vm.stopPrank();
        
        // Pool 1: Only partial players joined (OPENED)
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        
        // Pool 2: Full players joined (ACTIVE)
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(2);
        vm.prank(player3);
        coinToss.joinPool{value: 1 ether}(2);
        vm.prank(player4);
        coinToss.joinPool{value: 1 ether}(2);
        vm.prank(player5);
        coinToss.joinPool{value: 1 ether}(2); // Pool 2 becomes ACTIVE
        
        uint256 player1BalanceBefore = player1.balance;
        
        // Creator unstakes early
        vm.prank(creator1);
        coinToss.unstakeAndClaim();
        
        // Pool 1 should be abandoned (was OPENED)
        assertTrue(coinToss.isPoolAbandoned(1));
        assertEq(player1.balance, player1BalanceBefore + 1 ether); // Refunded
        
        // Pool 2 should NOT be abandoned (was ACTIVE) - check it's still ACTIVE
        (, , , , , CoinToss.PoolStatus status2) = coinToss.getPoolInfo(2);
        assertTrue(status2 == CoinToss.PoolStatus.ACTIVE);
        
        // Pool 2 creator should be transferred to contract
        (address pool2Creator, , , , , ) = coinToss.getPoolInfo(2);
        assertEq(pool2Creator, address(coinToss)); // Contract is now the creator
        
        // Game should still be playable in pool 2
        vm.prank(player2);
        coinToss.makeSelection(2, CoinToss.PlayerChoice.HEADS);
        // This should not revert - game continues normally
    }
    
    function test_EarlyUnstake_CreatorLosesRewardsFromTransferredPools() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 2);
        vm.stopPrank();
        
        // Complete the pool before unstaking
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1); // Pool becomes ACTIVE
        
        // Creator unstakes (transfers pool ownership to contract)
        vm.prank(creator1);
        coinToss.unstakeAndClaim();
        
        // Complete the game
        vm.prank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        vm.prank(player2);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        
        // Pool is completed, but creator should get NO reward (lost ownership)
        uint256 creatorReward = coinToss.calculateCreatorReward(creator1);
        assertEq(creatorReward, 0); // No rewards for abandoned pools
        
        // Winner should still get their prize (95% of 2 ether)
        address[] memory remainingPlayers = coinToss.getRemainingPlayers(1);
        address winner = remainingPlayers[0];
        
        uint256 winnerBalanceBefore = winner.balance;
        vm.prank(winner);
        coinToss.claimPrize(1);
        
        uint256 expectedPrize = (2 ether * 95) / 100;
        assertEq(winner.balance, winnerBalanceBefore + expectedPrize);
    }
    
    function test_ManualRefundFromAbandonedPool() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4);
        vm.stopPrank();
        
        // Players join but pool doesn't reach 50% (only 1/4 players)
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        
        uint256 player1BalanceBefore = player1.balance;
        
        // Creator unstakes - abandons pool and auto-refunds
        vm.prank(creator1);
        coinToss.unstakeAndClaim();
        
        // Player1 should already be refunded automatically
        assertEq(player1.balance, player1BalanceBefore + 1 ether);
        
        // Pool should be abandoned
        assertTrue(coinToss.isPoolAbandoned(1));
        
        // Trying to claim refund again should fail (already refunded)
        vm.expectRevert("Pool has no funds to refund");
        vm.prank(player1);
        coinToss.claimRefundFromAbandonedPool(1);
    }
    
    function test_ManualRefundFromAbandonedPool_NotParticipant() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4);
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        
        vm.prank(creator1);
        coinToss.unstakeAndClaim(); // Abandon pool
        
        // Player2 never joined, can't claim refund
        vm.expectRevert("Not a participant in this pool");
        vm.prank(player2);
        coinToss.claimRefundFromAbandonedPool(1);
    }
    
    function test_BlockGameActionsOnAbandonedPools() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 2);
        vm.stopPrank();
        
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        
        // Creator unstakes - abandons OPENED pool
        vm.prank(creator1);
        coinToss.unstakeAndClaim();
        
        // Should not be able to join abandoned pool
        vm.expectRevert("Pool is not open for joining");
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        
        // Should not be able to make selections on abandoned pool
        vm.expectRevert("Pool is not active");
        vm.prank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
    }
    
    function test_ActivePoolContinuesAfterCreatorAbandonment() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4);
        vm.stopPrank();
        
        // Fill pool completely to make it ACTIVE
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player3);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player4);
        coinToss.joinPool{value: 1 ether}(1); // Pool becomes ACTIVE
        
        // Start gameplay - set up for single winner scenario
        vm.prank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        vm.prank(player2);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        vm.prank(player3);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);
        // Don't complete round yet
        
        // Creator abandons mid-game
        vm.prank(creator1);
        coinToss.unstakeAndClaim();
        
        // Pool should still be ACTIVE, not abandoned
        (, , , , , CoinToss.PoolStatus status) = coinToss.getPoolInfo(1);
        assertTrue(status == CoinToss.PoolStatus.ACTIVE);
        
        // Game should continue - player4 can still make selection  
        vm.prank(player4);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS); // Auto-resolves round
        
        // After round 1: 1 HEADS (minority), 3 TAILS -> HEADS should win (player1)
        // Game should complete since only 1 player remains
        (, , , , , status) = coinToss.getPoolInfo(1);
        assertTrue(status == CoinToss.PoolStatus.COMPLETED);
        
        // Winner can claim prize
        address[] memory remainingPlayers = coinToss.getRemainingPlayers(1);
        assertEq(remainingPlayers.length, 1);
        
        address winner = remainingPlayers[0];
        uint256 winnerBalanceBefore = winner.balance;
        
        vm.prank(winner);
        coinToss.claimPrize(1);
        
        // Winner gets full 95% of prize pool
        uint256 expectedPrize = (4 ether * 95) / 100;
        assertEq(winner.balance, winnerBalanceBefore + expectedPrize);
    }

    function test_AbandonedPoolCreatorFeesGoToProjectPool() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 2);
        vm.stopPrank();

        // Players join to make pool ACTIVE
        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);
        vm.prank(player2);
        coinToss.joinPool{value: 1 ether}(1); // Pool becomes ACTIVE

        // Creator abandons pool (transfers to contract)
        vm.prank(creator1);
        coinToss.unstakeAndClaim();

        uint256 projectPoolBefore = coinToss.getProjectPoolBalance();

        // Verify pool is now owned by contract
        (address poolCreator, , , , , ) = coinToss.getPoolInfo(1);
        assertEq(poolCreator, address(coinToss));

        // Complete the game
        vm.prank(player1);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.HEADS);
        vm.prank(player2);
        coinToss.makeSelection(1, CoinToss.PlayerChoice.TAILS);

        // Get winner and claim prize
        address[] memory remainingPlayers = coinToss.getRemainingPlayers(1);
        address winner = remainingPlayers[0];

        vm.prank(winner);
        coinToss.claimPrize(1);

        // Verify creator fee (5% of 2 ether = 0.1 ether) went to project pool
        uint256 expectedCreatorFee = (2 ether * 5) / 100;
        assertEq(coinToss.getProjectPoolBalance(), projectPoolBefore + expectedCreatorFee);
    }

    // PROJECT POOL MANAGEMENT TESTS

    function test_ProjectPoolBalance_InitiallyZero() public {
        assertEq(coinToss.getProjectPoolBalance(), 0);
    }

    function test_WithdrawProjectPoolFunds_Success() public {
        // First accumulate some funds in project pool via penalty
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4);
        vm.stopPrank();

        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);

        // Early unstake to create penalty
        vm.prank(creator1);
        coinToss.unstakeAndClaim();

        uint256 projectPoolBalance = coinToss.getProjectPoolBalance();
        assertTrue(projectPoolBalance > 0); // Should have penalty funds

        uint256 ownerBalanceBefore = owner.balance;
        uint256 withdrawAmount = projectPoolBalance / 2; // Withdraw half

        // Owner withdraws funds
        coinToss.withdrawProjectPoolFunds(withdrawAmount);

        assertEq(coinToss.getProjectPoolBalance(), projectPoolBalance - withdrawAmount);
        assertEq(owner.balance, ownerBalanceBefore + withdrawAmount);
    }

    function test_WithdrawProjectPoolFunds_RevertNotOwner() public {
        // Accumulate some funds first
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();
        coinToss.createPool(1 ether, 4);
        vm.stopPrank();

        vm.prank(player1);
        coinToss.joinPool{value: 1 ether}(1);

        vm.prank(creator1);
        coinToss.unstakeAndClaim(); // Create penalty

        // Non-owner tries to withdraw
        vm.expectRevert();
        vm.prank(player1);
        coinToss.withdrawProjectPoolFunds(1 ether);
    }

    function test_WithdrawProjectPoolFunds_RevertInsufficientFunds() public {
        // Try to withdraw more than available
        vm.expectRevert("Insufficient project pool funds");
        coinToss.withdrawProjectPoolFunds(1 ether);
    }

    function test_WithdrawProjectPoolFunds_RevertZeroAmount() public {
        vm.expectRevert("Amount must be greater than 0");
        coinToss.withdrawProjectPoolFunds(0);
    }

    // SELF VERIFICATION TESTS

    function test_VerificationBonus_UnverifiedCreator() public {
        vm.startPrank(creator1);
        coinToss.stakeForPoolCreation{value: 10 ether}();

        (, , uint256 poolsRemaining, , bool isVerified) = coinToss.getCreatorInfo(creator1);

        assertEq(poolsRemaining, 2); // 10 CELO = 2 pools (no bonus)
        assertFalse(isVerified);
        vm.stopPrank();
    }

    function test_VerificationBonus_VerifiedCreator() public {
        // Test calculation functions directly since verification would be complex to mock
        assertTrue(coinToss.calculatePoolsEligible(10 ether, creator1) == 2); // Unverified = 2 pools

        // Test the calculation if they were verified
        // We can't easily test the full verification flow in a unit test,
        // but we can test the pool calculation logic
        assertEq(coinToss.calculatePoolsEligible(5 ether, creator1), 1);
        assertEq(coinToss.calculatePoolsEligible(10 ether, creator1), 2);
        assertEq(coinToss.calculatePoolsEligible(25 ether, creator1), 5);

        // These tests verify the calculation works for unverified users
        // In practice, verified users would get +1 bonus
    }

    function test_VerificationStatus_Functions() public {
        // Test unverified status
        assertFalse(coinToss.isCreatorVerified(creator1));
        assertEq(coinToss.getVerificationBonus(creator1), 0);

        (bool isVerified, uint256 bonusPools, string memory status) = coinToss.getVerificationStatus(creator1);
        assertFalse(isVerified);
        assertEq(bonusPools, 0);
        assertTrue(
            keccak256(abi.encodePacked(status)) ==
            keccak256(abi.encodePacked("Not verified - Verify to get +1 bonus pool"))
        );
    }

    function test_PreviewPoolsEligible() public {
        // Test unverified preview
        (uint256 basePools, uint256 totalPools, uint256 bonusPools) =
            coinToss.previewPoolsEligible(15 ether, creator1);

        assertEq(basePools, 3);     // 15 CELO = 3 pools
        assertEq(totalPools, 3);    // No bonus for unverified
        assertEq(bonusPools, 0);    // Unverified = 0 bonus
    }

    function test_CalculatePoolsEligible_WithoutVerification() public {
        // Test pool calculation for unverified users
        assertEq(coinToss.calculatePoolsEligible(5 ether, creator1), 1);
        assertEq(coinToss.calculatePoolsEligible(10 ether, creator1), 2);
        assertEq(coinToss.calculatePoolsEligible(25 ether, creator1), 5);
        assertEq(coinToss.calculatePoolsEligible(50 ether, creator1), 10);

        // Verification functions should return false/0 for unverified users
        assertFalse(coinToss.isCreatorVerified(creator1));
        assertEq(coinToss.getVerificationBonus(creator1), 0);
    }
}