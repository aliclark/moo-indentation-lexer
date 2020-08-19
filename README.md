# moo-indentation-lexer
## Usage
```js
const moo = require('moo');
const PeekableLexer = require('moo-peekable-lexer');
const IndentationLexer = require('moo-indentation-lexer');

// Create a lexer from rules
const mooLexer = moo.compile({
    WS: /[ \t]+/,
    ...,
    NL: { match: /\n/, lineBreaks: true }
});
// Create a peekable lexer using the Moo lexer
const peekableLexer = new PeekableLexer({ mooLexer });
// Create an indentation-aware lexer using the peekable lexer
const indentationLexer = new IndentationLexer({
    peekableLexer,
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
