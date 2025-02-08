import * as fs from 'fs'
import * as path from 'path'

import { fileURLToPath } from 'url'

import * as ipfsOnlyHash from 'ipfs-only-hash'
import * as actions from '../app/lit/actions'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateIpfsCidFromString(data) {
  try {
    return await ipfsOnlyHash.of(data)
  } catch (error) {
    console.error('Error generating IPFS CID:', error)
  }
}

function updateEnvFile(key, value) {
  const newLine = `${key}=${value}`
  const regex = new RegExp(`^${key}=.*`, 'm')
  const envPath = path.resolve(__dirname, '../.env')

  let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : ''

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, newLine)
  } else {
    envContent += `\n${newLine}`
  }

  fs.writeFileSync(envPath, envContent, 'utf-8')
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