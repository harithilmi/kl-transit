import { NAME_RULES } from './name-rules'

export function cleanStreetName(street: string): string {
  if (!street) return street

  // Remove leading/trailing spaces
  street = street.trim()

  // Split into words
  const words = street.split(' ')

  // Process each word
  const processedWords = words.map(word => {
    const wordUpper = word.toUpperCase()
    // Check if it's a street type
    if (wordUpper in NAME_RULES.street_types) {
      return NAME_RULES.street_types[wordUpper as keyof typeof NAME_RULES.street_types]
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  })

  return processedWords.join(' ')
}

export function cleanStopName(name: string): string {
  if (!name) return name

  // Remove leading/trailing spaces
  name = name.trim()

  // Remove prefix like (M), (M1)
  name = name.replace(/\(M\d?\)\s*/g, '')

  function processWord(word: string): string {
    const wordUpper = word.toUpperCase()
    if (NAME_RULES.uppercase.has(wordUpper)) {
      return wordUpper
    }
    if (wordUpper in NAME_RULES.street_types) {
      return NAME_RULES.street_types[wordUpper as keyof typeof NAME_RULES.street_types]
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }

  function processBracketedText(match: string, inner: string): string {
    inner = inner.trim()

    // Special case: single letter in brackets should be capitalized
    if (inner.length === 1) {
      return ` (${inner.toUpperCase()}) `
    }

    // Split the inner text and process each word
    const words = inner.split(' ')
    const processedWords = words.map(processWord)
    return ` (${processedWords.join(' ')}) `
  }

  // First process text in brackets
  const processedName = name.replace(/\(([^)]+)\)/g, processBracketedText)

  // Then process the rest of the text
  const parts = processedName.split(/(\s?\([^)]+\)\s?)/)

  const result = parts.map(part => {
    if (part.includes('(') && part.includes(')')) {
      return part
    } else {
      const subparts = part.split(/([/-])/)
      return subparts
        .map(subpart => {
          if (subpart === '/' || subpart === '-') return subpart
          return subpart.split(' ').map(processWord).join(' ')
        })
        .join('')
    }
  })

  // Clean up multiple spaces and trim
  return result.join('').replace(/\s+/g, ' ').trim()
} 