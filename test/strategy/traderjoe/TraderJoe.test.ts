import { expect } from "chai"
import { ethers, upgrades } from "hardhat"
import { getErrorRange, airdropToken } from "../../shared/utils"
import { testStrategy } from "../Unified.test"

import joePairAbi from "../../shared/abi/joePair.json"

const TRADER_JOE_ADDRESSES = {
  router: "0x60aE616a2155Ee3d9A68541Ba4544862310933d4",
  masterChef: "0x4483f0b6e2f5486d06958c20f8c39a7abe87bf8f",
  lpToken: "0x2A8A315e82F85D1f0658C5D66A452Bbdd9356783",
  joeToken: "0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd",
}

testStrategy(
  "TraderJoe USDC-USDC.e Strategy",
  "TraderJoe",
  [
    TRADER_JOE_ADDRESSES.router,
    TRADER_JOE_ADDRESSES.masterChef,
    TRADER_JOE_ADDRESSES.lpToken,
    TRADER_JOE_ADDRESSES.joeToken,
  ],
  [testTraderJoeAum, testTraderJoeDeposit, testTraderJoeInitialize, testTraderJoeUpgradeable]
)

function testTraderJoeAum() {
  describe("AUM - TraderJoe Strategy Specific", async function () {
    it("should success after a single deposit", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("100", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("100", 6), this.user0.address, [])

      const lpTokenContract = await ethers.getContractAt(joePairAbi, TRADER_JOE_ADDRESSES.lpToken)
      const [, reserves1] = await lpTokenContract.getReserves() // USDC reserve in USDC-USDC.e pool
      const totalSupply = await lpTokenContract.totalSupply()
      const lpBalance = ethers.utils.parseUnits("100", 6).div(2).mul(totalSupply).div(reserves1)

      const assetBalances = await this.strategy.getAssetBalances()
      expect(assetBalances[0].asset.toLowerCase()).to.equal(TRADER_JOE_ADDRESSES.lpToken.toLowerCase())
      expect(assetBalances[0].balance).to.approximately(lpBalance, getErrorRange(lpBalance))

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.strategy.getAssetValuations(true, false)
      expect(assetValuations[0].asset.toLowerCase()).to.equal(TRADER_JOE_ADDRESSES.lpToken.toLowerCase())
      expect(assetValuations[0].valuation).to.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("100", 6),
        getErrorRange(ethers.utils.parseUnits("100", 6))
      )
    })

    it("should success after multiple deposits and withdrawals", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("50", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("50", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("20", 6))
      await this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("20", 6), this.user0.address, [])

      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("50", 6))
      await this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("50", 6), this.user0.address, [])

      await this.investmentToken.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("10", 6))
      await this.strategy.connect(this.user0).withdraw(ethers.utils.parseUnits("10", 6), this.user0.address, [])

      const lpTokenContract = await ethers.getContractAt(joePairAbi, TRADER_JOE_ADDRESSES.lpToken)
      const [, reserves1] = await lpTokenContract.getReserves() // USDC reserve in USDC-USDC.e pool
      const totalSupply = await lpTokenContract.totalSupply()
      const lpBalance = ethers.utils.parseUnits("70", 6).div(2).mul(totalSupply).div(reserves1)

      const assetBalances = await this.strategy.getAssetBalances()
      expect(assetBalances[0].asset.toLowerCase()).to.equal(TRADER_JOE_ADDRESSES.lpToken.toLowerCase())
      expect(assetBalances[0].balance).to.approximately(lpBalance, getErrorRange(lpBalance))

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      const assetValuations = await this.strategy.getAssetValuations(true, false)
      expect(assetValuations[0].asset.toLowerCase()).to.equal(TRADER_JOE_ADDRESSES.lpToken.toLowerCase())
      expect(assetValuations[0].valuation).to.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(await this.strategy.getEquityValuation(true, false)).to.approximately(
        ethers.utils.parseUnits("70", 6),
        getErrorRange(ethers.utils.parseUnits("70", 6))
      )
    })
  })
}

function testTraderJoeDeposit() {
  describe("Deposit - TraderJoe Strategy Specific", async function () {
    it("should fail when a single user deposits the possible minimum USDC", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))

      await this.usdc.connect(this.user0).approve(this.strategy.address, 1)
      await expect(this.strategy.connect(this.user0).deposit(1, this.user0.address, [])).to.be.reverted

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("100", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.strategy.getEquityValuation(true, false)).to.equal(0)
    })

    it("should success when multiple users deposit the possible minimum USDC - 0", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user1, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user2, this.usdc, ethers.utils.parseUnits("100", 6))

      // The first user.
      await this.usdc.connect(this.user0).approve(this.strategy.address, 1)
      await expect(this.strategy.connect(this.user0).deposit(1, this.user0.address, [])).to.be.reverted

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("100", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(0)
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(0)
      expect(await this.strategy.getEquityValuation(true, false)).to.equal(0)

      // The second user.
      await this.usdc.connect(this.user1).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await expect(this.strategy.connect(this.user1).deposit(ethers.utils.parseUnits("30", 6), this.user1.address, []))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user1.address, this.user1.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("70", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("30", 6))
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("30", 6))
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )

      // The third user.
      await this.usdc.connect(this.user2).approve(this.strategy.address, 1)
      await expect(this.strategy.connect(this.user2).deposit(1, this.user0.address, [])).to.be.reverted

      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("100", 6))
      expect(await this.investmentToken.balanceOf(this.user2.address)).to.equal(0)
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("30", 6))
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
    })

    it("should success when multiple users deposit the possible minimum USDC - 1", async function () {
      airdropToken(this.impersonatedSigner, this.user0, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user1, this.usdc, ethers.utils.parseUnits("100", 6))
      airdropToken(this.impersonatedSigner, this.user2, this.usdc, ethers.utils.parseUnits("100", 6))

      // The first user.
      await this.usdc.connect(this.user0).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await expect(this.strategy.connect(this.user0).deposit(ethers.utils.parseUnits("30", 6), this.user0.address, []))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user0.address, this.user0.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("70", 6))
      expect(await this.investmentToken.balanceOf(this.user0.address)).to.equal(ethers.utils.parseUnits("30", 6))
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("30", 6))
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )

      // The second user.
      await this.usdc.connect(this.user1).approve(this.strategy.address, 1)
      await expect(this.strategy.connect(this.user1).deposit(1, this.user0.address, [])).to.be.reverted

      expect(await this.usdc.balanceOf(this.user1.address)).to.equal(ethers.utils.parseUnits("100", 6))
      expect(await this.investmentToken.balanceOf(this.user1.address)).to.equal(0)
      expect(await this.strategy.getInvestmentTokenSupply()).to.equal(ethers.utils.parseUnits("30", 6))
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )

      // The third user.
      await this.usdc.connect(this.user2).approve(this.strategy.address, ethers.utils.parseUnits("30", 6))
      await expect(this.strategy.connect(this.user2).deposit(ethers.utils.parseUnits("30", 6), this.user2.address, []))
        .to.emit(this.strategy, "Deposit")
        .withArgs(this.user2.address, this.user2.address, ethers.utils.parseUnits("30", 6))

      expect(await this.usdc.balanceOf(this.user2.address)).to.equal(ethers.utils.parseUnits("70", 6))
      expect(await this.investmentToken.balanceOf(this.user2.address)).to.be.approximately(
        ethers.utils.parseUnits("30", 6),
        getErrorRange(ethers.utils.parseUnits("30", 6))
      )
      expect(await this.strategy.getInvestmentTokenSupply()).to.be.approximately(
        ethers.utils.parseUnits("60", 6),
        getErrorRange(ethers.utils.parseUnits("60", 6))
      )
      expect(await this.strategy.getEquityValuation(true, false)).to.be.approximately(
        ethers.utils.parseUnits("60", 6),
        getErrorRange(ethers.utils.parseUnits("60", 6))
      )
    })
  })
}

function testTraderJoeInitialize() {
  describe("Initialize - TraderJoe USDC Strategy Specific", async function () {
    it("should fail when passed wrong LP token address", async function () {
      await expect(
        upgrades.deployProxy(
          this.Strategy,
          [
            [
              this.investmentToken.address,
              this.usdc.address,
              this.depositFee,
              this.depositFeeParams,
              this.withdrawalFee,
              this.withdrawalFeeParams,
              this.performanceFee,
              this.performanceFeeParams,
              this.feeReceiver,
              this.feeReceiverParams,
              this.totalInvestmentLimit,
              this.investmentLimitPerAddress,
              this.priceOracle.address,
              this.swapServiceProvider,
              this.swapServiceRouter,
            ],
            TRADER_JOE_ADDRESSES.router,
            TRADER_JOE_ADDRESSES.masterChef,
            this.usdc.address,
            TRADER_JOE_ADDRESSES.joeToken,
          ],
          { kind: "uups" }
        )
      ).to.be.reverted
    })
  })
}

function testTraderJoeUpgradeable() {
  describe("Upgradeable - TraderJoe Strategy Specific", async function () {
    it("should success to leave all strategy specific state variables' value intact", async function () {
      // IAum.
      const assetBalancesBefore = await this.strategy.getAssetBalances()
      const assetValuationsBefore = await this.strategy.getAssetValuations(true, false)
      const equityValuationBefore = await this.strategy.getEquityValuation(true, false)

      const TraderJoeV2 = await ethers.getContractFactory("TraderJoeV2")
      const traderJoeV2 = await upgrades.upgradeProxy(this.strategy.address, TraderJoeV2, {
        call: {
          fn: "initialize",
          args: [
            [
              this.investmentToken.address,
              this.usdc.address,
              this.depositFee,
              this.depositFeeParams,
              this.withdrawalFee,
              this.withdrawalFeeParams,
              this.performanceFee,
              this.performanceFeeParams,
              this.feeReceiver,
              this.feeReceiverParams,
              this.totalInvestmentLimit,
              this.investmentLimitPerAddress,
              this.priceOracle.address,
              this.swapServiceProvider,
              this.swapServiceRouter,
            ],
            TRADER_JOE_ADDRESSES.router,
            TRADER_JOE_ADDRESSES.masterChef,
            TRADER_JOE_ADDRESSES.lpToken,
            TRADER_JOE_ADDRESSES.joeToken,
          ],
        },
      })
      await traderJoeV2.deployed()

      // IAum.
      const assetBalancesAfter = await this.strategy.getAssetBalances()
      const assetValuationsAfter = await this.strategy.getAssetValuations(true, false)
      const equityValuationAfter = await this.strategy.getEquityValuation(true, false)

      // IAum.
      expect(assetBalancesBefore[0].asset).to.equal(assetBalancesAfter[0].asset)
      expect(assetBalancesBefore[0].balance).to.equal(assetBalancesAfter[0].balance)

      expect(await this.strategy.getLiabilityBalances()).to.be.an("array").that.is.empty

      expect(assetValuationsBefore[0].asset).to.equal(assetValuationsAfter[0].asset)
      expect(assetValuationsBefore[0].valuation).to.equal(assetValuationsAfter[0].valuation)

      expect(await this.strategy.getLiabilityValuations(true, false)).to.be.an("array").that.is.empty

      expect(equityValuationBefore.eq(equityValuationAfter)).to.equal(true)

      // IInvestable.
      expect(await this.strategy.name()).to.equal("brokkr.traderjoe_strategy.traderjoe_strategy_v2.0.0")
      expect(await this.strategy.humanReadableName()).to.equal("TraderJoe Strategy")
      expect(await this.strategy.version()).to.equal("2.0.0")
    })
  })
}
