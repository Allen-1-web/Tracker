/** Telegram legacy Markdown (parse_mode: Markdown) reserved characters. */
const MARKDOWN_SPECIAL = /([_*[\]()~`>#+\-=|{}.!\\])/g

/** Escape user-controlled text embedded in Markdown messages. */
export function escapeMarkdown(text: string): string {
  return text.replace(MARKDOWN_SPECIAL, '\\$1')
}
