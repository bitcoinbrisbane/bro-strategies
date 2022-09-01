export interface Oracle {
  name: string
  address: string
}

export const Oracles = {
  aave: {
    name: "AaveOracle",
    address: "0xEBd36016B3eD09D4693Ed4251c67Bd858c3c7C9C",
  },
  gmx: {
    name: "GmxOracle",
    address: "0x81b7e71a1d9e08a6ca016a0f4d6fa50dbce89ee3",
  },
}
