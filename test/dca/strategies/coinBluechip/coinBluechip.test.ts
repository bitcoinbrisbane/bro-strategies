import { ethers } from "hardhat"
import { deployUUPSUpgradeableContract } from "../../../../scripts/contracts/core/deploy"
import { getTokenContract } from "../../../../scripts/helper/helper"
import { Arbitrum } from "../../chains/Arbitrum"
import { Avalanche } from "../../chains/Avalanche"
import { currentBlockchainTime, testDcaStrategy } from "../Strategy.test"
import { depositEthHoldBtcConfigAvalanche } from "./config/depositEthHoldBtcConfigAvalanche"
import { depositUsdcHoldBtcConfigArbitrum } from "./config/depositUsdcHoldBtcConfigArbitrum"
import { depositUsdcHoldBtcConfigAvalanche } from "./config/depositUsdcHoldBtcConfigAvalanche"
import { depositUsdcHoldEthConfigAvalanche } from "./config/depositUsdcHoldEthConfigAvalanche"
// import { prodDeploymentConfig } from "./config/prodDeploymentConfig"

getTokenContract
depositUsdcHoldEthConfigAvalanche
depositUsdcHoldBtcConfigAvalanche
depositEthHoldBtcConfigAvalanche
depositUsdcHoldBtcConfigArbitrum
Avalanche
Arbitrum

// // prod deployments
// testDcaStrategy(
//   "CoinBluechip usdc -> arb DCA Strategy on Arbitrum (Production contract)",
//   deployCoinBluechipDcaStrategy,
//   [],
//   prodDeploymentConfig("arbitrum", "usdc_arb_prod.json"),
//   Arbitrum()
// )

// test deployments
// testDcaStrategy(
//   "CoinBluechip usdc -> btc DCA Strategy on Arbitrum",
//   deployCoinBluechipDcaStrategy,
//   [],
//   depositUsdcHoldBtcConfigArbitrum(),
//   Arbitrum()
// )
testDcaStrategy(
  "CoinBluechip usdc -> btc DCA Strategy on Avalanche",
  deployCoinBluechipDcaStrategy,
  [],
  depositUsdcHoldBtcConfigAvalanche(),
  Avalanche()
)

async function deployCoinBluechipDcaStrategy(testConfig: any) {
  const signers = await ethers.getSigners()

  // get current blue chip deployment
  // 
  // const deployedAddress = await coinBluechip.address
  const address = "0x152b9d0fdc40c096757f570a51e494bd4b943e50"

  // get blue chip contract at address
  const coinBluechip = await ethers.getContractFactory("CoinBluechip")
  const bluechip = await coinBluechip.attach(address)

  // return await deployUUPSUpgradeableContract(await ethers.getContractFactory("CoinBluechip"), [
  //   [
  //     [signers[1].address, 1000],
  //     signers[2].address,
  //     [testConfig.depositToken.address, testConfig.depositToken.digits],
  //     86400,
  //     (await currentBlockchainTime(ethers.provider)) + 86400,
  //     1000000,
  //     52,
  //     [testConfig.swap.swapProviderId, testConfig.swap.swapProviderAddress],
  //     testConfig.swap.depositToBluechipPath,
  //     testConfig.swap.bluechipToDepositPath,
  //     testConfig.swap.depositToBluechipBins,
  //     address, // testConfig.swap.bluechipToDepositBins,
  //   ],
  //   // [testConfig.bluechipToken.address, testConfig.bluechipToken.digits],
  //   [address, testConfig.bluechipToken.digits],
  // ])

  // const currentImplementation = "0xe45c5f94b6ed92b3bef61d1af40c68cf7b5f5578"

  return await deployUUPSUpgradeableContract(coinBluechip, [
    [
      [signers[1].address, 1000],
      signers[2].address,
      [testConfig.depositToken.address, testConfig.depositToken.digits],
      86400,
      (await currentBlockchainTime(ethers.provider)) + 86400,
      1000000,
      52,
      [testConfig.swap.swapProviderId, testConfig.swap.swapProviderAddress],
      testConfig.swap.depositToBluechipPath,
      testConfig.swap.bluechipToDepositPath,
      testConfig.swap.depositToBluechipBins,
      testConfig.swap.bluechipToDepositBins,
    ],
    [testConfig.bluechipToken.address, testConfig.bluechipToken.digits],
    // [address, testConfig.bluechipToken.digits],
  ])
}
