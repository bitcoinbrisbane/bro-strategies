// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { DCABaseUpgradeableCutted } from "../base/DCABaseUpgradeableCutted.sol";
import { DCABaseUpgradeable } from "../base/DCABaseUpgradeable.sol";
// import { IAltPool } from "../../../dependencies/platypus/IAltPool.sol";
// import { IMasterPlatypusV4 } from "../../../dependencies/platypus/IMasterPlatypusV4.sol";
// import { SwapLib } from "../libraries/SwapLib.sol";
// import { InvestableLib } from "../../../oracleBasedFramework/libraries/InvestableLib.sol";

import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

struct TokenDesc {
    uint256 total;
    uint256 acquired;
}

interface IAltPool {
    function deposit(
        address token,
        uint256 amount,
        address to,
        uint256 deadline
    ) external returns (uint256 liquidity);

    function withdraw(
        address token,
        uint256 liquidity,
        uint256 minimumAmount,
        address to,
        uint256 deadline
    ) external returns (uint256 amount);
}

interface IMasterPlatypusV4 {
    struct UserInfo {
        uint128 amount; // How many LP tokens the user has provided.
        uint128 factor;
        uint128 rewardDebt;
        uint128 claimablePtp;
    }

    function deposit(uint256 _pid, uint256 _amount)
        external
        returns (uint256 reward, uint256[] memory additionalRewards);

    function multiClaim(uint256[] memory _pids)
        external
        returns (
            uint256 reward,
            uint256[] memory amounts,
            uint256[][] memory additionalRewards
        );

    function withdraw(uint256 _pid, uint256 _amount)
        external
        returns (uint256 reward, uint256[] memory additionalRewards);

    function getUserInfo(uint256 _pid, address _user)
        external
        view
        returns (UserInfo memory);

    function pendingTokens(uint256 _pid, address _user)
        external
        view
        returns (
            uint256 pendingPtp,
            IERC20Upgradeable[] memory bonusTokenAddresses,
            string[] memory bonusTokenSymbols,
            uint256[] memory pendingBonusTokens
        );
}

interface ITraderJoeRouter {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapExactAVAXForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function swapExactTokensForAVAX(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        );

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);
}

library SwapLib {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    enum Dex {
        TraderJoeV2
    }

    struct Router {
        Dex dex;
        address router;
    }

    function swapTokensForTokens(
        Router memory router,
        uint256 amountIn,
        address[] memory path
    ) internal returns (uint256 amountOut) {
        if (router.dex == Dex.TraderJoeV2) {
            ITraderJoeRouter traderjoeRouter = ITraderJoeRouter(router.router);

            IERC20Upgradeable(path[0]).safeIncreaseAllowance(
                address(traderjoeRouter),
                amountIn
            );

            amountOut = traderjoeRouter.swapExactTokensForTokens(
                amountIn,
                0,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[path.length - 1];
        } else {
            // solhint-disable-next-line reason-string
            revert("SwapLib: Invalid swap service provider");
        }
    }

    function swapAvaxForTokens(
        Router memory router,
        uint256 amountIn,
        address[] memory path
    ) internal returns (uint256 amountOut) {
        if (router.dex == Dex.TraderJoeV2) {
            amountOut = ITraderJoeRouter(router.router).swapExactAVAXForTokens{
                value: amountIn
            }(
                0,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[path.length - 1];
        } else {
            // solhint-disable-next-line reason-string
            revert("SwapLib: Invalid swap service provider");
        }
    }

    function swapTokensForAvax(
        Router memory router,
        uint256 amountIn,
        address[] memory path
    ) internal returns (uint256 amountOut) {
        if (router.dex == Dex.TraderJoeV2) {
            ITraderJoeRouter traderjoeRouter = ITraderJoeRouter(router.router);

            IERC20Upgradeable(path[0]).safeIncreaseAllowance(
                address(traderjoeRouter),
                amountIn
            );

            amountOut = traderjoeRouter.swapExactTokensForAVAX(
                amountIn,
                0,
                path,
                address(this),
                // solhint-disable-next-line not-rely-on-time
                block.timestamp
            )[path.length - 1];
        } else {
            // solhint-disable-next-line reason-string
            revert("SwapLib: Invalid swap service provider");
        }
    }

    function getAmountOut(
        Router memory router,
        uint256 amountIn,
        address[] memory path
    ) internal view returns (uint256) {
        if (router.dex == Dex.TraderJoeV2) {
            return
                ITraderJoeRouter(router.router).getAmountsOut(amountIn, path)[
                    path.length - 1
                ];
        } else {
            // solhint-disable-next-line reason-string
            revert("SwapLib: Invalid swap service provider");
        }
    }
}

library InvestableLib {
    address public constant NATIVE_AVAX =
        0x0000000000000000000000000000000000000001;
    address public constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    address public constant USDT = 0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7;
    address public constant USDC = 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E;

    uint8 public constant PRICE_PRECISION_DIGITS = 6;
    uint256 public constant PRICE_PRECISION_FACTOR = 10**PRICE_PRECISION_DIGITS;

    function convertPricePrecision(
        uint256 price,
        uint256 currentPrecision,
        uint256 desiredPrecision
    ) internal pure returns (uint256) {
        if (currentPrecision > desiredPrecision)
            return (price / (currentPrecision / desiredPrecision));
        else if (currentPrecision < desiredPrecision)
            return price * (desiredPrecision / currentPrecision);
        else return price;
    }

    function calculateMintAmount(
        uint256 equitySoFar,
        uint256 amountInvestedNow,
        uint256 investmentTokenSupplySoFar
    ) internal pure returns (uint256) {
        if (investmentTokenSupplySoFar == 0) return amountInvestedNow;
        else
            return
                (amountInvestedNow * investmentTokenSupplySoFar) / equitySoFar;
    }
}

contract WBTCBluechip is UUPSUpgradeable, DCABaseUpgradeableCutted {
    using SwapLib for SwapLib.Router;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct PlatypusInfo {
        IAltPool altPoolBTC;
        IMasterPlatypusV4 masterPlatypusV4;
        IERC20Upgradeable altBtcLpToken;
        IERC20Upgradeable platypusToken;
        uint256 poolId;
    }

    TokenInfo public bluechipTokenInfo;

    PlatypusInfo public platypusInfo;

    address[] public ptpIntoBluechipSwapPath;
    address[] public avaxIntoBluechipSwapPath;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        DCAStrategyInitArgs calldata args,
        TokenInfo calldata bluechipTokenInfo_,
        PlatypusInfo calldata platypusInfo_,
        address[] calldata ptpIntoBluechipSwapPath_,
        address[] calldata avaxIntoBluechipSwapPath_
    ) external initializer {
        __UUPSUpgradeable_init();
        __DCABaseUpgradeable_init(args);

        bluechipTokenInfo = bluechipTokenInfo_;
        platypusInfo = platypusInfo_;
        ptpIntoBluechipSwapPath = ptpIntoBluechipSwapPath_;
        avaxIntoBluechipSwapPath = avaxIntoBluechipSwapPath_;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // ----- Base Contract Overrides -----
    function _invest(uint256 amount)
        internal
        virtual
        override
        returns (uint256 receivedAltLp)
    {
        // 1. Approve bluechip to alt pool
        bluechipTokenInfo.token.safeIncreaseAllowance(
            address(platypusInfo.altPoolBTC),
            amount
        );

        // 2. Deposit bluechip into alt pool. Receive minted alt pool lp token
        receivedAltLp = platypusInfo.altPoolBTC.deposit(
            address(bluechipTokenInfo.token),
            amount,
            address(this),
            // solhint-disable-next-line not-rely-on-time
            block.timestamp
        );

        // 3. Approve alt lp token to master platypus
        platypusInfo.altBtcLpToken.safeIncreaseAllowance(
            address(platypusInfo.masterPlatypusV4),
            receivedAltLp
        );

        // 4. Deposit alt lp into master platypus
        platypusInfo.masterPlatypusV4.deposit(
            platypusInfo.poolId,
            receivedAltLp
        );
    }

    function _claimRewards() internal virtual override returns (uint256) {
        // fetch earned rewards
        (
            uint256 pendingPtp,
            ,
            ,
            uint256[] memory pendingBonusTokens
        ) = platypusInfo.masterPlatypusV4.pendingTokens(
                platypusInfo.poolId,
                address(this)
            );

        // check if we can claim something
        if (pendingPtp == 0 && pendingBonusTokens[0] == 0) {
            return 0;
        }

        uint256[] memory pids = new uint256[](1);
        pids[0] = platypusInfo.poolId;

        // 1. Claim rewards from master platypus
        platypusInfo.masterPlatypusV4.multiClaim(pids);

        // 2. Receive native avax + ptp token rewards
        uint256 receivedPtp = platypusInfo.platypusToken.balanceOf(
            address(this)
        );

        // 3. Swap received rewawrds into bluechip
        return _swapRewards(receivedPtp);
    }

    function _withdrawInvestedBluechip(uint256 amount)
        internal
        virtual
        override
        returns (uint256 receivedBluechip)
    {
        // 1. Unstake alp lp from master platypus
        platypusInfo.masterPlatypusV4.withdraw(platypusInfo.poolId, amount);

        // 2. Approve alt lp to alt pool btc
        platypusInfo.altBtcLpToken.safeIncreaseAllowance(
            address(platypusInfo.altPoolBTC),
            amount
        );

        // 3. Withdraw bluechip from alt pool btc
        receivedBluechip = platypusInfo.altPoolBTC.withdraw(
            address(bluechipTokenInfo.token),
            amount,
            0,
            address(this),
            // solhint-disable-next-line not-rely-on-time
            block.timestamp
        );
    }

    function _transferBluechip(address to, uint256 amount)
        internal
        virtual
        override
    {
        bluechipTokenInfo.token.safeTransfer(to, amount);
    }

    function _totalBluechipInvested()
        internal
        view
        virtual
        override
        returns (uint256)
    {
        if (bluechipInvestmentState == BluechipInvestmentState.Investing) {
            // in case of investing all bluechip funds are invested into master platypus
            return
                platypusInfo
                    .masterPlatypusV4
                    .getUserInfo(platypusInfo.poolId, address(this))
                    .amount;
        }

        if (bluechipInvestmentState == BluechipInvestmentState.Withdrawn) {
            // in case of withdrawn all bluechip is hodling on contract balance
            return bluechipTokenInfo.token.balanceOf(address(this));
        }

        // When emergency exit was triggered the strategy
        // no longer holds any bluechip asset
        return 0;
    }

    function _bluechipAddress()
        internal
        view
        virtual
        override
        returns (address)
    {
        return address(bluechipTokenInfo.token);
    }

    function _bluechipDecimals()
        internal
        view
        virtual
        override
        returns (uint8)
    {
        return bluechipTokenInfo.decimals;
    }

    // ----- Private Helper Functions -----
    function _swapRewards(uint256 ptpReward)
        private
        returns (uint256 receivedBleuchip)
    {
        // uint256 ptpToBluechip = router.getAmountOut(
        //     ptpReward,
        //     ptpIntoBluechipSwapPath
        // );
        uint256 ptpToBluechip = 0;
        if (ptpToBluechip > 0) {
            // receivedBleuchip += router.swapTokensForTokens(
            //     ptpReward,
            //     ptpIntoBluechipSwapPath,
            //     new uint256[](1) // assuming swap path with length of 2
            // );
            receivedBleuchip = 0;
        }

        // uint256 avaxToBluechip = router.getAmountOut(
        //     address(this).balance,
        //     avaxIntoBluechipSwapPath
        // );
        uint256 avaxToBluechip = 0;
        if (avaxToBluechip > 0) {
            // receivedBleuchip += router.swapNativeForTokens(
            //     address(this).balance,
            //     avaxIntoBluechipSwapPath
            // );
        }
    }

    // ----- Setter Functions -----
    function setRewardsSwapPath(
        address[] memory newPtpIntoAvaxSwapPath,
        address[] memory newAvaxIntoBluechipSwapPath
    ) external onlyOwner {
        ptpIntoBluechipSwapPath = newPtpIntoAvaxSwapPath;
        avaxIntoBluechipSwapPath = newAvaxIntoBluechipSwapPath;
    }

    function _setBluechipTokenInfo(TokenInfo memory newBluechipTokenInfo)
        private
    {
        require(
            address(newBluechipTokenInfo.token) != address(0),
            "Invalid bluechip token address"
        );
        bluechipTokenInfo = newBluechipTokenInfo;
    }

    function setPlatypusInfo(PlatypusInfo memory newPlatypusInfo) private {
        require(
            address(newPlatypusInfo.altPoolBTC) != address(0) &&
                address(newPlatypusInfo.masterPlatypusV4) != address(0) &&
                address(newPlatypusInfo.altBtcLpToken) != address(0) &&
                address(newPlatypusInfo.platypusToken) != address(0),
            "Invalid Platypus info"
        );
        platypusInfo = newPlatypusInfo;
    }

    function _setRewardsSwapPath(
        address[] memory newPtpIntoAvaxSwapPath,
        address[] memory newAvaxIntoBluechipSwapPath
    ) private {
        // require(
        //     newPtpIntoAvaxSwapPath[0] == address(platypusInfo.platypusToken) &&
        //         newPtpIntoAvaxSwapPath[newPtpIntoAvaxSwapPath.length - 1] ==
        //         address(bluechipTokenInfo.token) &&
        //         newAvaxIntoBluechipSwapPath[0] == InvestableLib.AVALANCHE_WAVAX &&
        //         newAvaxIntoBluechipSwapPath[
        //             newAvaxIntoBluechipSwapPath.length - 1
        //         ] ==
        //         address(bluechipTokenInfo.token),
        //     "Invalid swap path"
        // );

        ptpIntoBluechipSwapPath = newPtpIntoAvaxSwapPath;
        avaxIntoBluechipSwapPath = newAvaxIntoBluechipSwapPath;
    }
}
