const ethers = require("ethers")
// const { network } = require("hardhat")

const simulation = async () => {

  console.log("Starting simulation")

  // npx hardhat node --fork https://api.avax.network/ext/bc/C/rpc
  const provider = new ethers.providers.JsonRpcProvider("https://nd-611-246-951.p2pify.com/887ee583ea707aacda0f38a89fd91195/ext/bc/C/rpc")
  // const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545")
  // or simulate a transaction

  const abi = [
    "function withdrawBluechipFromPool() view returns (string)",
    "function owner() public view returns (address)",
  ]

  const erc20Abi = [
    "function balanceOf(address) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
  ]

  const dcaContract = new ethers.Contract("0xCa227Cb6197B57d08888982bfA93619F67B4773A", abi, provider)
  const USDC_ADDRESS = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"
  const BITCOIN_ADDRESS = "0x152b9d0fdc40c096757f570a51e494bd4b943e50"
  
  const bitcoinContract = new ethers.Contract(BITCOIN_ADDRESS, erc20Abi, provider)
  const bitcoinBalance = await bitcoinContract.balanceOf("0xCa227Cb6197B57d08888982bfA93619F67B4773A")

  console.log("DCA Bitcoin Balance: ", bitcoinBalance.toString())
  
  const usdcContract = new ethers.Contract("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", erc20Abi, provider)
  const usdcBalance = await usdcContract.balanceOf("0xCa227Cb6197B57d08888982bfA93619F67B4773A")

  // const version = await dcaContract.version()
  console.log("DCA USDC Balance: ", usdcBalance.toString())

  const owner = await dcaContract.owner()
  console.log(`Owner: ${owner}`)

  // // impersonate the owner
  // await network.provider.request({
  //   method: "hardhat_impersonateAccount",
  //   params: [owner],
  // })

  // const trackingName = await yieldVaultContract.trackingName()
  // console.log(`trackingName: ${trackingName}

  // const assetBalances = await yieldVaultContract.getAssetBalances()

  // for (let i = 0; i < assetBalances.length; i++) {
  //   console.log(`Asset balance ${i}: ${assetBalances[i]}`)
  //   // const balance = await yieldVaultContract.balanceOf(assetBalances[i])
  //   // console.log(`Balance of asset ${assetBalances[i]}: ${balance}`)
  // }

  // const depositToken = await yieldVaultContract.getDepositToken()
  // console.log(`Deposit token: ${depositToken}`)

  // const strategyAddresses = [
  //   "0x72126b4d9dd23093D54F94A64D7831D101ba13d5",
  //   "0xec4042d20FCC06aBb52363f2e7f6be5396Ec79B5",
  //   "0xc802921c1557C96e6ba40CfD219e8F825BD34D84",
  // ]

  // for (let i = 0; i < strategyAddresses.length; i++) {
  //   const strategyAddress = strategyAddresses[i]
  //   const strategyContract = new ethers.Contract(strategyAddress, abi, provider)

  //   const strategyContractName = await strategyContract.trackingName()
  //   console.log(`Strategy tracking name: ${strategyContractName}`)

  //   const sOwner = await strategyContract.owner()
  //   console.log(`Strategy owner: ${sOwner}`)

  //   const sDepositToken = await strategyContract.getDepositToken()
  //   console.log(`Strategy deposit token: ${sDepositToken}`)

  //   const sDepositTokenContract = new ethers.Contract(sDepositToken, erc20Abi, provider)

  //   const sDepositTokenName = await sDepositTokenContract.name()
  //   console.log(`Strategy deposit token name: ${sDepositTokenName}`)

  //   const sDepositTokenDecimals = await sDepositTokenContract.decimals()
  //   console.log(`Strategy deposit token decimals: ${sDepositTokenDecimals}`)
  //   const sTokenBalance = await sDepositTokenContract.balanceOf(strategyAddress)

  //   const formattedContractTokenBalance = ethers.utils.formatUnits(sTokenBalance, sDepositTokenDecimals)
  //   console.log(`Strategy Deposit token balance: ${formattedContractTokenBalance}`)
  // }

  // //   const trader_joe_abi = ["{
  // //       "inputs": [
  // //         {
  // //           "components": [
  // //             {
  // //               "internalType": "contract ITraderJoeLBPair",
  // //               "name": "lbPair",
  // //               "type": "address"
  // //             },
  // //             {
  // //               "internalType": "contract ITraderJoeLBRouter",
  // //               "name": "lbRouter",
  // //               "type": "address"
  // //             },
  // //             {
  // //               "internalType": "uint256",
  // //               "name": "binStep",
  // //               "type": "uint256"
  // //             },
  // //             {
  // //               "internalType": "uint256[]",
  // //               "name": "binIds",
  // //               "type": "uint256[]"
  // //             },
  // //             {
  // //               "internalType": "uint256[]",
  // //               "name": "binAllocations",
  // //               "type": "uint256[]"
  // //             },
  // //             {
  // //               "internalType": "uint256",
  // //               "name": "minValuation",
  // //               "type": "uint256"
  // //             }
  // //           ],
  // //           "internalType": "struct TraderJoe.TraderJoeArgs",
  // //           "name": "traderJoeArgs",
  // //           "type": "tuple"
  // //         }
  // //       ],
  // //       "name": "reinitialize",
  // //       "outputs": [],
  // //       "stateMutability": "nonpayable",
  // //       "type": "function"
  // //     }"]

  // const stargate_usdc_strategy = "0x8523AEEFf7F30ED463C6e05E64e90FCEA5cd9a26"

  // // const traderJoe = new ethers.Contract("0xec4042d20FCC06aBb52363f2e7f6be5396Ec79B5", trader_joe_abi, provider)

  // // // now re init
  // // const lBPair = "0x18332988456C4Bd9ABa6698ec748b331516F5A14"
  // // const lbRouter = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"
  // // const binStep = 0
  // // const binIds = []

  // //   const _owner = await hre.ethers.getSigner(owner)

  // //   const tx = await traderJoe.reinitialize(lBPair, lbRouter, binStep, binIds)

  // // this.libraries = {}
  // // this.libraries["TraderJoeInvestmentLib"] = library.address

  // // this.Strategy = await ethers.getContractFactory("TraderJoe", { libraries: this.libraries })
}

simulation()
