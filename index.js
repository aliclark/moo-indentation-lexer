
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
                    lexer, indentationType, newlineType, commentType, indentName, dedentName,
                    state, indentations, queuedTokens, queuedLines, lastToken
    }) {
        this._lexer = lexer.peek ? lexer : this._makeLexer(lexer)
        this._indentationType = indentationType
        this._newlineType = newlineType
        this._commentType = commentType || null
        this._indentName = indentName || 'INDENT'
        this._dedentName = dedentName || 'DEDENT'
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
        this._lastToken = info ? info.lastToken : null
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
            if (nextToken) {
                if (nextToken.type === this._indentationType) {
                    this._queuedTokens.push(this._getToken())
                    return this.next()
                }
                if (nextToken.type === this._newlineType
                    || this._commentType !== null && nextToken.type === this._commentType) {
                    this._state = 'lineEnding'
                    return this.next()
                }
            }
            this._state = 'lineContent'
            this._queuedLines.push(this._queuedTokens)
            this._queuedTokens = []
            return this.next()
        }

        if (this._state === 'lineEnding') {
            this._queuedTokens.push(this._getToken())

            if (nextToken.type === this._newlineType) {
                this._state = 'lineStart'
                this._queuedLines.push(this._queuedTokens)
                this._queuedTokens = []
            }
            return this.next()
        }

        if (this._state === 'lineContent') {
            const indentationLevel = this._indentations[this._indentations.length - 1]
            const indentation = (this._queuedLines[this._queuedLines.length - 1] || []).map(({ value }) => value).join('')

            if (!nextToken && this._indentations.length > 1) {
                this._indentations.pop()
                return {
                    type: this._dedentName,
                    value: '',
                    text: '',
                    toString: this._lastToken.toString,
                    offset: this._lastToken.offset + this._lastToken.text.length,
                    lineBreaks: 0,
                    line: this._lastToken.line,
                    col: this._lastToken.col + this._lastToken.text.length,
                    indentation: this._indentations[this._indentations.length - 1]
                }
            }

            if (!nextToken || indentation === indentationLevel) {
                this._state = 'bufferFlush'
                return this.next()
            }

            if (indentation.startsWith(indentationLevel)) {
                this._indentations.push(indentation)
                const startToken = this._queuedLines[0][0]
                return {
                    type: this._indentName,
                    value: '',
                    text: '',
                    toString: startToken.toString,
                    offset: startToken.offset,
                    lineBreaks: 0,
                    line: startToken.line,
                    col: startToken.col,
                    indentation: indentation
                }
            }

            this._indentations.pop()
            const startToken = this._queuedLines[0][0]
            return {
                type: this._dedentName,
                value: '',
                text: '',
                toString: startToken.toString,
                offset: startToken.offset,
                lineBreaks: 0,
                line: startToken.line,
                col: startToken.col,
                indentation: this._indentations[this._indentations.length - 1]
            }
        }

        if (this._state === 'bufferFlush') {

            if (this._queuedLines.length === 0) {
                this._state = 'lineFlush'
                return this.next()
            }
            if (this._queuedLines[0].length === 0) {
                this._queuedLines.shift()
                return this.next()
            }
            return this._queuedLines[0].shift()
        }

        if (this._state === 'lineFlush') {

            if (!nextToken && this._indentations.length > 1) {
                this._state = 'lineContent'
                return this.next()
            }

            const token = this._getToken()

            if (token && token.type === this._newlineType) {
                this._state = 'lineStart'
            }
            return token
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
        const commentType = this._commentType
        const indentName = this._indentName
        const dedentName = this._dedentName
        const state = this._state
        const indentations = [...this._indentations]
        const queuedTokens = [...this._queuedTokens]
        const queuedLines = [...this._queuedLines]
        const lastToken = this._lastToken
        return new IndentationLexer({
            lexer, indentationType, newlineType, commentType, indentName, dedentName,
            state, indentations, queuedTokens, queuedLines, lastToken
        })
    }

    has(tokenType) {
        return tokenType === this._indentName
            || tokenType === this._dedentName
            || this._lexer.has(tokenType)
    }
}

module.exports = IndentationLexer;
