// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";

// Mock contract that inherits from Rewards for testing
import "../src/Rewards.sol";

contract MockRewardsImplementation is Rewards {
    // Function to add to the rewards pool
    function addToRewardsPool(uint256 amount) external payable {
        totalRewards += amount;
        emit RewardsReceived(amount);
    }
    
    // Function to allocate rewards to a contributor
    function allocateReward(address contributor, uint256 score) external {
        _allocateReward(contributor, score);
    }
    
    // Function to get total allocated rewards
    function totalAllocatedRewards() public view returns (uint256) {
        uint256 total = 0;
        // This is a test function, so we're not worried about gas costs
        // In production, you'd track this separately
        return total + contributorRewards[address(0x1)] + contributorRewards[address(0x2)] + contributorRewards[address(0x3)];
    }

    // Allow the contract to receive ETH
    receive() external payable override(Rewards) {
        totalRewards += msg.value;
        emit RewardsReceived(msg.value);
    }
}

contract RewardsTest is Test {
    MockRewardsImplementation public rewardsContract;
    
    address public user1;
    address public user2;
    address public user3;
    
    function setUp() public {
        rewardsContract = new MockRewardsImplementation();
        
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");
        
        // Fund the contract with some ETH
        vm.deal(address(rewardsContract), 10 ether);
        rewardsContract.addToRewardsPool(10 ether);
    }
    
    function testRewardsAllocation() public {
        // Allocate rewards to users with different scores
        rewardsContract.allocateReward(user1, 100);
        rewardsContract.allocateReward(user2, 200);
        rewardsContract.allocateReward(user3, 300);
        
        // Check reward allocations
        assertEq(rewardsContract.contributorRewards(user1), 100);
        assertEq(rewardsContract.contributorRewards(user2), 200);
        assertEq(rewardsContract.contributorRewards(user3), 300);
        
        // Check total allocated rewards
        assertEq(rewardsContract.totalAllocatedRewards(), 600);
    }
    
    function testClaimRewards() public {
        // Allocate rewards
        rewardsContract.allocateReward(user1, 100);
        rewardsContract.allocateReward(user2, 200);
        
        // Record initial balances
        uint256 initialBalance1 = user1.balance;
        uint256 initialBalance2 = user2.balance;
        
        // User1 claims rewards
        vm.prank(user1);
        rewardsContract.claimReward();
        
        // Check user1's balance increased and rewards reset
        assertTrue(user1.balance > initialBalance1);
        assertEq(rewardsContract.contributorRewards(user1), 0);
        
        // User2's rewards should still be allocated
        assertEq(rewardsContract.contributorRewards(user2), 200);
        
        // User2 claims rewards
        vm.prank(user2);
        rewardsContract.claimReward();
        
        // Check user2's balance increased and rewards reset
        assertTrue(user2.balance > initialBalance2);
        assertEq(rewardsContract.contributorRewards(user2), 0);
    }
    
    function testProportionalRewardDistribution() public {
        // Allocate rewards with a 1:2:3 ratio
        rewardsContract.allocateReward(user1, 100);
        rewardsContract.allocateReward(user2, 200);
        rewardsContract.allocateReward(user3, 300);
        
        // Record initial balances
        uint256 initialBalance1 = user1.balance;
        uint256 initialBalance2 = user2.balance;
        uint256 initialBalance3 = user3.balance;
        
        // All users claim rewards
        vm.prank(user1);
        rewardsContract.claimReward();
        
        vm.prank(user2);
        rewardsContract.claimReward();
        
        vm.prank(user3);
        rewardsContract.claimReward();
        
        // Calculate received amounts
        uint256 received1 = user1.balance - initialBalance1;
        uint256 received2 = user2.balance - initialBalance2;
        uint256 received3 = user3.balance - initialBalance3;
        
        // Check proportional distribution (allowing for small rounding errors)
        assertApproxEqRel(received2, received1 * 2, 0.01e18); // 1% tolerance
        assertApproxEqRel(received3, received1 * 3, 0.01e18); // 1% tolerance
    }
    
    function testNoRewardsToClaimReversion() public {
        // Try to claim rewards without any allocation
        vm.prank(user1);
        vm.expectRevert("No rewards to claim");
        rewardsContract.claimReward();
    }
    
    function testRewardsAfterMultipleContributions() public {
        // Allocate rewards to user1 multiple times
        rewardsContract.allocateReward(user1, 100);
        rewardsContract.allocateReward(user1, 150);
        rewardsContract.allocateReward(user1, 50);
        
        // Check cumulative rewards
        assertEq(rewardsContract.contributorRewards(user1), 300);
        
        // User claims rewards
        vm.prank(user1);
        rewardsContract.claimReward();
        
        // Rewards should be reset
        assertEq(rewardsContract.contributorRewards(user1), 0);
    }
    
    function testRewardsPoolIncreases() public {
        // Initial pool is 10 ETH from setUp
        assertEq(rewardsContract.totalRewards(), 10 ether);
        
        // Add more ETH to the pool
        vm.deal(address(this), 5 ether);
        (bool success, ) = address(rewardsContract).call{value: 5 ether}("");
        require(success, "ETH transfer failed");
        
        // Check pool increased
        assertEq(rewardsContract.totalRewards(), 15 ether);
    }
    
    function testReentrancyProtection() public {
        // Create a malicious contract that attempts reentrancy
        ReentrancyAttacker attacker = new ReentrancyAttacker(payable(address(rewardsContract)));
        
        // Fund the attacker
        vm.deal(address(attacker), 1 ether);
        
        // Allocate some rewards to the attacker
        rewardsContract.allocateReward(address(attacker), 100);
        
        // Attacker tries to claim rewards and reenter
        vm.prank(address(attacker));
        vm.expectRevert(); // Should revert due to reentrancy guard
        attacker.attack();
    }
}

// Malicious contract that attempts reentrancy
contract ReentrancyAttacker {
    Rewards public rewards;
    uint256 public attackCount;
    
    constructor(address payable _rewards) {
        rewards = Rewards(_rewards);
    }
    
    function attack() external {
        rewards.claimReward();
    }
    
    // When receiving ETH during claim, try to reenter
    receive() external payable {
        if (attackCount == 0) {
            attackCount++;
            rewards.claimReward(); // Try to claim again (should fail)
        }
    }
}
