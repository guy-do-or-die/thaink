// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

// Interfaces for Uniswap V4
interface IPoolManager {
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

    function initialize(PoolKey memory key, uint160 sqrtPriceX96) external returns (int24 tick);
    function swap(
        PoolKey memory key,
        SwapParams memory params,
        bytes calldata hookData
    ) external returns (int256 amount0, int256 amount1);
    function mint(
        PoolKey memory key,
        int24 tickLower,
        int24 tickUpper,
        uint128 amount,
        bytes calldata hookData
    ) external returns (uint256 amount0, uint256 amount1);
    function getPrice(PoolKey memory key) external view returns (uint160 sqrtPriceX96);
}

interface IPoolManagerFactory {
    function createPoolManager() external returns (address);
}

contract Token is ERC20 {
    // Storage for name and symbol that can be updated
    string private _customName;
    string private _customSymbol;
    bool private _nameSymbolSet;
    // Constants
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1 million tokens with 18 decimals
    uint256 public constant NOTE_TOKEN_PRICE = 1 * 10**18; // 1 token required to add a note
    
    // Uniswap V4 related variables
    address public poolManager;
    IPoolManager.PoolKey public poolKey;
    address public immutable WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2; // Mainnet WETH address
    uint24 public constant POOL_FEE = 3000; // 0.3% fee tier
    
    // No longer need a reference to Rewards as Tank will inherit from it directly
    
    // Factory address for security checks
    address public immutable factory;
    
    // Events
    event TokenPurchased(address buyer, uint256 ethAmount, uint256 tokenAmount);
    
    constructor() ERC20("", "") {
        factory = msg.sender;
    }
    
    function initializeToken(
        string memory _name,
        string memory _symbol,
        address _poolManagerFactory
    ) public payable {
        require(msg.sender == factory, "Only factory can initialize");
        
        // Set token name and symbol
        _setNameAndSymbol(_name, _symbol);
        
        // Mint initial supply to the contract itself
        _mint(address(this), INITIAL_SUPPLY);
        
        // Create Uniswap V4 pool if a factory address is provided
        if (_poolManagerFactory != address(0)) {
            // Create a pool manager through the factory
            poolManager = IPoolManagerFactory(_poolManagerFactory).createPoolManager();
            
            // Initialize the pool
            poolKey = IPoolManager.PoolKey({
                currency0: address(this),
                currency1: WETH,
                fee: POOL_FEE,
                tickSpacing: 60, // Standard tick spacing for 0.3% fee tier
                hooks: address(0) // No hooks for simplicity
            });
            
            // Initialize the pool with a price of 1 token = 0.0001 ETH (example price)
            // sqrtPriceX96 = sqrt(price) * 2^96
            uint160 sqrtPriceX96 = 79228162514264337593543950336; // Represents price of 0.0001 ETH per token
            IPoolManager(poolManager).initialize(poolKey, sqrtPriceX96);
            
            // Add liquidity to the pool if ETH was sent with the transaction
            if (msg.value > 0) {
                addLiquidityToPool(msg.value);
            }
        }
    }
    
    // Function to buy tokens for ETH
    function buyTokenForNote() external payable virtual returns (bool) {
        require(msg.value > 0, "Must send ETH to buy tokens");
        require(poolManager != address(0), "Pool not initialized");
        
        // Get the current price from the pool
        uint160 sqrtPriceX96 = IPoolManager(poolManager).getPrice(poolKey);
        uint256 price = uint256(sqrtPriceX96) ** 2 / (2**192); // Convert sqrtPriceX96 to actual price
        
        // Calculate how many tokens the user gets for their ETH
        uint256 tokenAmount = NOTE_TOKEN_PRICE; // Always 1 token for a note
        uint256 ethRequired = tokenAmount * price / (10**18);
        
        require(msg.value >= ethRequired, "Not enough ETH sent");
        
        // Transfer token to the user
        require(transfer(msg.sender, tokenAmount), "Token transfer failed");
        
        // Refund excess ETH if any
        uint256 excess = msg.value - ethRequired;
        if (excess > 0) {
            (bool success, ) = msg.sender.call{value: excess}("");
            require(success, "ETH refund failed");
        }
        
        // Note: The ETH is kept in this contract and will be handled by the Rewards functionality
        // that the Tank contract inherits
        
        emit TokenPurchased(msg.sender, ethRequired, tokenAmount);
        
        return true;
    }
    
    // Reward allocation will be handled by the Tank contract through Rewards inheritance
    
    function addLiquidityToPool(uint256 ethAmount) internal {
        // Calculate token amount based on the desired price ratio
        // For simplicity, we're using a 1:0.0001 ratio (10,000 tokens per ETH)
        uint256 tokenAmount = ethAmount * 10000;
        
        // Ensure we have enough tokens
        require(tokenAmount <= balanceOf(address(this)), "Not enough tokens for liquidity");
        
        // Add liquidity in a wide range around the current price
        int24 tickLower = -887220; // Min tick for full range
        int24 tickUpper = 887220;  // Max tick for full range
        
        // Approve tokens for the pool manager
        _approve(address(this), poolManager, tokenAmount);
        
        // Add liquidity
        IPoolManager(poolManager).mint(
            poolKey,
            tickLower,
            tickUpper,
            uint128(tokenAmount),
            ""
        );
    }
    
    // Function to check if a user has a token for adding a note
    function hasNoteToken(address user) public view returns (bool) {
        return balanceOf(user) >= NOTE_TOKEN_PRICE;
    }
    
    // Function to burn a token when a note is added
    function burnNoteToken(address user) internal returns (bool) {
        require(balanceOf(user) >= NOTE_TOKEN_PRICE, "Not enough tokens");
        _burn(user, NOTE_TOKEN_PRICE);
        return true;
    }
    
    // Allow the contract to receive ETH
    /**
     * @dev Sets the name and symbol of the token
     * @param name_ The name of the token
     * @param symbol_ The symbol of the token
     */
    function _setNameAndSymbol(string memory name_, string memory symbol_) internal {
        require(!_nameSymbolSet, "Name and symbol already set");
        _customName = name_;
        _customSymbol = symbol_;
        _nameSymbolSet = true;
    }
    
    /**
     * @dev Returns the name of the token.
     * Overrides the ERC20 implementation to use our custom name.
     */
    function name() public view virtual override returns (string memory) {
        return _nameSymbolSet ? _customName : super.name();
    }

    /**
     * @dev Returns the symbol of the token.
     * Overrides the ERC20 implementation to use our custom symbol.
     */
    function symbol() public view virtual override returns (string memory) {
        return _nameSymbolSet ? _customSymbol : super.symbol();
    }
}
