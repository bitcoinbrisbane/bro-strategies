// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IUniswapV2LikeRouter } from "../../dependencies/swap/IUniswapV2LikeRouter.sol";
// import { ITraderJoeLBRouter } from "../../dependencies/traderjoe/ITraderJoeLBRouter.sol";
import { IERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import { SafeERC20Upgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { ISwapRouter } from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

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
