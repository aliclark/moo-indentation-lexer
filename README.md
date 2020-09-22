# moo-indentation-lexer
## Usage
### Quick
```js
const moo = require('moo')
const IndentationLexer = require('moo-indentation-lexer')

// Create a lexer from rules
const mooLexer = moo.compile({ ... })
// Create an indentation-aware lexer using the lexer
const lexer = new IndentationLexer({ lexer: mooLexer })

// Specify the data
lexer.reset('...')

// In addition to the normal Moo tokens,
// extra indent/dedent tokens will be emitted for matching indentation/unindentation
// Indentation levels are also closed off by matching enclosures of {}, () and []
// When a separator and newline appears just before a de-indentation, the dedent
// will be emitted first, followed by the separator and newline.
lexer.next()
```
### Custom
```js
// Create a lexer from rules
const mooLexer = moo.compile({
    WS: /[ \t]+/,
    comment: /\/\/.*?$/,
    ...,
    NL: { match: /\n/, lineBreaks: true }
})
// Create an indentation-aware lexer using the lexer
const lexer = new IndentationLexer({
    lexer: mooLexer,
    indentationType: 'WS',
    newlineType: 'NL',
    commentType: 'comment',
    indentName: 'indent',
    dedentName: 'dedent',
    enclosingPunctuations: { '[': ']', '<': '>' },   // defaults {}, () and []
    separators: [',']
})
```
