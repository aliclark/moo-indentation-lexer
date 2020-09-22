const moo = require('moo')
const IndentationLexer = require('./')

describe('IndentationLexer', () => {
    let mooLexer
    let lexer

    beforeEach(() => {
        mooLexer = moo.compile({
            WS:      /[ \t]+/,
            comment: /\/\/.*?$/,
            number:  /0|[1-9][0-9]*/,
            string:  /"(?:\\["\\]|[^\n"\\])*"/,
            lparen:  '(',
            rparen:  ')',
            lbrace: '{',
            rbrace: '}',
            comma: ',',
            keyword: ['while', 'if', 'else', 'moo', 'cows', 'go'],
            NL:      { match: /\n/, lineBreaks: true },
        })

        lexer = new IndentationLexer({ lexer: mooLexer, commentType: 'comment' })
    })

    it('runs on Moo example input', () => {

        lexer.reset('while (10) cows\nmoo')

        expect(lexer.next().text).toBe('while')
        expect(lexer.next().text).toBe(' ')
        expect(lexer.next().text).toBe('(')
        expect(lexer.next().text).toBe('10')
        expect(lexer.next().text).toBe(')')
        expect(lexer.next().text).toBe(' ')
        expect(lexer.next().text).toBe('cows')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next().text).toBe('moo')
        expect(lexer.next()).toBe(undefined)
    })

    it('adds matching indent and dedent tokens', () => {

        lexer.reset('\nwhile (10)\n\tcows,\n\n\t// comment\n\t\t\t\t\n\t\t\tgo\n  moo')

        expect(lexer.next().text).toBe('\n')
        expect(lexer.next().text).toBe('while')
        expect(lexer.next().text).toBe(' ')
        expect(lexer.next().text).toBe('(')
        expect(lexer.next().text).toBe('10')
        expect(lexer.next().text).toBe(')')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next()).toMatchObject({ type: 'indent', indentation: '\t' })
        expect(lexer.next().text).toBe('\t')
        expect(lexer.next().text).toBe('cows')
        expect(lexer.next().text).toBe(',')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next()).toMatchObject({ type: 'indent', indentation: '\t\t\t' })
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next().text).toBe('\t')
        expect(lexer.next().text).toBe('// comment')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next().text).toBe('\t\t\t\t')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next().text).toBe('\t\t\t')
        expect(lexer.next().text).toBe('go')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next()).toMatchObject({ type: 'dedent', indentation: '\t' })
        expect(lexer.next()).toMatchObject({ type: 'dedent', indentation: '' })
        expect(lexer.next().text).toBe('  ')
        expect(lexer.next().text).toBe('moo')
        expect(lexer.next()).toBe(undefined)
    })

    it('can end on an indent', () => {

        lexer.reset('cows\n\t{((cows\n\t\tcows))},\n\t')

        expect(lexer.next().text).toBe('cows')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next()).toMatchObject({ type: 'indent', indentation: '\t' })
        expect(lexer.next().text).toBe('\t')
        expect(lexer.next().text).toBe('{')
        expect(lexer.next().text).toBe('(')
        expect(lexer.next().text).toBe('(')
        expect(lexer.next().text).toBe('cows')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next()).toMatchObject({ type: 'indent', indentation: '\t\t' })
        expect(lexer.next().text).toBe('\t\t')
        expect(lexer.next().text).toBe('cows')
        expect(lexer.next()).toMatchObject({ type: 'dedent', indentation: '\t' })
        expect(lexer.next().text).toBe(')')
        expect(lexer.next().text).toBe(')')
        expect(lexer.next().text).toBe('}')
        expect(lexer.next()).toMatchObject({ type: 'dedent', indentation: '' })
        expect(lexer.next().text).toBe(',')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next().text).toBe('\t')
        expect(lexer.next()).toBe(undefined)
    })

    it('adds indent and dedent tokens early', () => {

        lexer.reset('cows\n\n\n\t\t\n\tcows\n\t\t\n\t\n\ncows\n')

        expect(lexer.next().text).toBe('cows')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next()).toMatchObject({ type: 'indent', indentation: '\t' })
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next().text).toBe('\t\t')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next().text).toBe('\t')
        expect(lexer.next().text).toBe('cows')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next()).toMatchObject({ type: 'dedent', indentation: '' })
        expect(lexer.next().text).toBe('\t\t')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next().text).toBe('\t')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next().text).toBe('cows')
        expect(lexer.next().text).toBe('\n')
        expect(lexer.next()).toBe(undefined)
    })
})