import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useAccount, useConnect, useContractWrite, useDisconnect } from 'wagmi'
import { Button } from './components/ui/button'
import { usePrivy } from '@privy-io/react-auth'
import { parseEther } from 'viem'

const THAINK_ADDRESS = import.meta.env.VITE_THAINK_ADDRESS
if (!THAINK_ADDRESS) {
  throw new Error('VITE_THAINK_ADDRESS environment variable is not set')
}

function App() {
  const { login, ready, authenticated } = usePrivy()
  const { address } = useAccount()
  const { disconnect } = useDisconnect()

  const { write: mint, isLoading: isMinting } = useContractWrite({
    address: THAINK_ADDRESS,
    abi: [{
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'id', type: 'uint256' },
        { name: 'amount', type: 'uint256' }
      ],
      name: 'mint',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }],
    functionName: 'mint',
  })

  if (!ready) {
    return <div>Loading...</div>
  }

  const handleMint = async (id: number) => {
    if (!address) {
      console.error('No wallet address available')
      return
    }
    if (!mint) {
      console.error('Mint function not available')
      return
    }
    try {
      await mint({
        args: [address, BigInt(id), BigInt(1)]
      })
    } catch (error) {
      console.error('Error minting:', error)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Thaink Tank</h1>
        {authenticated ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{address}</span>
            <Button onClick={() => disconnect()}>Disconnect</Button>
          </div>
        ) : (
          <Button onClick={() => login()}>Connect Wallet</Button>
        )}
      </div>

      {authenticated && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-2">Tank #{i}</h2>
              <Button
                onClick={() => handleMint(i)}
                disabled={isMinting}
              >
                {isMinting ? 'Minting...' : 'Mint'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
