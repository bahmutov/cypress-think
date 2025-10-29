// Utility to discover and read agent instruction files
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

/**
 * Common agent instruction file paths to check
 * Ordered by priority (first found will be used)
 */
const INSTRUCTION_FILE_PATHS = [
  '.github/copilot-instructions.md',
  '.copilot-instructions.md',
  '.cursorrules',
  '.aidigestconfig',
  '.ai/instructions.md',
  'copilot-instructions.md',
]

/**
 * Finds and reads agent instruction files from the repository
 * @param {string} repoRoot - Root directory of the repository
 * @returns {Promise<string|null>} Content of the first found instruction file, or null
 */
export async function readAgentInstructions(
  repoRoot = process.cwd(),
) {
  for (const filePath of INSTRUCTION_FILE_PATHS) {
    const fullPath = join(repoRoot, filePath)
    if (existsSync(fullPath)) {
      try {
        const content = await readFile(fullPath, 'utf-8')
        if (content.trim()) {
          console.log(`Found agent instructions in: ${filePath}`)
          return content.trim()
        }
      } catch (error) {
        console.warn(`Failed to read ${filePath}:`, error.message)
      }
    }
  }
  return null
}
