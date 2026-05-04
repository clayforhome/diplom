/* eslint-disable */
// @ts-nocheck
// biome-ignore lint: disable
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

try {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const LOCALES_DIR = path.resolve(__dirname, '../locales')
  const OUTPUT_FILE = path.resolve(__dirname, '../types/i18n.generated.d.ts')
  const SUPPORTED_LOCALES_OUTPUT_FILE = path.resolve(__dirname, './supportedLocales.ts')
  const languageNameField = '$name'

  const generateType = (obj: any, indent = 2): string => {
    let result = '{\n'
    const indentation = ' '.repeat(indent)
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        result += `${indentation}"${key}": ${generateType(obj[key], indent + 2)}\n`
      } else if (typeof obj[key] === 'string') {
        // Checking for for placeholders {name}
        const regex = /{(\w+)}/g
        let match
        const params = new Set<string>()
        while ((match = regex.exec(obj[key])) !== null) {
          params.add(match[1])
        }
        // if (params.size > 0 || false) {
        if (false) {
          const paramList = Array.from(params)
            .map((p) => `${p}: string`)
            .join('; ')
          result += `${indentation}"${key}": (params: { ${paramList} }) => string\n`
        } else {
          result += `${indentation}"${key}": string\n`
        }
      } else {
        result += `${indentation}"${key}": string\n`
      }
    }
    result += `${' '.repeat(indent - 2)}}`
    return result
  }

  const files = fs.readdirSync(LOCALES_DIR).filter((file) => file.endsWith('.json'))

  if (files.length === 0) {
    console.error('❌ Translation JSON files not found in folder:', LOCALES_DIR)
    process.exit(1)
  }

  console.log('Translation files:', files)

  // Use first json fine as a template to generate types
  let jsonFileName = files.filter((x) => x.includes('ru'))[0]
  const firstLocalePath = path.join(LOCALES_DIR, jsonFileName)
  const firstLocaleData = JSON.parse(fs.readFileSync(firstLocalePath, 'utf-8'))

  const typeDefinition = `// ⚡ Auto generated file. DO NOT EDIT
export interface MessagesSchema ${generateType(firstLocaleData)}

export type AvailableLocales = ${files.map((f) => `'${f.replace('.json', '')}'`).join(' | ')}
`

  const typeDefinition2 = `// ⚡ Auto generated file. DO NOT EDIT
export const supportedLocales = [${files
    .map((f) => {
      const languageName = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, f), 'utf-8'))[
        languageNameField
      ]
      return `{name: '${languageName}', code: '${f.replace('.json', '')}'}`
    })
    .join(' , ')}] as const
`

  const outputDir = path.dirname(OUTPUT_FILE)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(OUTPUT_FILE, typeDefinition, 'utf-8')
  fs.writeFileSync(SUPPORTED_LOCALES_OUTPUT_FILE, typeDefinition2, 'utf-8')
  console.log(`✅ File ${OUTPUT_FILE} generated successfully!`)
  console.log(`✅ File ${SUPPORTED_LOCALES_OUTPUT_FILE} generated successfully!`)
} catch (error) {
  console.error('Error generating i18n types:', error)
  process.exit(1)
}
