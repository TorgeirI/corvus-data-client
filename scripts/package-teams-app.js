#!/usr/bin/env node
/**
 * Script to package Teams app for sideloading
 * Creates a zip file with manifest.json and icons
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createWriteStream } from 'fs'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

async function packageTeamsApp() {
  const publicDir = path.join(projectRoot, 'public')
  const outputDir = path.join(projectRoot, 'teams-package')
  const packageName = 'corvus-adx-teams-app.zip'
  const packagePath = path.join(outputDir, packageName)

  try {
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Files to include in the package
    const requiredFiles = [
      'manifest.json',
      'color.png',
      'outline.png'
    ]

    // Check if all required files exist
    for (const file of requiredFiles) {
      const filePath = path.join(publicDir, file)
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`)
      }
    }

    // Create the zip package using system zip command
    const filesToZip = requiredFiles.map(f => `"${f}"`).join(' ')
    const zipCommand = `cd "${publicDir}" && zip -r "${packagePath}" ${filesToZip}`
    
    console.log('📦 Creating Teams app package...')
    await execAsync(zipCommand)
    
    // Verify the package was created
    if (fs.existsSync(packagePath)) {
      const stats = fs.statSync(packagePath)
      console.log(`✅ Teams app package created successfully!`)
      console.log(`📁 Location: ${packagePath}`)
      console.log(`📏 Size: ${(stats.size / 1024).toFixed(2)} KB`)
      console.log('')
      console.log('🚀 To install in Microsoft Teams:')
      console.log('1. Open Microsoft Teams')
      console.log('2. Go to Apps > Manage your apps')
      console.log('3. Click "Upload an app" > "Upload a custom app"')
      console.log(`4. Select the file: ${packageName}`)
      console.log('')
      console.log('🌐 Make sure your development server is running on https://localhost:3000')
    } else {
      throw new Error('Package creation failed')
    }

  } catch (error) {
    console.error('❌ Error creating Teams app package:', error.message)
    process.exit(1)
  }
}

// Run the packaging
packageTeamsApp()