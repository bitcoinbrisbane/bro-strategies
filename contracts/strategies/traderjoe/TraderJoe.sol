//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../../common/bases/StrategyOwnablePausableBaseUpgradeable.sol";
import "../../dependencies/traderjoe/ITraderJoeMasterChef.sol";
import "../../dependencies/traderjoe/ITraderJoeRouter.sol";
import "../../dependencies/traderjoe/ITraderJoePair.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract TraderJoe is UUPSUpgradeable, StrategyOwnablePausableBaseUpgradeable {
    using SafeERC20Upgradeable for IInvestmentToken;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    error InvalidTraderJoeLpToken();

    // solhint-disable-next-line const-name-snakecase
    string public constant name =
        "brokkr.traderjoe_strategy.traderjoe_strategy_v1.0.0";
    // solhint-disable-next-line const-name-snakecase
    string public constant humanReadableName = "TraderJoe Strategy";
    // solhint-disable-next-line const-name-snakecase
    string public constant version = "1.0.0";

    ITraderJoeRouter public router;
    IERC20Upgradeable public pairDepositToken;
    ITraderJoePair public lpToken;
    ITraderJoeMasterChef public masterChef;
    IERC20Upgradeable public joeToken;
    uint256 public farmId;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        StrategyArgs calldata strategyArgs,
        ITraderJoeRouter router_,
        ITraderJoeMasterChef masterChef_,
        ITraderJoePair lpToken_,
        IERC20Upgradeable joeToken_
    ) external initializer {
        __StrategyOwnablePausableBaseUpgradeable_init(strategyArgs);

        router = router_;
        masterChef = masterChef_;
        lpToken = lpToken_;
        joeToken = joeToken_;

        address token0 = lpToken.token0();
        if (token0 != address(depositToken)) {
            pairDepositToken = IERC20Upgradeable(token0);
        } else {
            pairDepositToken = IERC20Upgradeable(lpToken.token1());
        }

        ITraderJoeMasterChef.PoolInfo memory poolInfo;
        uint256 poolLength = masterChef.poolLength();
        for (uint256 i = 0; i < poolLength; i++) {
            poolInfo = masterChef.poolInfo(i);
            if (address(poolInfo.lpToken) == address(lpToken)) {
                farmId = i;
                break;
            }
        }
        if (address(poolInfo.lpToken) != address(lpToken)) {
            revert InvalidTraderJoeLpToken();
        }
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    function _deposit(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        uint256 swapAmount = amount / 2;
        address[] memory path = new address[](2);
        path[0] = address(depositToken);
        path[1] = address(pairDepositToken);

        uint256 pairDepositTokenDesired = swapExactTokensForTokens(
            swapService,
            swapAmount,
            path
        );
        uint256 depositTokenDesired = amount - swapAmount;
        uint256 pairDepositTokenMin = (pairDepositTokenDesired * 99) / 100;
        uint256 depositTokenMin = (depositTokenDesired * 99) / 100;

        pairDepositToken.approve(address(router), pairDepositTokenDesired);
        depositToken.approve(address(router), depositTokenDesired);
        (, , uint256 lpBalance) = router.addLiquidity(
            address(pairDepositToken),
            address(depositToken),
            pairDepositTokenDesired,
            depositTokenDesired,
            pairDepositTokenMin,
            depositTokenMin,
            address(this),
            block.timestamp
        );

        lpToken.approve(address(masterChef), lpBalance);
        masterChef.deposit(farmId, lpBalance);
    }

    function _withdraw(uint256 amount, NameValuePair[] calldata)
        internal
        virtual
        override
    {
        uint256 lpBalanceToWithdraw = (getTraderJoeLpBalance() * amount) /
            getInvestmentTokenSupply();

        (
            uint256 depositTokenReserve,
            uint256 pairDepositTokenReserve
        ) = getTraderJoeLpReserves();
        uint256 lpTotalSupply = lpToken.totalSupply();
        uint256 pairDepositTokenMin = (lpBalanceToWithdraw *
            pairDepositTokenReserve) / lpTotalSupply;
        uint256 depositTokenMin = (lpBalanceToWithdraw * depositTokenReserve) /
            lpTotalSupply;

        uint256 pairDepositTokenBalanceBefore = pairDepositToken.balanceOf(
            address(this)
        );
        masterChef.withdraw(farmId, lpBalanceToWithdraw);
        lpToken.approve(address(router), lpBalanceToWithdraw);
        router.removeLiquidity(
            address(pairDepositToken),
            address(depositToken),
            lpBalanceToWithdraw,
            pairDepositTokenMin,
            depositTokenMin,
            address(this),
            block.timestamp
        );
        uint256 pairDepositTokenBalanceAfter = pairDepositToken.balanceOf(
            address(this)
        );

        uint256 pairDepositTokenBalanceIncrement = pairDepositTokenBalanceAfter -
                pairDepositTokenBalanceBefore;
        address[] memory path = new address[](2);
        path[0] = address(pairDepositToken);
        path[1] = address(depositToken);

        swapExactTokensForTokens(
            swapService,
            pairDepositTokenBalanceIncrement,
            path
        );
    }

    function _reapReward(NameValuePair[] calldata) internal virtual override {
        masterChef.deposit(farmId, 0);

        address[] memory path = new address[](3);
        path[0] = address(joeToken);
        path[1] = address(0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7); // USDT
        path[2] = address(depositToken);

        swapExactTokensForTokens(
            swapService,
            joeToken.balanceOf(address(this)),
            path
        );
    }

    function getAssetBalances()
        external
        view
        virtual
        override
        returns (Balance[] memory assetBalances)
    {
        assetBalances = new Balance[](1);
        assetBalances[0] = Balance(address(lpToken), getTraderJoeLpBalance());
    }

    function getLiabilityBalances()
        external
        view
        virtual
        override
        returns (Balance[] memory liabilityBalances)
    {}

    function getAssetValuations(bool shouldMaximise, bool shouldIncludeAmmPrice)
        public
        view
        virtual
        override
        returns (Valuation[] memory assetValuations)
    {
        (
            uint256 depositTokenReserve,
            uint256 pairDepositTokenReserve
        ) = getTraderJoeLpReserves();

        uint256 lpBalance = getTraderJoeLpBalance();
        uint256 lpTotalSupply = lpToken.totalSupply();

        uint256 depositTokenValuation = (lpBalance * depositTokenReserve) /
            lpTotalSupply;
        uint256 pairDepositTokenValuation = (((lpBalance *
            pairDepositTokenReserve) / lpTotalSupply) *
            priceOracle.getPrice(
                pairDepositToken,
                shouldMaximise,
                shouldIncludeAmmPrice
            )) / InvestableLib.PRICE_PRECISION_FACTOR;

        assetValuations = new Valuation[](1);
        assetValuations[0] = Valuation(
            address(lpToken),
            depositTokenValuation + pairDepositTokenValuation
        );
    }

    function getLiabilityValuations(bool, bool)
        public
        view
        virtual
        override
        returns (Valuation[] memory liabilityValuations)
    {}

    function getTraderJoeLpBalance() public view returns (uint256) {
        return masterChef.userInfo(farmId, address(this)).amount;
    }

    function getTraderJoeLpReserves()
        public
        view
        returns (uint256 depositTokenReserve, uint256 pairDepositTokenReserve)
    {
        (uint256 reserve0, uint256 reserve1, ) = lpToken.getReserves();

        if (lpToken.token0() == address(depositToken)) {
            return (reserve0, reserve1);
        } else {
            return (reserve1, reserve0);
        }
    }
}
