# moo-indent-lexer
## Usage
```js
const moo = require('moo');
const PeekLexer = require('moo-peek-lexer');
const IndentationLexer = require('moo-indentation-lexer');

// Create a lexer from rules
const lexer = moo.compile({
    WS: /[ \t]+/,
    ...,
    NL: { match: /\n/, lineBreaks: true }
});
// Create a peek-able lexer using the Moo lexer
const peekLexer = new PeekLexer({ lexer });
// Create an indentation-aware lexer using the peek-able lexer
const indentationLexer = new IndentationLexer({
    peekLexer,
    indentationType: 'WS',
    newlineType: 'NL',
    indentationName: 'indentation',
    deindentationName: 'deindentation'
});

// Specify the data
indentationLexer.reset('...')

// In addition to the normal Moo tokens,
// extra tokens will be emitted for matching indentation/deindentation
indentationLexer.next()
```