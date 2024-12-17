import { Contract } from "ethers"
import { readFileSync } from "fs"
import { deployProxyContract, logBlue, retryUntilSuccess } from "../helper/helper"
import { ethers } from "hardhat"

async function deployStrategy(strategyConfig: any): Promise<Contract> {
  const tokenInfo = strategyConfig.dcaBaseArgs.depositTokenInfo
  console.log("tokenInfo", tokenInfo)

  const DCAStrategyInitArgs = {
    depositFee: strategyConfig.dcaBaseArgs.depositFee,
    dcaInvestor: strategyConfig.dcaBaseArgs.dcaInvestor,
    depositTokenInfo: tokenInfo,
    investmentPeriod: strategyConfig.dcaBaseArgs.investmentPeriod,
    lastInvestmentTimestamp: ethers.BigNumber.from(0),
    minDepositAmount: strategyConfig.dcaBaseArgs.minDepositAmount,
    positionLimits: ethers.BigNumber.from(0),
    router: strategyConfig.dcaBaseArgs.router.router,
    depositToBluechipSwapPath: [ethers.constants.AddressZero],
    bluechipToDepositSwapPath: [ethers.constants.AddressZero],
  }

  console.log("DCAStrategyInitArgs", DCAStrategyInitArgs)

  // return await deployProxyContract("CoinBluechip", [strategyConfig.dcaBaseArgs, ...strategyConfig.strategyArgs], {})
  return await deployProxyContract("CoinBluechip", [DCAStrategyInitArgs, tokenInfo], {})
}

async function main() {
  let configFilePath
  if (typeof process.env.DEPLOYMENT_CONFIG === "undefined") {
    console.error("DEPLOYMENT_CONFIG=<full path to deployment script> environment variable needs to be set")
    process.exit(-1)
  } else {
    configFilePath = process.env.DEPLOYMENT_CONFIG
  }

  configFilePath = "configs/dca/avalanche/strategy/CoinBluechip/usdc_gmx_prod.json"

  // deploying strategy
  let strategyConfig = JSON.parse(readFileSync(configFilePath, "utf-8"))
  let strategy = await retryUntilSuccess(deployStrategy(strategyConfig))

  // changing ownership
  await retryUntilSuccess(strategy.transferOwnership(strategyConfig.owner))
  logBlue(`Ownership trasferred to: ${strategyConfig.owner}`)

  // test deposit
  // const minDepositAmount = strategyConfig.dcaBaseArgs.minDepositAmount
  // const depositTokenAddr = strategyConfig.dcaBaseArgs.depositTokenInfo.token
  // const depositTokenContract = await retryUntilSuccess(getTokenContract(depositTokenAddr))
  // const usdcWhale = await retryUntilSuccess(ethers.getImpersonatedSigner(WhaleAddrs[depositTokenAddr]))
  // await retryUntilSuccess(setBalance(usdcWhale.address, ethers.utils.parseEther("10000")))
  // await retryUntilSuccess(depositTokenContract.connect(usdcWhale).approve(strategy.address, minDepositAmount))
  // await retryUntilSuccess(strategy.connect(usdcWhale).deposit(minDepositAmount, 52))

  logBlue(`Strategy deployed at: ${strategy.address}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
