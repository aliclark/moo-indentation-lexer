# moo-indentation-lexer
## Usage
```js
const moo = require('moo');
const IndentationLexer = require('moo-indentation-lexer');

// Create a lexer from rules
const mooLexer = moo.compile({
    WS: /[ \t]+/,
    ...,
    NL: { match: /\n/, lineBreaks: true }
});
// Create an indentation-aware lexer using the lexer
const lexer = new IndentationLexer({
    lexer: mooLexer,
    indentationType: 'WS',
    newlineType: 'NL',
    indentationName: 'indentation',
    deindentationName: 'deindentation'
});

// Specify the data
lexer.reset('...')

// In addition to the normal Moo tokens,
// extra tokens will be emitted for matching indentation/deindentation
lexer.next()
```
