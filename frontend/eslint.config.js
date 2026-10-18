import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import stripJsonComments from 'strip-json-comments'

const compat = new FlatCompat({
  baseDirectory: fileURLToPath(new URL('.', import.meta.url)),
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default compat.config(JSON.parse(stripJsonComments(readFileSync(new URL('.eslintrc.json', import.meta.url), 'utf8'))))
