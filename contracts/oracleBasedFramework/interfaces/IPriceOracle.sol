// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import { IERC20UpgradeableExt } from "./IERC20UpgradeableExt.sol";

interface IPriceOracle {
    error InvalidAssetPrice();

    function getPrice(
        IERC20UpgradeableExt baseToken,
        IERC20UpgradeableExt quoteToken,
        uint8 precisionDigits,
        bool shouldMaximise,
        bool includeAmmPrice
    ) external view returns (uint256);

    function setVendorFeed(address vendorFeed_) external;
}
