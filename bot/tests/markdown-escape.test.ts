import { describe, expect, it } from 'vitest'
import { escapeMarkdown } from '../src/shared/telegram/markdown.js'

describe('escapeMarkdown', () => {
  it('escapes Telegram Markdown special characters', () => {
    expect(escapeMarkdown('100%_done')).toBe('100%\\_done')
    expect(escapeMarkdown('*bold*')).toBe('\\*bold\\*')
    expect(escapeMarkdown('[link](x)')).toBe('\\[link\\]\\(x\\)')
  })

  it('leaves plain text unchanged', () => {
    expect(escapeMarkdown('Утренняя зарядка')).toBe('Утренняя зарядка')
  })
})
