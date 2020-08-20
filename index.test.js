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
            lexer: mooLexer, indentationType: 'WS', newlineType: 'NL', commentType: 'comment', indentName: 'INDENT', dedentName: 'DEDENT'
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

    it('adds matching indent and dedent tokens', () => {
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
            lexer: mooLexer, indentationType: 'WS', newlineType: 'NL', commentType: 'comment', indentName: 'INDENT', dedentName: 'DEDENT'
        });

        lexer.reset('\nwhile (10)\n\tcows\n\n // comment\n\t\t\t\t\n\t\t\tgo\n  moo')

        expect(lexer.next().text).toBe('\n');
        expect(lexer.next().text).toBe('while');
        expect(lexer.next().text).toBe(' ');
        expect(lexer.next().text).toBe('(');
        expect(lexer.next().text).toBe('10');
        expect(lexer.next().text).toBe(')');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next()).toMatchObject({ type: 'INDENT', text: '\t', value: '\t' });
        expect(lexer.next().text).toBe('\t');
        expect(lexer.next().text).toBe('cows');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next().text).toBe(' ');
        expect(lexer.next().text).toBe('// comment');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next().text).toBe('\t\t\t\t');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next()).toMatchObject({ type: 'INDENT', text: '\t\t\t', value: '\t\t' });
        expect(lexer.next().text).toBe('\t\t\t');
        expect(lexer.next().text).toBe('go');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next()).toMatchObject({ type: 'DEDENT', text: '\t\t\t', value: '\t\t' });
        expect(lexer.next()).toMatchObject({ type: 'DEDENT', text: '\t', value: '\t' });
        expect(lexer.next()).toMatchObject({ type: 'INDENT', text: '  ', value: '  ' });
        expect(lexer.next().text).toBe('  ');
        expect(lexer.next().text).toBe('moo');
        expect(lexer.next()).toMatchObject({ type: 'DEDENT', col: 6, line: 8, offset: 47, text: '  ', value: '  ' });
        expect(lexer.next()).toBe(undefined);
        expect(lexer.next()).toBe(undefined);
    });

    it('can end on an indent', () => {
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
            lexer: mooLexer, indentationType: 'WS', newlineType: 'NL', commentType: 'comment', indentName: 'INDENT', dedentName: 'DEDENT'
        });

//        lexer.reset('\n\n\n\ncows\n\t\t')
        lexer.reset('cows\n\tcows\n\t\tcows\n\t')

        expect(lexer.next().text).toBe('cows');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next()).toMatchObject({ type: 'INDENT', text: '\t', value: '\t' });
        expect(lexer.next().text).toBe('\t');
        expect(lexer.next().text).toBe('cows');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next()).toMatchObject({ type: 'INDENT', text: '\t\t', value: '\t' });
        expect(lexer.next().text).toBe('\t\t');
        expect(lexer.next().text).toBe('cows');
        expect(lexer.next().text).toBe('\n');
        expect(lexer.next().text).toBe('\t');
        expect(lexer.next()).toMatchObject({ type: 'DEDENT', text: '\t\t', value: '\t' });
        expect(lexer.next()).toMatchObject({ type: 'DEDENT', text: '\t', value: '\t' });
        expect(lexer.next()).toBe(undefined);
    });
})