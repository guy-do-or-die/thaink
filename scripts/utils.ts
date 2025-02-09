import * as fs from 'fs'
import * as path from 'path'

import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


export function updateEnvFile(key: string, value: string): void {
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
