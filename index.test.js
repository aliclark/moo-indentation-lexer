const moo = require('moo');
const IndentationLexer = require('./');

describe('IndentationLexer', () => {

    it('runs on Moo example input', () => {
        const mooLexer = moo.compile({
            WS:      /[ \t]+/,
            comment: /\/\/.*?$/,
            number:  /0|[1-9][0-9]*/,
            string:  /"(?:\\["\\]|[^\n"\\])*"/,
            lparen:  '(',
            rparen:  ')',
            keyword: ['while', 'if', 'else', 'moo', 'cows'],
            NL:      { match: /\n/, lineBreaks: true },
        })
        const lexer = new IndentationLexer({
            lexer: mooLexer, indentationType: 'WS', newlineType: 'NL', indentationName: 'indentation', deindentationName: 'deindentation'
        });

        lexer.reset('while (10) cows\nmoo')

        expect(lexer.next().text).toBe('while');
        expect(lexer.next().text).toBe(' ');
        expect(lexer.next().text).toBe('(');
        expect(lexer.next().text).toBe('10');
        expect(lexer.next().text).toBe(')');
        expect(lexer.next().text).toBe(' ');
        expect(lexer.next().text).toBe('cows');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next().text).toBe('moo');
        expect(lexer.next()).toBe(undefined);
        expect(lexer.next()).toBe(undefined);
    });

    it('adds matching indentation and deindentation tokens', () => {
        const mooLexer = moo.compile({
            WS:      /[ \t]+/,
            comment: /\/\/.*?$/,
            number:  /0|[1-9][0-9]*/,
            string:  /"(?:\\["\\]|[^\n"\\])*"/,
            lparen:  '(',
            rparen:  ')',
            keyword: ['while', 'if', 'else', 'moo', 'cows', 'go'],
            NL:      { match: /\n/, lineBreaks: true },
        })
        const lexer = new IndentationLexer({
            lexer: mooLexer, indentationType: 'WS', newlineType: 'NL', indentationName: 'indentation', deindentationName: 'deindentation'
        });

        lexer.reset('while (10)\n\tcows\n\n\t\t\t\t\n\t\t\tgo\n  moo')

        expect(lexer.next().text).toBe('while');
        expect(lexer.next().text).toBe(' ');
        expect(lexer.next().text).toBe('(');
        expect(lexer.next().text).toBe('10');
        expect(lexer.next().text).toBe(')');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next().type).toBe('indentation');
        expect(lexer.next().text).toBe('\t');
        expect(lexer.next().text).toBe('cows');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next().text).toBe('\t\t\t\t');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next().type).toBe('indentation');
        expect(lexer.next().text).toBe('\t\t\t');
        expect(lexer.next().text).toBe('go');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next().type).toBe('deindentation');
        expect(lexer.next().type).toBe('deindentation');
        expect(lexer.next().type).toBe('indentation');
        expect(lexer.next().text).toBe('  ');
        expect(lexer.next().text).toBe('moo');
        expect(lexer.next()).toMatchObject({ col: 6, line: 6, offset: 34, text: '  ', value: '', type: 'deindentation' });
        expect(lexer.next()).toBe(undefined);
        expect(lexer.next()).toBe(undefined);
    });
})