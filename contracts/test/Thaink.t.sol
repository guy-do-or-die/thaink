pragma solidity ^0.8.28;

import "forge-std/Test.sol";

import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

import "../src/Thaink.sol";
import "../src/Tank.sol";


contract ThainkTest is Test, ERC1155Holder {
    Thaink public thaink;
    address public owner;
    address public user;
    address public user2;

    error OwnableUnauthorizedAccount(address account);
    error IdeaTooLong(uint256 length, uint256 maxLength);

    function setUp() public {
        thaink = new Thaink();
        owner = thaink.owner();
        user = makeAddr("user");
        user2 = makeAddr("user2");
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
        uint noteValue = 100;
        string memory digest = "test digest";
        
        // Create tank and mint to user
        vm.startPrank(owner);
        thaink.makeTank(idea);
        vm.stopPrank();

        vm.startPrank(user);
        thaink.mint(user, 1);
        
        Tank tank = thaink.tanks(1);
        
        // Add note
        tank.addNote(user, noteContent, noteValue, digest);
        
        // Verify note data
        (uint timestamp, address contributor, string memory content, uint value) = tank.notes(1);
        assertEq(contributor, user);
        assertEq(content, noteContent);
        assertEq(value, noteValue);
        assertEq(tank.digest(), digest);
        assertEq(tank.notesCount(), 1);
        assertEq(tank.contributors(user), 1);
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
}
