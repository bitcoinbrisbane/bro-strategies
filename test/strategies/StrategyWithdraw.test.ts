import { ethers, upgrades } from "hardhat"
import { expect } from "chai"
import { Contract, ContractFactory } from "ethers"

export function testStrategyWithdraw() {

  async function deployUUPSUpgradeableContract(factory: ContractFactory, args: any[]): Promise<Contract> {
    // Deploy investable.
    const contract = await upgrades.deployProxy(factory, args, {
      kind: "uups",
      unsafeAllow: ["external-library-linking"],
    })
    await contract.deployed()

    return contract
  }


  describe.only("Withdraw", async function () {
    // testWithdraw()

    it("simulation withdraw", async function () {
      const abi = [
        "function withdrawBluechipFromPool() view returns (string)",
        "function owner() public view returns (address)",
      ]

      // const erc20Abi = [
      //   "function balanceOf(address) view returns (uint256)",
      //   "function name() view returns (string)",
      //   "function symbol() view returns (string)",
      //   "function decimals() view returns (uint8)",
      // ]

      const erc20Abi = ["function balanceOf(address) view returns (uint256)"]

      const BITCOIN_ADDRESS = "0xCa227Cb6197B57d08888982bfA93619F67B4773A";
      const dcaContract = new ethers.Contract(BITCOIN_ADDRESS, abi, hre.ethers.provider)
      const USDC_ADDRESS = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"

      const bitcoinContract = new ethers.Contract(BITCOIN_ADDRESS, erc20Abi, hre.ethers.provider)
      const usdcContract = new ethers.Contract(USDC_ADDRESS, erc20Abi, hre.ethers.provider)

      const bitcoinBalance = await bitcoinContract.balanceOf(dcaContract)
      const usdcBalance = await usdcContract.balanceOf(dcaContract)

      console.log(`Bitcoin Balance: ${bitcoinBalance}`)
      console.log(`USDC Balance: ${usdcBalance}`)

      const owner = await dcaContract.owner()
      console.log(`Owner: ${owner}`)

      // // impersonate the owner
      // await network.provider.request({
      //   method: "hardhat_impersonateAccount",
      //   params: [owner],
      // })
    })

    it.only("simulation yield", async function () {
      // create a new RPC provider
      // const impersonatedSigner = await ethers.getImpersonatedSigner("0x2eaf73f8e6bcf606f56e5cf201756c1f0565c068")
      const impersonatedSigner = await ethers.getImpersonatedSigner("0x2eaf73f8e6bcf606f56e5cf201756c1f0565c068")

      console.log("Impersonated Signer: ", impersonatedSigner.address)

      const erc_20_abi = [
        "function balanceOf(address) view returns (uint)",
        "function name() view returns (string)",
      ]

      const abi = [
        "function version() view returns (string)",
        "function owner() view returns (address)",
        "function balanceOf(address) view returns (uint256)",
        "function getTokenY() view returns (address)",
        "function getAssetBalances() view returns (uint256[])",
        "function getDepositToken() view returns (address)",
      ]

      // Connect to the yield-vault contract
      const yieldVaultContractAddress = "0x2eaf73f8e6bcf606f56e5cf201756c1f0565c068"
      const yieldVaultContract = new ethers.Contract(yieldVaultContractAddress, abi, hre.ethers.provider)

      const version = await yieldVaultContract.version()
      console.log("Simulation Version: ", version)
      expect(version).to.equal("1.1.0")

      const depositToken = await yieldVaultContract.getDepositToken()
      console.log("Simulation Deposit Token: ", depositToken)
      // expect(depositToken).to.equal("0x2eaf73f8e6bcf606f56e5cf201756c1f0565c068")

      // const erc20Abi = ["function balanceOf(address) view returns (uint256)"]
      const erc20Contract = new ethers.Contract(depositToken, erc_20_abi, hre.ethers.provider)

      const balance = await erc20Contract.balanceOf(impersonatedSigner.address)
      const name = await erc20Contract.name()
      console.log("Simulation Balance of ", name, " : ", balance.toString())


    })
  })
}
