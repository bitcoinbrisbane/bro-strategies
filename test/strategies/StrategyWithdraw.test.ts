import { ethers } from "hardhat"
import { testWithdraw } from "../shared/Withdraw.test"
import { expect } from "chai"

export function testStrategyWithdraw() {
  describe.only("Withdraw", async function () {
    testWithdraw()

    it("simulation", async function () {
      // create a new RPC provider
      // const impersonatedSigner = await ethers.getImpersonatedSigner("0x2eaf73f8e6bcf606f56e5cf201756c1f0565c068")
      const impersonatedSigner = await ethers.getImpersonatedSigner("0x2eaf73f8e6bcf606f56e5cf201756c1f0565c068")

      // const abi = ["function balanceOf(address) view returns (uint)", "function transfer(address to, uint amount)"]
      const abi = ["function version() view returns (string)"]

      // Connect to the yield-vault contract
      const yieldVaultContractAddress = "0x2eaf73f8e6bcf606f56e5cf201756c1f0565c068"
      const yieldVaultContract = new ethers.Contract(yieldVaultContractAddress, abi, hre.ethers.provider)

      const version = await yieldVaultContract.version()
      console.log("Simulation Version: ", version)
      expect(version).to.equal("1.0.0")

      // const balance = await yieldVaultContract.balanceOf(impersonatedSigner.address)
    })
  })
}
