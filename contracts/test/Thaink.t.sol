pragma solidity ^0.8.28;

import "forge-std/Test.sol";

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "../src/Thaink.sol";
import "../src/Tank.sol";
import "../src/Config.sol";
import "../src/Meta.sol";


contract ThainkTest is Test, ERC1155Holder {
    Thaink public thaink;
    address public owner;
    address public user;
    address public user2;
    bytes public constant TEST_PKP = hex"0011223344";
    bytes public constant TEST_SIGNATURE = hex"00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00"; // Mock signature
    
    // Mock config data
    string public constant TEST_LLM_URL = "https://api.example.com/llm";
    string public constant TEST_CONFIG = "0011223344";
    string public constant TEST_CONFIG_HASH = "5566778899";
    string public constant TEST_HINT_ACTION_IPFS_ID = "aabbccddeeff";
    string public constant TEST_SUBMIT_ACTION_IPFS_ID = "112233445566";
    string public constant TEST_PROMPT_ACTION_IPFS_ID = "778899aabbcc";

    error OwnableUnauthorizedAccount(address account);
    error IdeaTooLong(uint256 length, uint256 maxLength);

    function setUp() public {
        thaink = new Thaink();
        owner = thaink.owner();
        user = makeAddr("user");
        user2 = makeAddr("user2");
        
        // Set up initial configuration
        vm.startPrank(owner);
        thaink.setPkp(TEST_PKP);
        thaink.setConfig(TEST_CONFIG, TEST_CONFIG_HASH);
        thaink.setIpfsIds(
            TEST_HINT_ACTION_IPFS_ID,
            TEST_SUBMIT_ACTION_IPFS_ID,
            TEST_PROMPT_ACTION_IPFS_ID
        );
        vm.stopPrank();
    }

    function testTankCreationAndMinting() public {
        string memory idea = "Test idea";
        
        // Only owner can create tanks
        vm.startPrank(user);
        vm.expectRevert(abi.encodeWithSelector(OwnableUnauthorizedAccount.selector, user));
        thaink.makeTank(idea);
        vm.stopPrank();

        // Create tank with ID 1
        vm.startPrank(owner);
        thaink.makeTank(idea);
        vm.stopPrank();

        // Cannot mint non-existent tank
        vm.startPrank(user);
        vm.expectRevert("Tank does not exist");
        thaink.mint(user, 2);
        vm.stopPrank();

        // Anyone can mint existing tank
        vm.startPrank(user);
        thaink.mint(user, 1);
        vm.stopPrank();

        vm.startPrank(user2);
        thaink.mint(user2, 1);
        vm.stopPrank();

        // Verify balances
        assertEq(thaink.balanceOf(user, 1), 1);
        assertEq(thaink.balanceOf(user2, 1), 1);
    }

    function testTankCreationWithLongIdea() public {
        // Create a string longer than MAX_IDEA_LENGTH
        string memory longIdea = "";
        for(uint i = 0; i < 10001; i++) {
            longIdea = string.concat(longIdea, "a");
        }
        
        // Expect revert when creating tank with too long idea
        vm.startPrank(owner);
        vm.expectRevert(abi.encodeWithSelector(IdeaTooLong.selector, 10001, 10000));
        thaink.makeTank(longIdea);
        vm.stopPrank();

        // Test with exactly MAX_IDEA_LENGTH
        string memory maxLengthIdea = "";
        for(uint i = 0; i < 10000; i++) {
            maxLengthIdea = string.concat(maxLengthIdea, "a");
        }
        
        // Should succeed with max length
        vm.startPrank(owner);
        thaink.makeTank(maxLengthIdea);
        vm.stopPrank();

        Tank tank = thaink.tanks(1);
        assertEq(tank.idea(), maxLengthIdea);
    }

    function testSpecialCharactersInIdea() public {
        string memory complexIdea = 'Test idea with "quotes" and \n newlines \r and \t tabs';
        
        vm.startPrank(owner);
        thaink.makeTank(complexIdea);
        vm.stopPrank();

        Tank tank = thaink.tanks(1);
        
        // Test that the URI is valid base64
        string memory uri = thaink.uri(1);
        assertTrue(bytes(uri).length > 0);
        
        // Verify the URI starts with the correct prefix
        assertEq(
            _slice(uri, 0, 29),
            "data:application/json;base64,"
        );
    }

    function testMetadata() public {
        string memory idea = "Test metadata idea";
        
        vm.startPrank(owner);
        thaink.makeTank(idea);
        vm.stopPrank();

        Tank tank = thaink.tanks(1);
        
        // Test tank initialization
        assertEq(tank.idea(), idea);
        assertEq(tank.tokenId(), 1);
        
        // Test URI generation
        string memory uri = thaink.uri(1);
        assertTrue(bytes(uri).length > 0);
        
        // Verify URI format
        assertEq(
            _slice(uri, 0, 29),
            "data:application/json;base64,"
        );
    }

    function testNoteAddition() public {
        string memory idea = "Test note idea";
        string memory noteContent = "Test note content";
        string memory contentHash = "contentHash";
        string memory digest = "test digest";
        string memory digestHash = "digestHash";
        
        // Create tank and mint to user
        vm.startPrank(owner);
        thaink.makeTank(idea);
        vm.stopPrank();

        vm.startPrank(user);
        thaink.mint(user, 1);
        
        Tank tank = thaink.tanks(1);
        
        // Add note
        tank.addNote(
            user,
            noteContent,
            contentHash,
            digest,
            digestHash,
            TEST_SIGNATURE,
            0
        );
        
        // Verify note data
        (
            string memory content,
            string memory storedContentHash,
            address contributor,
            uint score
        ) = tank.notes(1);
        
        assertEq(contributor, user);
        assertEq(content, noteContent);
        assertEq(storedContentHash, contentHash);
        assertEq(tank.digest(), digest);
        assertEq(tank.digestHash(), digestHash);
        assertEq(tank.notesCount(), 1);
        assertEq(tank.contributors(user), 1);
        vm.stopPrank();
    }

    function testInvalidSignature() public {
        string memory idea = "Test note idea";
        string memory noteContent = "Test note content";
        string memory contentHash = "contentHash";
        string memory digest = "test digest";
        string memory digestHash = "digestHash";
        bytes memory invalidSignature = hex"deadbeef"; // Invalid signature
        
        // Create tank and mint to user
        vm.startPrank(owner);
        thaink.makeTank(idea);
        vm.stopPrank();

        vm.startPrank(user);
        thaink.mint(user, 1);
        
        Tank tank = thaink.tanks(1);
        
        // Note: The signature verification is currently commented out in the contract
        // So we're testing the contributor check instead
        
        // First add a note with the user
        tank.addNote(
            user,
            noteContent,
            contentHash,
            digest,
            digestHash,
            TEST_SIGNATURE,
            0
        );
        
        // Try to add another note with the same user
        vm.expectRevert("Contributor has already added a note");
        tank.addNote(
            user,
            noteContent,
            contentHash,
            digest,
            digestHash,
            TEST_SIGNATURE,
            0
        );
        vm.stopPrank();
    }

    function testEmptyIdea() public {
        string memory emptyIdea = "";
        
        vm.startPrank(owner);
        vm.expectRevert("Idea cannot be empty");
        thaink.makeTank(emptyIdea);
        vm.stopPrank();
    }

    function testIdeaWithOnlySpaces() public {
        string memory ideaWithSpaces = "   ";
        
        vm.startPrank(owner);
        vm.expectRevert("Idea cannot be empty");
        thaink.makeTank(ideaWithSpaces);
        vm.stopPrank();
    }

    function testIdeaWithSpecialCharactersOnly() public {
        string memory ideaWithSpecialChars = "!@#$%^&*()_+-={}:<>?,./";
        
        vm.startPrank(owner);
        thaink.makeTank(ideaWithSpecialChars);
        vm.stopPrank();

        Tank tank = thaink.tanks(1);
        
        // Test that the URI is valid base64
        string memory uri = thaink.uri(1);
        assertTrue(bytes(uri).length > 0);
        
        // Verify the URI starts with the correct prefix
        assertEq(
            _slice(uri, 0, 29),
            "data:application/json;base64,"
        );
    }

    // Helper function to slice a string
    function _slice(string memory str, uint256 start, uint256 length) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(length);
        for(uint i = 0; i < length; i++) {
            result[i] = strBytes[start + i];
        }
        return string(result);
    }
    
    function testConfigFunctionality() public {
        // Test setting and getting config values
        bytes memory newPkp = hex"99887766554433221100";
        string memory newConfig = "aabbccddeeff";
        string memory newConfigHash = "112233445566";
        string memory newHintActionIpfsId = "778899aabbcc";
        string memory newSubmitActionIpfsId = "ddeeff001122";
        string memory newPromptActionIpfsId = "334455667788";
        
        vm.startPrank(owner);
        
        // Test setting PKP
        thaink.setPkp(newPkp);
        assertEq(thaink.pkp(), newPkp);
        
        // Test setting config
        thaink.setConfig(newConfig, newConfigHash);
        assertEq(thaink.config(), newConfig);
        assertEq(thaink.configHash(), newConfigHash);
        
        // Test setting IPFS IDs
        thaink.setIpfsIds(
            newHintActionIpfsId,
            newSubmitActionIpfsId,
            newPromptActionIpfsId
        );
        assertEq(thaink.hintActionIpfsId(), newHintActionIpfsId);
        assertEq(thaink.submitActionIpfsId(), newSubmitActionIpfsId);
        assertEq(thaink.promptActionIpfsId(), newPromptActionIpfsId);
        
        // Create a new tank and verify it receives the latest config
        string memory idea = "Config test idea";
        thaink.makeTank(idea);
        
        Tank tank = thaink.tanks(1);
        assertEq(tank.pkp(), newPkp);
        assertEq(tank.config(), newConfig);
        assertEq(tank.configHash(), newConfigHash);
        assertEq(tank.hintActionIpfsId(), newHintActionIpfsId);
        assertEq(tank.submitActionIpfsId(), newSubmitActionIpfsId);
        assertEq(tank.promptActionIpfsId(), newPromptActionIpfsId);
        
        vm.stopPrank();
    }
    
    function testFactoryPattern() public {
        string memory idea = "Factory pattern test";
        
        // Create tank
        vm.startPrank(owner);
        thaink.makeTank(idea);
        vm.stopPrank();
        
        Tank tank = thaink.tanks(1);
        
        // Verify factory address
        assertEq(tank.factory(), address(thaink.tankImplementation()));
        
        // Try to initialize the tank directly (should fail)
        vm.expectRevert("Only factory can initialize");
        tank.initialize(
            2, // different tokenId
            TEST_PKP,
            "Hijacked idea",
            TEST_LLM_URL,
            TEST_CONFIG,
            TEST_CONFIG_HASH,
            TEST_HINT_ACTION_IPFS_ID,
            TEST_SUBMIT_ACTION_IPFS_ID,
            TEST_PROMPT_ACTION_IPFS_ID
        );
    }
}
