/**
 * T1.3 — Contract test mirror: ensure @usetheo/ui's dist/ honors the
 * consumer (theokit) expectations defined in ADR 0001.
 *
 * Roda como `pnpm test:contract`. Gateado por `prepublishOnly` —
 * publish bloqueado se contract test falha.
 *
 * EC-1 fix: PKG_ROOT é caminho absoluto via fileURLToPath(import.meta.url),
 * NÃO `require_.resolve('./dist/...')` que resolveria relativo ao test file.
 *
 * 5 it():
 *  1. default export é factory
 *  2. factory() retorna Plugin|Plugin[] válido
 *  3. factory({ tailwind: false }) não throw
 *  4. ./preset existe como .css
 *  5. ./styles.css + ./fonts.css existem
 */
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { describe, it, expect } from 'vitest'

// EC-1: PKG_ROOT é a raiz do package (theo-ui/), não o dir do teste.
// Este arquivo: theo-ui/tests/contract/theokit-consumer.test.ts → 2 níveis acima.
const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DIST = (relative: string) => join(PKG_ROOT, 'dist', relative)

function isValidPlugin(value: unknown): boolean {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  if (!('name' in value)) return false
  return typeof (value as Record<string, unknown>).name === 'string'
}

function normalizePluginReturn(value: unknown): unknown[] | null {
  if (Array.isArray(value)) {
    if (value.length === 0) return null
    return value.every(isValidPlugin) ? value : null
  }
  return isValidPlugin(value) ? [value] : null
}

describe('Contract: @usetheo/ui/vite-plugin honors theokit consumer expectations (ADR 0001)', () => {
  it('precondition — dist/ exists (run pnpm build first)', () => {
    expect(existsSync(DIST('vite-plugin.js'))).toBe(true)
  })

  it('default export of dist/vite-plugin.js is a factory function', async () => {
    // Given the contract from ADR 0001,
    // When we dynamic-import the dist entry,
    // Then the default export must be a function.
    const mod = await import(pathToFileURL(DIST('vite-plugin.js')).href)
    expect(typeof mod.default).toBe('function')
  })

  it('factory() returns a valid Vite Plugin or Plugin[]', async () => {
    // Given the factory is called with no args,
    // When we normalize the return value,
    // Then we must get a non-empty array of plugins each with name: string.
    const mod = await import(pathToFileURL(DIST('vite-plugin.js')).href)
    const result = (mod.default as () => unknown)()
    const normalized = normalizePluginReturn(result)
    expect(normalized).not.toBeNull()
    expect(normalized!.length).toBeGreaterThan(0)
  })

  it('factory({ tailwind: false }) does not throw', async () => {
    // Given consumers may opt out of the tailwind chain (theokit auto-chains it),
    // When we pass { tailwind: false },
    // Then the factory must accept it without throwing.
    const mod = await import(pathToFileURL(DIST('vite-plugin.js')).href)
    expect(() =>
      (mod.default as (o?: { tailwind?: boolean }) => unknown)({ tailwind: false }),
    ).not.toThrow()
  })

  it('./preset is a .css file', () => {
    // Given the consumer can `import preset from '@usetheo/ui/preset'`,
    // When the dist is shipped,
    // Then preset.css must be present.
    expect(existsSync(DIST('preset.css'))).toBe(true)
    expect(DIST('preset.css')).toMatch(/\.css$/)
  })

  it('./styles.css and ./fonts.css subpaths exist', () => {
    // Given theokit injects `import '@usetheo/ui/styles.css'` (and fonts.css),
    // When the dist is shipped,
    // Then both files must be present.
    expect(existsSync(DIST('styles.css'))).toBe(true)
    expect(existsSync(DIST('fonts.css'))).toBe(true)
  })
})
