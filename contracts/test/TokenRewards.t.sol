// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "../src/Thaink.sol";
import "../src/Tank.sol";
import "../src/Rewards.sol";

// Mock Uniswap V4 Pool Manager Factory
contract MockPoolManagerFactory {
    address public poolManager;
    
    constructor(address _poolManager) {
        poolManager = _poolManager;
    }
    
    function createPoolManager() external returns (address) {
        return poolManager;
    }
}

// Mock Uniswap V4 Pool Manager
contract MockPoolManager {
    struct PoolKey {
        address currency0;
        address currency1;
        uint24 fee;
        int24 tickSpacing;
        address hooks;
    }
    
    struct SwapParams {
        bool zeroForOne;
        int256 amountSpecified;
        uint160 sqrtPriceLimitX96;
    }
    
    uint160 public sqrtPriceX96 = 79228162514264337593543950336; // Default price
    
    function initialize(PoolKey memory, uint160) external pure returns (int24) {
        return 0; // Mock tick
    }
    
    function swap(
        PoolKey memory,
        SwapParams memory,
        bytes calldata
    ) external pure returns (int256, int256) {
        return (0, 0); // Mock swap result
    }
    
    function mint(
        PoolKey memory,
        int24,
        int24,
        uint128,
        bytes calldata
    ) external pure returns (uint256, uint256) {
        return (0, 0); // Mock mint result
    }
    
    function getPrice(PoolKey memory) external view returns (uint160) {
        return sqrtPriceX96;
    }
    
    function setSqrtPrice(uint160 _sqrtPriceX96) external {
        sqrtPriceX96 = _sqrtPriceX96;
    }
    
    // Allow the contract to receive ETH
    receive() external payable {}
}

contract TokenRewardsTest is Test, ERC1155Holder {
    Thaink public thaink;
    MockPoolManager public mockPoolManager;
    MockPoolManagerFactory public mockPoolManagerFactory;
    
    address public owner;
    address public user1;
    address public user2;
    address public contributor1;
    address public contributor2;
    
    bytes public constant TEST_PKP = hex"0011223344";
    bytes public constant TEST_SIGNATURE = hex"00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00"; // Mock signature
    
    // Mock config data
    string public constant TEST_LLM_URL = "https://api.example.com/llm";
    string public constant TEST_CONFIG = "0011223344";
    string public constant TEST_CONFIG_HASH = "5566778899";
    string public constant TEST_HINT_ACTION_IPFS_ID = "aabbccddeeff";
    string public constant TEST_SUBMIT_ACTION_IPFS_ID = "112233445566";
    string public constant TEST_PROMPT_ACTION_IPFS_ID = "778899aabbcc";
    
    function setUp() public {
        // Create mock Uniswap V4 contracts
        mockPoolManager = new MockPoolManager();
        mockPoolManagerFactory = new MockPoolManagerFactory(address(mockPoolManager));
        
        // Create Thaink contract
        thaink = new Thaink();
        owner = thaink.owner();
        
        // Create test addresses
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        contributor1 = makeAddr("contributor1");
        contributor2 = makeAddr("contributor2");
        
        // Give ETH to test users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(contributor1, 1 ether);
        vm.deal(contributor2, 1 ether);
        
        // Set up initial configuration
        vm.startPrank(owner);
        thaink.setPkp(TEST_PKP);
        thaink.setConfig(TEST_CONFIG, TEST_CONFIG_HASH);
        thaink.setIpfsIds(
            TEST_HINT_ACTION_IPFS_ID,
            TEST_SUBMIT_ACTION_IPFS_ID,
            TEST_PROMPT_ACTION_IPFS_ID
        );
        thaink.setPoolManagerFactory(address(mockPoolManagerFactory));
        vm.stopPrank();
    }
    
    function testTokenInitialization() public {
        string memory idea = "Test idea for token initialization";
        
        // Create tank with ETH for liquidity
        vm.startPrank(owner);
        thaink.makeTank{value: 1 ether}(idea);
        vm.stopPrank();
        
        Tank tank = thaink.tanks(1);
        
        // Check token initialization
        assertEq(tank.name(), "Tank #1");
        assertEq(tank.symbol(), "TANK1");
        assertEq(tank.totalSupply(), 1_000_000 * 10**18);
        assertEq(tank.balanceOf(address(tank)), 1_000_000 * 10**18);
        
        // Check pool initialization
        assertEq(tank.poolManager(), address(mockPoolManager));
        assertTrue(address(tank).balance > 0); // Should have some ETH for rewards
    }
    
    function testBuyTokenForNote() public {
        string memory idea = "Test idea for buying tokens";
        
        // Create tank with ETH for liquidity
        vm.startPrank(owner);
        thaink.makeTank{value: 1 ether}(idea);
        vm.stopPrank();
        
        Tank tank = thaink.tanks(1);
        
        // User buys a token
        vm.startPrank(user1);
        uint256 balanceBefore = user1.balance;
        tank.buyTokenForNote{value: 0.01 ether}();
        uint256 balanceAfter = user1.balance;
        vm.stopPrank();
        
        // Check token transfer
        assertEq(tank.balanceOf(user1), 1 * 10**18); // Should have 1 token
        assertTrue(balanceBefore - balanceAfter <= 0.01 ether); // Should have spent less than or equal to 0.01 ETH
        
        // Check rewards pool
        assertTrue(tank.totalRewards() > 0); // Should have some rewards
    }
    
    function testAddNoteWithToken() public {
        string memory idea = "Test idea for adding notes with tokens";
        string memory noteContent = "Test note content";
        string memory contentHash = "contentHash";
        string memory digest = "test digest";
        string memory digestHash = "digestHash";
        
        // Create tank with ETH for liquidity
        vm.startPrank(owner);
        thaink.makeTank{value: 1 ether}(idea);
        vm.stopPrank();
        
        Tank tank = thaink.tanks(1);
        
        // User buys a token
        vm.startPrank(contributor1);
        tank.buyTokenForNote{value: 0.01 ether}();
        
        // Check token balance before adding note
        assertEq(tank.balanceOf(contributor1), 1 * 10**18);
        
        // Add note
        tank.addNote(
            contributor1,
            noteContent,
            contentHash,
            digest,
            digestHash,
            TEST_SIGNATURE,
            100 // Score of 100
        );
        vm.stopPrank();
        
        // Check token balance after adding note (should be burned)
        assertEq(tank.balanceOf(contributor1), 0);
        
        // Check note was added
        (
            string memory content,
            string memory storedContentHash,
            address contributor,
            uint score
        ) = tank.notes(0);
        
        assertEq(contributor, contributor1);
        assertEq(content, noteContent);
        assertEq(storedContentHash, contentHash);
        assertEq(score, 100);
        
        // Check rewards allocation
        assertEq(tank.contributorRewards(contributor1), 100);
    }
    
    function testMultipleContributorsRewards() public {
        string memory idea = "Test idea for multiple contributors";
        
        // Create tank with ETH for liquidity
        vm.startPrank(owner);
        thaink.makeTank{value: 1 ether}(idea);
        vm.stopPrank();
        
        Tank tank = thaink.tanks(1);
        
        // Users buy tokens and add notes
        vm.startPrank(user1);
        tank.buyTokenForNote{value: 0.01 ether}();
        vm.stopPrank();
        
        vm.startPrank(user2);
        tank.buyTokenForNote{value: 0.01 ether}();
        vm.stopPrank();
        
        // First contributor adds note with score 100
        vm.startPrank(contributor1);
        tank.buyTokenForNote{value: 0.01 ether}();
        tank.addNote(
            contributor1,
            "Note 1",
            "Hash 1",
            "Digest 1",
            "DigestHash 1",
            TEST_SIGNATURE,
            100 // Score of 100
        );
        vm.stopPrank();
        
        // Second contributor adds note with score 200
        vm.startPrank(contributor2);
        tank.buyTokenForNote{value: 0.01 ether}();
        tank.addNote(
            contributor2,
            "Note 2",
            "Hash 2",
            "Digest 2",
            "DigestHash 2",
            TEST_SIGNATURE,
            200 // Score of 200
        );
        vm.stopPrank();
        
        // Check rewards allocation
        assertEq(tank.contributorRewards(contributor1), 100);
        assertEq(tank.contributorRewards(contributor2), 200);
        
        // Check total rewards
        assertEq(tank.totalRewards(), tank.contributorRewards(contributor1) + tank.contributorRewards(contributor2));
    }
    
    function testClaimRewards() public {
        string memory idea = "Test idea for claiming rewards";
        
        // Create tank with ETH for liquidity
        vm.startPrank(owner);
        thaink.makeTank{value: 1 ether}(idea);
        vm.stopPrank();
        
        Tank tank = thaink.tanks(1);
        
        // User buys tokens to add ETH to rewards pool
        vm.startPrank(user1);
        tank.buyTokenForNote{value: 0.1 ether}();
        vm.stopPrank();
        
        vm.startPrank(user2);
        tank.buyTokenForNote{value: 0.1 ether}();
        vm.stopPrank();
        
        // Contributor adds note
        vm.startPrank(contributor1);
        tank.buyTokenForNote{value: 0.01 ether}();
        tank.addNote(
            contributor1,
            "Note 1",
            "Hash 1",
            "Digest 1",
            "DigestHash 1",
            TEST_SIGNATURE,
            100 // Score of 100
        );
        vm.stopPrank();
        
        // Record ETH balance before claiming
        uint256 balanceBefore = contributor1.balance;
        
        // Claim rewards
        vm.startPrank(contributor1);
        tank.claimReward();
        vm.stopPrank();
        
        // Check ETH balance after claiming
        uint256 balanceAfter = contributor1.balance;
        assertTrue(balanceAfter > balanceBefore); // Should have received ETH
        
        // Check rewards reset
        assertEq(tank.contributorRewards(contributor1), 0);
    }
    
    function testMultipleClaimsProportional() public {
        string memory idea = "Test idea for proportional rewards";
        
        // Create tank with ETH for liquidity
        vm.startPrank(owner);
        thaink.makeTank{value: 1 ether}(idea);
        vm.stopPrank();
        
        Tank tank = thaink.tanks(1);
        
        // Add ETH to rewards pool
        vm.deal(address(tank), 1 ether);
        
        // Two contributors add notes with different scores
        vm.startPrank(contributor1);
        tank.buyTokenForNote{value: 0.01 ether}();
        tank.addNote(
            contributor1,
            "Note 1",
            "Hash 1",
            "Digest 1",
            "DigestHash 1",
            TEST_SIGNATURE,
            100 // Score of 100
        );
        vm.stopPrank();
        
        vm.startPrank(contributor2);
        tank.buyTokenForNote{value: 0.01 ether}();
        tank.addNote(
            contributor2,
            "Note 2",
            "Hash 2",
            "Digest 2",
            "DigestHash 2",
            TEST_SIGNATURE,
            300 // Score of 300 (3x more than contributor1)
        );
        vm.stopPrank();
        
        // Record ETH balances before claiming
        uint256 balance1Before = contributor1.balance;
        uint256 balance2Before = contributor2.balance;
        
        // Both claim rewards
        vm.startPrank(contributor1);
        tank.claimReward();
        vm.stopPrank();
        
        vm.startPrank(contributor2);
        tank.claimReward();
        vm.stopPrank();
        
        // Check ETH balances after claiming
        uint256 balance1After = contributor1.balance;
        uint256 balance2After = contributor2.balance;
        
        uint256 reward1 = balance1After - balance1Before;
        uint256 reward2 = balance2After - balance2Before;
        
        // Contributor2 should get approximately 3x the rewards of contributor1
        // Allow for some rounding error (using integer arithmetic)
        assertTrue(reward2 > (reward1 * 29) / 10);
        assertTrue(reward2 < (reward1 * 31) / 10);
    }
    
    function testCannotAddNoteWithoutToken() public {
        string memory idea = "Test idea for token requirement";
        
        // Create tank
        vm.startPrank(owner);
        thaink.makeTank{value: 1 ether}(idea);
        vm.stopPrank();
        
        Tank tank = thaink.tanks(1);
        
        // Try to add note without buying token first
        vm.startPrank(contributor1);
        vm.expectRevert("Contributor does not have a token");
        tank.addNote(
            contributor1,
            "Note 1",
            "Hash 1",
            "Digest 1",
            "DigestHash 1",
            TEST_SIGNATURE,
            100
        );
        vm.stopPrank();
    }
    
    function testPriceChangesAffectTokenCost() public {
        string memory idea = "Test idea for price changes";
        
        // Create tank
        vm.startPrank(owner);
        thaink.makeTank{value: 1 ether}(idea);
        vm.stopPrank();
        
        Tank tank = thaink.tanks(1);
        
        // Buy token at initial price
        vm.startPrank(user1);
        uint256 balanceBefore1 = user1.balance;
        tank.buyTokenForNote{value: 0.01 ether}();
        uint256 balanceAfter1 = user1.balance;
        uint256 cost1 = balanceBefore1 - balanceAfter1;
        vm.stopPrank();
        
        // Change price (double it)
        uint160 newPrice = mockPoolManager.sqrtPriceX96() * 2;
        mockPoolManager.setSqrtPrice(newPrice);
        
        // Buy token at new price
        vm.startPrank(user2);
        uint256 balanceBefore2 = user2.balance;
        tank.buyTokenForNote{value: 0.02 ether}(); // Need more ETH now
        uint256 balanceAfter2 = user2.balance;
        uint256 cost2 = balanceBefore2 - balanceAfter2;
        vm.stopPrank();
        
        // Second purchase should cost more (approximately double)
        assertTrue(cost2 > (cost1 * 19) / 10); // Allow for some rounding
        assertTrue(cost2 < (cost1 * 21) / 10);
    }
}
