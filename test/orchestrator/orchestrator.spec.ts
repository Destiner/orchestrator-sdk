import { Address, Hex } from 'viem'
import { Execution, getOrchestrator, MetaIntent } from '../../src'
import { Orchestrator } from '../../src/orchestrator' // Ensure this path is correct
import { getTokenAddress } from '../../src/constants'
import { postMetaIntentWithOwnableValidator } from '../utils/safe7579Signature'
import dotenv from 'dotenv'
dotenv.config()

// Utility function to generate a random Ethereum address
const generateRandomAddress = (): Address => {
  const randomHex = () => Math.floor(Math.random() * 16).toString(16)
  return ('0x' + Array.from({ length: 40 }, randomHex).join('')) as Address
}

describe('Orchestrator Service', () => {
  let orchestrator: Orchestrator

  const accountAddress = '0xE13557f24C6f94B68eEF19Ea2800C086E219F23F'

  const execution: Execution = {
    target: '0x7e287a503f0d19b7899c15e80eb18c0ee55ffd12',
    value: 1n,
    callData: '0x',
  }

  const metaIntent: MetaIntent = {
    targetChainId: 8453, // Base
    tokenTransfers: [
      {
        tokenAddress: getTokenAddress('USDC', 8453),
        amount: 10n,
      },
    ],
    targetAccount: accountAddress,
    targetExecutions: [execution],
  }

  beforeAll(async () => {
    orchestrator = getOrchestrator(
      process.env.ORCHESTRATOR_API_KEY!,
    ) as unknown as Orchestrator
  })

  afterAll(async () => {
    // cleanup
  })

  it('should get the portfolio of a user', async () => {
    const portfolio = await orchestrator.getPortfolio(accountAddress)

    expect(portfolio).toBeDefined()
  }, 100_000)

  it('should get the order path for a user', async () => {
    const { orderBundle, injectedExecutions } = await orchestrator.getOrderPath(
      metaIntent,
      accountAddress,
    )

    expect(orderBundle).toBeDefined()
    expect(injectedExecutions).toBeDefined()

    console.log(JSON.stringify(orderBundle))
    console.log(injectedExecutions)
  }, 100_000)

  it('should post a meta intent with ownable validator and return a bundle ID', async () => {
    const bundleId = await postMetaIntentWithOwnableValidator(
      metaIntent,
      accountAddress,
      process.env.BUNDLE_GENERATOR_PRIVATE_KEY! as Hex,
      orchestrator,
    )

    expect(bundleId).toBeDefined()

    // Wait for 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5_000))
    // Get the bundle status
    const bundleStatus = await orchestrator.getBundleStatus(bundleId)

    expect(bundleStatus).toBeDefined()

    expect(bundleStatus.bundleStatus).toBe('FILLED')

    console.log(bundleStatus)
  }, 100_000)
})
