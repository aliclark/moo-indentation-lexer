const moo = require('moo');
const PeekLexer = require('moo-peek-lexer');
const IndentationLexer = require('./');

describe('IndentationLexer', () => {

    it('runs on example input', () => {
        const lexer = moo.compile({
            WS:      /[ \t]+/,
            comment: /\/\/.*?$/,
            number:  /0|[1-9][0-9]*/,
            string:  /"(?:\\["\\]|[^\n"\\])*"/,
            lparen:  '(',
            rparen:  ')',
            keyword: ['while', 'if', 'else', 'moo', 'cows'],
            NL:      { match: /\n/, lineBreaks: true },
        })
        const peekLexer = new PeekLexer({ lexer });
        const indentationLexer = new IndentationLexer({
            peekLexer, indentationType: 'WS', newlineType: 'NL', indentationName: 'indentation', deindentationName: 'deindentation'
        });

        indentationLexer.reset('while (10) cows\nmoo')

        expect(indentationLexer.next().text).toBe('while');
        expect(indentationLexer.next().text).toBe(' ');
        expect(indentationLexer.next().text).toBe('(');
        expect(indentationLexer.next().text).toBe('10');
        expect(indentationLexer.next().text).toBe(')');
        expect(indentationLexer.next().text).toBe(' ');
        expect(indentationLexer.next().text).toBe('cows');
        expect(indentationLexer.next().text).toBe('\n');
        expect(indentationLexer.next().text).toBe('moo');
        expect(indentationLexer.next()).toBe(undefined);
        expect(indentationLexer.next()).toBe(undefined);
    });

    it('can indent', () => {
        const lexer = moo.compile({
            WS:      /[ \t]+/,
            comment: /\/\/.*?$/,
            number:  /0|[1-9][0-9]*/,
            string:  /"(?:\\["\\]|[^\n"\\])*"/,
            lparen:  '(',
            rparen:  ')',
            keyword: ['while', 'if', 'else', 'moo', 'cows', 'go'],
            NL:      { match: /\n/, lineBreaks: true },
        })
        const peekLexer = new PeekLexer({ lexer });
        const indentationLexer = new IndentationLexer({
            peekLexer, indentationType: 'WS', newlineType: 'NL', indentationName: 'indentation', deindentationName: 'deindentation'
        });

        indentationLexer.reset('while (10)\n\tcows\n\t\t\tgo\n  moo')

        expect(indentationLexer.next().text).toBe('while');
        expect(indentationLexer.next().text).toBe(' ');
        expect(indentationLexer.next().text).toBe('(');
        expect(indentationLexer.next().text).toBe('10');
        expect(indentationLexer.next().text).toBe(')');
        expect(indentationLexer.next().text).toBe('\n');
        expect(indentationLexer.next().type).toBe('indentation');
        expect(indentationLexer.next().text).toBe('\t');
        expect(indentationLexer.next().text).toBe('cows');
        expect(indentationLexer.next().text).toBe('\n');
        expect(indentationLexer.next().type).toBe('indentation');
        expect(indentationLexer.next().text).toBe('\t\t\t');
        expect(indentationLexer.next().text).toBe('go');
        expect(indentationLexer.next().text).toBe('\n');
        expect(indentationLexer.next().type).toBe('deindentation');
        expect(indentationLexer.next().type).toBe('deindentation');
        expect(indentationLexer.next().type).toBe('indentation');
        expect(indentationLexer.next().text).toBe('  ');
        expect(indentationLexer.next().text).toBe('moo');
        expect(indentationLexer.next()).toMatchObject({ col: 6, line: 4, offset: 28, text: '  ', value: '', type: 'deindentation' });
        expect(indentationLexer.next()).toBe(undefined);
        expect(indentationLexer.next()).toBe(undefined);
    });
})