// import { takeSnapshot } from "@nomicfoundation/hardhat-network-helpers"
import type * as ethersTypes from "ethers"
import { ethers, network, upgrades } from "hardhat"
import { getTokenContract } from "../../../scripts/helper/helper"
import { Chain } from "../helper/HelperInterfaces"
import { testStrategyDeposit } from "./StrategyDeposit.test"
import { testStrategyEmergencyExit } from "./StrategyEmergencyExit.test"
import { testStrategyLimit } from "./StrategyLimit.test"
import { testStrategyWithdraw } from "./StrategyWithdraw.test"

testStrategyDeposit
testStrategyLimit
testStrategyWithdraw
testStrategyEmergencyExit

export function testDcaStrategy(
  description: string,
  deployStrategy: Function,
  strategySpecificTests: (() => any)[],
  testConfig: any,
  chain: Chain
) {
  describe(description, function () {
    before(async function () {
      this.testConfig = testConfig

      await network.provider.request({
        method: "hardhat_reset",
        params: [
          {
            allowUnlimitedContractSize: false,
            blockGasLimit: 30_000_000,
            forking: {
              jsonRpcUrl: "https://api.avax.network/ext/bc/C/rpc", // chain.url,
              enabled: true,
              blockNumber: 53649000, // chain.forkAt,
            },
          },
        ],
      })

      console.log("Forked to", chain.url, "at block", 53649000)

      // Get ERC20 tokens.
      this.depositTokenContract = await getTokenContract(this.testConfig.depositToken.address)
      // this.bluechipTokenContract = await getTokenContract(this.testConfig.bluechipToken.address)

      // HARD CODE TO BTC ^^ above.  It was 0x50b7545627a5162F82A992c33b87aDc75187B218 (wBTC)
      // This is BTC.b token address
      this.bluechipTokenContract = await getTokenContract("0x152b9d0fdc40c096757f570a51e494bd4b943e50")

      // console.log("bluechipTokenContract", this.bluechipTokenContract.address)
      // console.log("depositTokenContract", this.depositTokenContract.address)

      this.signers = await ethers.getSigners()
      this.user0 = this.signers[1]
      this.user1 = this.signers[2]
      this.user2 = this.signers[3]
      this.user3 = this.signers[4]
      this.userCount = 4

      // new guy, by randomiser https://snowscan.xyz/address/0xF96Df0DB82Ebec3F5e8043C26522608f09c68600#readProxyContract

      // Changed the owner of the GMX DCA to the deployer address (+ sent some AVAX for the gas). Let's test the upgrade when possible
      // 0x0625Db97368dF1805314E68D0E63e5eB154B9AE6

      // NOTES https://github.com/OpenZeppelin/openzeppelin-upgrades/issues/370
      this.impersonatedSigner = await ethers.getImpersonatedSigner(
        "0xE8855828fEC29dc6860A4362BCb386CCf6C0c601"
        // "0xDE971dAc0009Dfb373AcEE32F94777AF2E38e56C" // proxy owner
        // "0x0000000000000000000000000000000000000000"
      )
      // const blueChipBalanceBefore = await this.bluechipTokenContract.balanceOf("0xCa227Cb6197B57d08888982bfA93619F67B4773A")
      // console.log("blueChipBalanceBefore", blueChipBalanceBefore.toString())


      const GMX_PROXY = "0xF96Df0DB82Ebec3F5e8043C26522608f09c68600"

      const PROXY_ADDRESS = "0xCa227Cb6197B57d08888982bfA93619F67B4773A"
      const IMPLEMENTATION_ADDRESS = "0xe45c5f94b6ed92b3bef61d1af40c68cf7b5f5578"

      // const NewImplementation = await ethers.getContractFactory("WBTCBluechip")
      const NewImplementation = await ethers.getContractFactory("CoinBluechip")

      // Get the current proxy contract and check values
      const currentProxy = await ethers.getContractAt("CoinBluechip", IMPLEMENTATION_ADDRESS, this.impersonatedSigner)
      const currentProxy2 = await ethers.getContractAt("CoinBluechip", GMX_PROXY, this.impersonatedSigner) // CoinBluechip
      const owner = await currentProxy.owner()
      const owner2 = await currentProxy2.owner()

      console.log("owner", owner)
      console.log("owner 2", owner2)

      const depositToken = await currentProxy.depositToken()
      const depositToken2 = await currentProxy2.depositToken()

      console.log("depositToken", depositToken)
      console.log("depositToken 2", depositToken2)

      // await currentProxy.renounceOwnership()

      // Perform the upgrade
      // const upgraded = await upgrades.upgradeProxy(GMX_PROXY, NewImplementation)
      await upgrades.forceImport(GMX_PROXY, NewImplementation)
      const upgraded = await upgrades.upgradeProxy(GMX_PROXY, NewImplementation)
      await upgraded.deployed()

      console.log("upgraded to", upgraded.address, " LFG!!!")




      // const bluechipTokenAddress = this.bluechipTokenContract.address
      // console.log("bluechipTokenAddress => ", bluechipTokenAddress)


      const usdc = await getTokenContract("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E")
      const usdcBalanceBefore = await usdc.balanceOf(GMX_PROXY)
      console.log("usdc balance before", usdcBalanceBefore.toString())

      // const btcStrategyBalanceBefore = await this.bluechipTokenContract.balanceOf(GMX_PROXY)
      // const treasuryBeforeBalance = await this.bluechipTokenContract.balanceOf(GMX_PROXY)


      // console.log("btc balance in the DCA strategy before", btcStrategyBalanceBefore.toString())
      // console.log("btc balance for treasury", treasuryBeforeBalance.toString())


      // withdraw all deposited money without the contract ever investing
      // previous version of the code failed during withdrawal
      await upgraded.withdrawAll(false)

      const usdcBalanceAfter = await usdc.balanceOf(GMX_PROXY)
      console.log("usdc balance after", usdcBalanceAfter.toString())

      // const usdcStrategyBalanceAfter = await this.depositTokenContract.balanceOf("0xCa227Cb6197B57d08888982bfA93619F67B4773A")
      // const btcStrategyBalanceAfter = await this.bluechipTokenContract.balanceOf("0xCa227Cb6197B57d08888982bfA93619F67B4773A")
      // const treasuryAfterBalance = await this.bluechipTokenContract.balanceOf("0xE146928D46b7B3f0b283BFf143fb09AA0eFa209D")

      // console.log("strategy usdc balance after", usdcStrategyBalanceAfter.toString())
      // console.log("strategy btc balance after", btcStrategyBalanceAfter.toString())
      // console.log("treasury btc balance after", treasuryAfterBalance.toString())


    })

    // beforeEach(async function () {
    //   await this.snapshot.restore()
    // })

    // testStrategyDeposit()
    
    // USE THIS GUY BELOW
    testStrategyWithdraw()

    // testStrategyLimit()
    // if (!testConfig.skipEmergencyExitTests) testStrategyEmergencyExit()

    for (const strategySpecificTest of strategySpecificTests) {
      strategySpecificTest()
    }

    after(async function () {
      await network.provider.request({
        method: "hardhat_reset",
        params: [],
      })
    })
  })
}

export async function currentBlockchainTime(provider: ethersTypes.providers.JsonRpcProvider) {
  return await (
    await provider.getBlock(await provider.getBlockNumber())
  ).timestamp
}
