import * as ipfsOnlyHash from 'ipfs-only-hash'
import * as actions from '../app/lit/actions'

import { minifyWithTerser } from "../app/lit/actions/utils"

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
      const minifiedAction = await minifyWithTerser(actionExport.toString())
      const cid = await generateIpfsCidFromString(minifiedAction)

      updateEnvFile(`VITE_${actionName.toUpperCase()}_IPFS_CID`, cid)

      console.log(`Updated .env with CID for ${actionName}: ${cid}`)
    } catch (error) {
      console.error(`Error processing ${actionName}:`, error)
    }
  }
}

processLitActions()
