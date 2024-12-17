import { mine } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import { BigNumber } from "ethers"
import { ethers } from "hardhat"
import { getTokenContract } from "../../../scripts/helper/helper"
import { getErrorRange } from "../../helper/utils"

getErrorRange
getTokenContract

export function testStrategyWithdraw() {
  describe("Withdrawal", async function () {
    it("should sweep", async function () {
      // After contract upgrade, the balances should still be the same

      // HARD CODE TO BTC.  It was 0x50b7545627a5162F82A992c33b87aDc75187B218 (wBTC)
      // This is BTC.b token address 0x152b9d0fdc40c096757f570a51e494bd4b943e50
    
      const strady = false;
      if (strady) {

        const GMX_PROXY = "0xF96Df0DB82Ebec3F5e8043C26522608f09c68600"
        const bluechipTokenAddress =  GMX_PROXY //this.bluechipTokenContract.address
        console.log("bluechipTokenAddress => ", bluechipTokenAddress)
        // expect(bluechipTokenAddress).to.equal("0x152b9d0fdc40c096757f570a51e494bd4b943e50")

        // const usdcStrategyBalanceBefore = await this.depositTokenContract.balanceOf("0xCa227Cb6197B57d08888982bfA93619F67B4773A")
        const btcStrategyBalanceBefore = await this.bluechipTokenContract.balanceOf("0xCa227Cb6197B57d08888982bfA93619F67B4773A")
        const treasuryBeforeBalance = await this.bluechipTokenContract.balanceOf("0xE146928D46b7B3f0b283BFf143fb09AA0eFa209D")

        // console.log("usdc balance in the DCA strategy before", usdcStrategyBalanceBefore.toString())
        console.log("btc balance in the DCA strategy before", btcStrategyBalanceBefore.toString())
        console.log("btc balance for treasury", treasuryBeforeBalance.toString())
        // console.log("balance", balance.toString())

        // withdraw all deposited money without the contract ever investing
        // previous version of the code failed during withdrawal
        await this.strategy.connect(this.user3).withdrawAll(false)

        const usdcStrategyBalanceAfter = await this.depositTokenContract.balanceOf("0xCa227Cb6197B57d08888982bfA93619F67B4773A")
        const btcStrategyBalanceAfter = await this.bluechipTokenContract.balanceOf("0xCa227Cb6197B57d08888982bfA93619F67B4773A")
        const treasuryAfterBalance = await this.bluechipTokenContract.balanceOf("0xE146928D46b7B3f0b283BFf143fb09AA0eFa209D")

        console.log("strategy usdc balance after", usdcStrategyBalanceAfter.toString())
        console.log("strategy btc balance after", btcStrategyBalanceAfter.toString())
        console.log("treasury btc balance after", treasuryAfterBalance.toString())

      }
    })

    it.skip("should allow to withdraw user deposits for a single user", async function () {
      let depositTokenBalanceBefore = await this.depositTokenContract.balanceOf(this.user3.address)
      let bluechipBalanceBefore = await this.bluechipTokenContract.balanceOf(this.user3.address)

      ///////////// Test 1 - withdraw right after deposit (without the contract ever inveseted

      // deposit 1000 depositToken into 9 slots
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      // check user depositor info
      let depositorInfo = await this.strategy.depositorInfo(this.user3.address)
      expect(depositorInfo.positions.length).to.equal(1)

      // withdraw all deposited money without the contract ever investing
      await this.strategy.connect(this.user3).withdrawAll(false)

      // balances should match the initial balances after considering fees
      let depositTokenBalanceAfter = await this.depositTokenContract.balanceOf(this.user3.address)
      let bluechipTokenBalanceAfter = await this.bluechipTokenContract.balanceOf(this.user3.address)
      expect(depositTokenBalanceBefore).to.equal(depositTokenBalanceAfter.add(BigNumber.from("100000000")))
      expect(bluechipBalanceBefore).to.equal(bluechipTokenBalanceAfter)

      // check that the user depositor info is empty
      depositorInfo = await this.strategy.depositorInfo(this.user3.address)
      expect(depositorInfo.positions.length).to.equal(0)

      ///////////// Test 2 - withdraw after the contract invested

      depositTokenBalanceBefore = await this.depositTokenContract.balanceOf(this.user3.address)
      bluechipBalanceBefore = await this.bluechipTokenContract.balanceOf(this.user3.address)

      // deposit 1000 depositToken into 9 slots
      await mine(86401)
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      // invest and check global queues
      await mine(86400)
      await this.strategy.connect(this.user1).invest()
      const [_, amountReceived] = await this.strategy.getHistoricalGaugeAt(0)
      expect((await this.strategy.equityValuation())[0].totalBluechipToken).to.equal(amountReceived)

      // withdraw
      await this.strategy.connect(this.user3).withdrawAll(false)

      // check global queues and user balances after withdrawal
      const [amountSpentAfter, amountReceivedAfter] = await this.strategy.getHistoricalGaugeAt(0)
      depositTokenBalanceAfter = await this.depositTokenContract.balanceOf(this.user3.address)
      bluechipTokenBalanceAfter = await this.bluechipTokenContract.balanceOf(this.user3.address)
      expect((await this.strategy.equityValuation())[0].totalBluechipToken).to.equal(BigNumber.from("0"))
      expect(amountReceivedAfter).to.equal(BigNumber.from("0"))
      expect(amountSpentAfter).to.equal(BigNumber.from("0"))
      expect(bluechipTokenBalanceAfter).to.equal(bluechipBalanceBefore.add(amountReceived))

      ///////////// Test 3 - withdraw and convert bluechip

      // deposit 1000 depositToken into 9 slots
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("1000", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1000", 6), 9)

      // invest
      await mine(86400)
      await this.strategy.connect(this.user1).invest()

      // check user balances after withdrawal
      bluechipBalanceBefore = await this.bluechipTokenContract.balanceOf(this.user3.address)
      await this.strategy.connect(this.user3).withdrawAll(true)
      bluechipTokenBalanceAfter = await this.bluechipTokenContract.balanceOf(this.user3.address)
      expect(bluechipBalanceBefore).to.equal(bluechipTokenBalanceAfter)
      expect((await this.strategy.equityValuation())[0].totalBluechipToken).to.equal(BigNumber.from("0"))

      /////////// Test 4 - withdraw only bluechip

      // deposit 1 depositToken into 9 slots
      await this.depositTokenContract
        .connect(this.user3)
        .approve(this.strategy.address, ethers.utils.parseUnits("1", 6))
      await this.strategy.connect(this.user3).deposit(ethers.utils.parseUnits("1", 6), 1)

      // invest
      await mine(86400)
      await this.strategy.connect(this.user1).invest()

      // store user balances before withdrawal
      depositTokenBalanceBefore = await this.depositTokenContract.balanceOf(this.user3.address)
      bluechipBalanceBefore = await this.bluechipTokenContract.balanceOf(this.user3.address)
      const boughtBluechip = (await this.strategy.equityValuation())[0].totalBluechipToken

      // withdraw
      await this.strategy.connect(this.user3).withdrawAll(false)

      // check user balances after withdrawal
      depositTokenBalanceAfter = await this.depositTokenContract.balanceOf(this.user3.address)
      bluechipTokenBalanceAfter = await this.bluechipTokenContract.balanceOf(this.user3.address)
      expect(depositTokenBalanceBefore).to.equal(depositTokenBalanceAfter)
      expect(bluechipTokenBalanceAfter).to.equal(bluechipBalanceBefore.add(boughtBluechip))
    })
  })
}
