// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Rewards
 * @dev Contract for managing contributor rewards in the Tank ecosystem
 * This is designed to be inherited by the Tank contract
 */
contract Rewards is ReentrancyGuard {
    // Total rewards available for distribution
    uint256 public totalRewards;
    
    // Mapping of contributor address to their claimable rewards
    mapping(address => uint256) public contributorRewards;
    
    // Events
    event RewardAllocated(address indexed contributor, uint256 amount, uint256 score);
    event RewardClaimed(address indexed contributor, uint256 amount);
    event RewardsReceived(uint256 amount);
    
    /**
     * @dev Add funds to the rewards pool
     */
    function addToRewardsPool() internal {
        totalRewards += msg.value;
        emit RewardsReceived(msg.value);
    }
    
    /**
     * @dev Allocate rewards to a contributor based on their score
     * @param contributor Address of the contributor
     * @param score Score of the contribution (out of 100)
     */
    function _allocateReward(address contributor, uint256 score) internal {
        require(contributor != address(0), "Invalid contributor address");
        require(score > 0 && score <= 100, "Score must be between 1 and 100");
        
        if (totalRewards == 0) return; // No rewards to allocate
        
        // Calculate reward amount based on score
        // This is a simple algorithm - 1% of total rewards per score point
        uint256 rewardAmount = (totalRewards * score) / 100;
        
        // Cap the reward at the available total
        if (rewardAmount > totalRewards) {
            rewardAmount = totalRewards;
        }
        
        // Update contributor's reward balance
        contributorRewards[contributor] += rewardAmount;
        
        // Reduce total rewards
        totalRewards -= rewardAmount;
        
        emit RewardAllocated(contributor, rewardAmount, score);
    }
    
    /**
     * @dev Allow a contributor to claim their rewards
     */
    function claimReward() external nonReentrant {
        uint256 reward = contributorRewards[msg.sender];
        require(reward > 0, "No rewards to claim");
        
        // Reset reward balance before transfer to prevent reentrancy
        contributorRewards[msg.sender] = 0;
        
        // Transfer reward to contributor
        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Reward transfer failed");
        
        emit RewardClaimed(msg.sender, reward);
    }
    
    /**
     * @dev Check the claimable reward for an address
     * @param contributor Address to check rewards for
     * @return Amount of rewards claimable
     */
    function getClaimableReward(address contributor) external view returns (uint256) {
        return contributorRewards[contributor];
    }
    
    /**
     * @dev Get the total amount of rewards allocated but not yet claimed
     * @return Total allocated rewards
     */
    function getTotalAllocatedRewards() external view returns (uint256) {
        return address(this).balance - totalRewards;
    }

    receive() external payable virtual {
        totalRewards += msg.value;
        emit RewardsReceived(msg.value);
    }

}
