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

    function setUp() public {
        thaink = new Thaink();
        owner = thaink.owner();
        user = makeAddr("user");
        user2 = makeAddr("user2");
    }

    function testTankCreationAndMinting() public {
        // Only owner can create tanks
        vm.startPrank(user);
        vm.expectRevert(abi.encodeWithSelector(OwnableUnauthorizedAccount.selector, user));
        thaink.makeTank();
        vm.stopPrank();

        // Create tank ID 0
        vm.startPrank(owner);
        thaink.makeTank();
        vm.stopPrank();

        // Cannot create same tank twice
        vm.startPrank(owner);
        vm.expectRevert("Tank already exists");
        thaink.makeTank();
        vm.stopPrank();

        // Cannot mint non-existent tank
        vm.startPrank(user);
        vm.expectRevert("Tank does not exist");
        thaink.mint(user, 1);
        vm.stopPrank();

        // Anyone can mint existing tank
        vm.startPrank(user);
        thaink.mint(user, 0);
        vm.stopPrank();

        vm.startPrank(user2);
        thaink.mint(user2, 0);
        vm.stopPrank();

        // Verify balances
        assertEq(thaink.balanceOf(user, 0), 1);
        assertEq(thaink.balanceOf(user2, 0), 1);

    }

    function testMetadata() public {
        vm.startPrank(owner);
        thaink.makeTank();
        vm.stopPrank();

        vm.startPrank(user);
        thaink.mint(user, 1);
        vm.stopPrank();

        Tank tank = thaink.tanks(1);
        
        string memory svg = tank.getImage();
        assertTrue(bytes(svg).length > 0);
        assertTrue(
            bytes(thaink.uri(1)).length > 0,
            "URI generation should succeed"
        );
    }
}
