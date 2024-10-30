const ethers = require("ethers")
// const { network } = require("hardhat")

const { router, lBPair } = "../constants/avalanche/addresses/TraderJoe.json"

const simulation = async () => {
  const provider = new ethers.providers.JsonRpcProvider("https://api.avax.network/ext/bc/C/rpc")

  const abi = [
    "function version() view returns (string)",
    "function owner() view returns (address)",
    "function balanceOf(address) view returns (uint256)",
    "function getTokenY() view returns (address)",
    "function getAssetBalances() view returns (uint256[])",
    "function getDepositToken() view returns (address)",
    "function trackingName() view returns (string)",
    "function reinitialize(address lbPair, address lbRouter, uint256 binStep, uint256[] binIds) nonpayable",
  ]

  const erc20Abi = [
    "function balanceOf(address) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
  ]

  // Connect to the yield-vault contract
  const yieldVaultContractAddress = "0x2eaf73f8e6bcf606f56e5cf201756c1f0565c068"
  // const yieldVaultContractAddress = "0xf999e8cba6729aa2d72ad49047fe87efaadb6e8b"
  const yieldVaultContract = new ethers.Contract(yieldVaultContractAddress, abi, provider)

  const version = await yieldVaultContract.version()
  console.log(version)

  const owner = await yieldVaultContract.owner()
  console.log(`Owner: ${owner}`)

  const trackingName = await yieldVaultContract.trackingName()
  console.log(`trackingName: ${trackingName}`)

  //   impersonate the owner
  //   await network.provider.request({
  //     method: "hardhat_impersonateAccount",
  //     params: [owner],
  //   })

  //   const OWNER = await ethers.getSigner(owner)

  const assetBalances = await yieldVaultContract.getAssetBalances()

  for (let i = 0; i < assetBalances.length; i++) {
    console.log(`Asset balance ${i}: ${assetBalances[i]}`)
    // const balance = await yieldVaultContract.balanceOf(assetBalances[i])
    // console.log(`Balance of asset ${assetBalances[i]}: ${balance}`)
  }

  const depositToken = await yieldVaultContract.getDepositToken()
  console.log(`Deposit token: ${depositToken}`)

  // const depositTokenContract = new ethers.Contract(depositToken, erc20Abi, provider)
  //   const depositTokenBalance = await depositTokenContract.balanceOf(owner)

  //   console.log(`Deposit token balance: ${depositTokenBalance}`)

  // connect to trader joe usdc.e usdc pair 0xd2Dee5Ef1bAe0abA8922a27b96Ef0966a53fF56d (PROXY)
  // Trader Joe contract
  //   const LBPair = new ethers.Contract("0x7a5b4e301fc2b148cefe57257a236eb845082797", abi, provider)
  //   const tokenY = await LBPair.getTokenY()
  //   console.log(tokenY)
  // console.log(LBPair)

  //  import TraderJoe from "../../../constants/avalanche/addresses/TraderJoe.json"

  // 0x7a5b4e301fc2b148cefe57257a236eb845082797

  // deploy the new TraderJoeV2Library

  // deploy swap adapter

  // usdc.e usdc pair https://lfj.gg/avalanche/pool/v22/0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664/0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e/1

  // const traderJoeV2Library = new ethers.Contract("")
  // const trader_joe_abi = ["function reinitialize()"]
  // const trader_joe_abi = ["function trackingName() view returns (string)"]

  // THIS GUY IS TRADER JOE
  // const traderJoeContract = new ethers.Contract("0xec4042d20FCC06aBb52363f2e7f6be5396Ec79B5", abi, provider)

  // Avalanche USDC address https://snowtrace.io/token/0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E

  const strategyAddresses = [
    "0x72126b4d9dd23093D54F94A64D7831D101ba13d5",
    "0xec4042d20FCC06aBb52363f2e7f6be5396Ec79B5",
    "0xc802921c1557C96e6ba40CfD219e8F825BD34D84",
  ]

  for (let i = 0; i < strategyAddresses.length; i++) {
    const strategyAddress = strategyAddresses[i]
    const strategyContract = new ethers.Contract(strategyAddress, abi, provider)

    const strategyContractName = await strategyContract.trackingName()
    console.log(`Strategy tracking name: ${strategyContractName}`)

    const sOwner = await strategyContract.owner()
    console.log(`Strategy owner: ${sOwner}`)

    const sDepositToken = await strategyContract.getDepositToken()
    console.log(`Strategy deposit token: ${sDepositToken}`)

    const sDepositTokenContract = new ethers.Contract(sDepositToken, erc20Abi, provider)

    const sDepositTokenName = await sDepositTokenContract.name()
    console.log(`Strategy deposit token name: ${sDepositTokenName}`)

    const sDepositTokenDecimals = await sDepositTokenContract.decimals()
    console.log(`Strategy deposit token decimals: ${sDepositTokenDecimals}`)
    const sTokenBalance = await sDepositTokenContract.balanceOf(strategyAddress)

    const formattedContractTokenBalance = ethers.utils.formatUnits(sTokenBalance, sDepositTokenDecimals)
    console.log(`Strategy Deposit token balance: ${formattedContractTokenBalance}`)
  }

  //   const trader_joe_abi = ["{
  //       "inputs": [
  //         {
  //           "components": [
  //             {
  //               "internalType": "contract ITraderJoeLBPair",
  //               "name": "lbPair",
  //               "type": "address"
  //             },
  //             {
  //               "internalType": "contract ITraderJoeLBRouter",
  //               "name": "lbRouter",
  //               "type": "address"
  //             },
  //             {
  //               "internalType": "uint256",
  //               "name": "binStep",
  //               "type": "uint256"
  //             },
  //             {
  //               "internalType": "uint256[]",
  //               "name": "binIds",
  //               "type": "uint256[]"
  //             },
  //             {
  //               "internalType": "uint256[]",
  //               "name": "binAllocations",
  //               "type": "uint256[]"
  //             },
  //             {
  //               "internalType": "uint256",
  //               "name": "minValuation",
  //               "type": "uint256"
  //             }
  //           ],
  //           "internalType": "struct TraderJoe.TraderJoeArgs",
  //           "name": "traderJoeArgs",
  //           "type": "tuple"
  //         }
  //       ],
  //       "name": "reinitialize",
  //       "outputs": [],
  //       "stateMutability": "nonpayable",
  //       "type": "function"
  //     }"]

  const stargate_usdc_strategy = "0x8523AEEFf7F30ED463C6e05E64e90FCEA5cd9a26"

  // const traderJoe = new ethers.Contract("0xec4042d20FCC06aBb52363f2e7f6be5396Ec79B5", trader_joe_abi, provider)

  // // now re init
  // const lBPair = "0x18332988456C4Bd9ABa6698ec748b331516F5A14"
  // const lbRouter = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"
  // const binStep = 0
  // const binIds = []

  //   const _owner = await hre.ethers.getSigner(owner)

  //   const tx = await traderJoe.reinitialize(lBPair, lbRouter, binStep, binIds)

  // this.libraries = {}
  // this.libraries["TraderJoeInvestmentLib"] = library.address

  // this.Strategy = await ethers.getContractFactory("TraderJoe", { libraries: this.libraries })
}

simulation()
