
class LexerIterator {
    constructor(lexer) {
        this._lexer = lexer
    }

    next() {
        const token = this._lexer.next()
        return { value: token, done: !token }
    }

    [Symbol.iterator]() {
        return this
    }
}

class IndentationLexer {
    constructor({
                    lexer, indentationType, newlineType, indentName, dedentName,
                    state, indentations, queuedTokens, queuedLines, lastToken
    }) {
        this._lexer = lexer.peek ? lexer : this._makeLexer(lexer)
        this._indentationType = indentationType
        this._newlineType = newlineType
        this._indentName = indentName || 'indent'
        this._dedentName = dedentName || 'dedent'
        this._state = state || 'lineStart'
        this._indentations = indentations || ['']
        this._queuedTokens = queuedTokens || []
        this._queuedLines = queuedLines || []
        this._lastToken = lastToken || null
    }

    _makeLexer(lexer) {
        const PeekableLexer = require('moo-peekable-lexer');
        return new PeekableLexer({ lexer });
    }

    reset(data, info) {
        this._state = info ? info.state : 'lineStart'
        this._indentations = info ? [...info.indentations] : ['']
        this._queuedTokens = info ? [...info.queuedTokens] : []
        this._queuedLines = info ? [...info.queuedLines] : []
        this._lastToken = info ? [...info.lastToken] : null
        return this._lexer.reset(data, info && info.lexerInfo)
    }

    save() {
        return {
            state: this._state,
            indentations: [...this._indentations],
            queuedTokens: [...this._queuedTokens],
            queuedLines: [...this._queuedLines],
            lastToken: this._lastToken,
            lexerInfo: this._lexer.save()
        }
    }

    setState(state) {
        return this._lexer.setState(state)
    }

    popState() {
        return this._lexer.popState()
    }

    pushState(state) {
        return this._lexer.pushState(state)
    }

    _getToken() {
        const token = this._lexer.next()
        if (!token) {
            return token
        }
        this._lastToken = token
        return this._lastToken
    }

    next() {
        const nextToken = this._lexer.peek()

        if (this._state === 'lineStart') {
            if (nextToken && nextToken.type === this._indentationType) {
                this._queuedTokens.push(this._getToken())
                return this.next()
            }
            this._state = 'lineReading'
            return this.next()
        }

        if (this._state === 'lineReading') {
            if (nextToken && nextToken.type === this._newlineType) {
                this._queuedTokens.push(this._getToken())
                this._state = 'lineStart'
            } else {
                this._state = 'lineContent'
            }
            this._queuedLines.push(this._queuedTokens)
            this._queuedTokens = []
            return this.next()
        }

        if (this._state === 'lineContent') {
            if (this._queuedTokens.length !== 0) {
                return this._queuedTokens.shift()
            }
            if (this._queuedLines.length !== 0) {
                this._queuedTokens = this._queuedLines.shift()

                if (this._queuedLines.length === 0) {
                    this._state = 'reIndentation'
                }
                return this.next()
            }
            if (!nextToken && this._indentations.length > 1) {
                this._state = 'reIndentation'
                return this.next()
            }

            const token = this._getToken()

            if (token && token.type === this._newlineType) {
                this._state = 'lineStart'
            }
            return token
        }

        if (this._state === 'reIndentation') {

            const indentationLevel = this._indentations[this._indentations.length - 1]
            const indentation = this._queuedTokens.map(({ value }) => value).join('')

            if (indentation === indentationLevel) {
                this._state = 'lineContent'
                return this.next()
            }

            const startToken = this._queuedTokens.length !== 0 ? this._queuedTokens[0] : nextToken

            if (nextToken && indentation.startsWith(indentationLevel)) {
                this._indentations.push(indentation)
                return {
                    type: this._indentName,
                    value: indentation,
                    text: indentationLevel,
                    toString: startToken.toString,
                    offset: startToken.offset,
                    lineBreaks: 0,
                    line: startToken.line,
                    col: startToken.col
                }
            }

            this._indentations.pop()
            return {
                type: this._dedentName,
                value: indentation,
                text: indentationLevel,
                toString: startToken ? startToken.toString : this._lastToken.toString,
                offset: startToken ? startToken.offset : this._lastToken.offset + this._lastToken.text.length,
                lineBreaks: 0,
                line: startToken ? startToken.line : this._lastToken.line,
                col: startToken ? startToken.col : this._lastToken.col + this._lastToken.text.length
            }
        }
    }

    [Symbol.iterator]() {
        return new LexerIterator(this)
    }

    formatError(token, message) {
        return this._lexer.formatError(token, message)
    }

    clone() {
        const lexer = this._lexer.clone()
        const indentationType = this._indentationType
        const newlineType = this._newlineType
        const indentationName = this._indentationName
        const dedentName = this._dedentName
        const state = this._state
        const indentations = [...this._indentations]
        const queuedTokens = [...this._queuedTokens]
        const queuedLines = [...this._queuedLines]
        const lastToken = this._lastToken
        return new IndentationLexer({
            lexer, indentationType, newlineType, indentationName, dedentName,
            state, indentations, queuedTokens, queuedLines, lastToken
        })
    }

    has(tokenType) {
        return this._lexer.has(tokenType)
    }
}

module.exports = IndentationLexer;
