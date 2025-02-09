import * as ipfsOnlyHash from 'ipfs-only-hash'
import * as actions from '../app/lit/actions'

import { updateEnvFile } from './utils'

async function generateIpfsCidFromString(data) {
  try {
    return await ipfsOnlyHash.of(data)
  } catch (error) {
    console.error('Error generating IPFS CID:', error)
  }
}

async function processLitActions() {
  for (const [actionName, actionExport] of Object.entries(actions)) {
    try {
      const cid = await generateIpfsCidFromString(actionExport)

      updateEnvFile(`VITE_${actionName.toUpperCase()}_IPFS_CID`, cid)

      console.log(`Updated .env with CID for ${actionName}: ${cid}`)
    } catch (error) {
      console.error(`Error processing ${actionName}:`, error)
    }
  }
}

processLitActions()