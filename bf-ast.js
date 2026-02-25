/**
 * @file bf-ast.js
 * @copyright 2026 PlasticHeart
 */

!(root => {
    class Ast {
        /**
         * @returns {string}
         */
        toString() { throw new Error('unimplemented') }
    }

    class Root extends Ast {
        /**
         * @param {Ast[]} children
         */
        constructor(children) {
            super()
            this.children = children
        }

        /**
         * @returns {string}
         */
        toString() { return this.children.map(x => x.toString()).join('') }
    }

    class Next extends Ast {
        /**
         * @returns {string}
         */
        toString() { return '>' }
    }

    class Prev extends Ast {
        /**
         * @returns {string}
         */
        toString() { return '<' }
    }

    class Incr extends Ast {
        /**
         * @returns {string}
         */
        toString() { return '+' }
    }

    class Decr extends Ast {
        /**
         * @returns {string}
         */
        toString() { return '-' }
    }

    class Get extends Ast {
        /**
         * @returns {string}
         */
        toString() { return ',' }
    }

    class Put extends Ast {
        /**
         * @returns {string}
         */
        toString() { return '.' }
    }

    class While extends Ast {
        /**
         * @param {Ast[]} children
         */
        constructor(children) {
            super()
            this.children = children
        }

        /**
         * @returns {string}
         */
        toString() { return `[${this.children.map(x => x.toString()).join('')}]` }
    }

    class Undefined extends Ast {
        /**
         * @param {string} value
         */
        constructor(value) {
            super()
            this.value = value
        }

        /**
         * @returns {string}
         */
        toString() { return '' }
    }

    class EOFBehavior {
        static IGNORE = new EOFBehavior(0)
        static VALUE_0 = new EOFBehavior(1)
        static VALUE_255 = new EOFBehavior(2)

        #value

        /**
         * @param {number} value
         */
        constructor(value) {
            this.#value = value
        }

        /**
         * @param {EOFBehavior} other
         * @returns {boolean}
         */
        equals(other) { return other instanceof EOFBehavior && this.#value == other.#value }

        /**
         * @returns {number}
         */
        valueOf() { return this.#value }
    }

    /**
     * @param {string} code
     * @returns {Ast}
     */
    function parse(code) {
        let loop = 0
        for (const x of code) {
            loop += { '[': 1, ']': -1 }[x] ?? 0
        }
        if (loop == 0) {
            return new Root(parseCode(code))
        }
        throw new Error('invalid code')
    }

    /**
     * @param {string} code
     * @returns {Ast[]}
     */
    function parseCode(code) {
        return parseCodeIter(code[Symbol.iterator]())
    }

    /**
     * @param {Iterable<string>} iter
     * @returns {Ast[]}
     */
    function parseCodeIter(iter) {
        const ast = []
        while (true) {
            const { done, value } = iter.next()
            if (done || value == ']') {
                break
            }
            switch (value) {
                case '>': ast.push(new Next()); break
                case '<': ast.push(new Prev()); break
                case '+': ast.push(new Incr()); break
                case '-': ast.push(new Decr()); break
                case ',': ast.push(new Get()); break
                case '.': ast.push(new Put()); break
                case '[': ast.push(new While(parseCodeIter(iter))); break
                default: ast.push(new Undefined(value))
            }
        }
        return ast
    }

    class Interpreter {
        #input
        #output
        #eof

        /**
         * @param {Object} options
         * @param {EOFBehavior} options.eof
         */
        constructor({ eof } = {}) {
            this._index = 0
            this._memory = [0]
            this.#input = []
            this.#output = []
            this.#eof = eof ?? EOFBehavior.VALUE_0
            this._ast = new Root([])
        }

        /**
         * @param {Iterable<T>} values
         * @returns {Interpreter}
         */
        input(values) {
            if (values instanceof Uint8Array) {
                this.#input.push(...values)
            } else if (Array.isArray(values)) {
                this.#input.push(values.map(x => +x & 0xff))
            } else if (typeof values == 'string') {
                const encoder = new TextEncoder()
                this.#input.push(...encoder.encode(values))
            } else {
                throw new Error(`invalid input: ${values}`)
            }
            return this
        }

        /**
         * @param {string} code
         * @returns {Interpreter}
         */
        load(code) {
            this._ast = parse(code)
            return this
        }

        /**
         * @param {Ast[]} asts
         * @returns {Ast?}
         */
        *next(asts) {
            for (const ast of (asts ?? [this._ast])) {
                if (ast instanceof Root) {
                    for (const x of this.next(ast.children)) {
                        yield x
                    }
                } else if (ast instanceof While) {
                    while (this._memory[this._index]) {
                        for (const x of this.next(ast.children)) {
                            yield x
                        }
                    }
                } else {
                    yield ast
                }
            }
        }

        /**
         * @returns {string}
         */
        output() {
            const decoder = new TextDecoder()
            return decoder.decode(new Uint8Array(this.#output))
        }

        /**
         * @param {string} code
         * @returns {Interpreter}
         */
        run(code) {
            this.load(code)
            for (const ast of this.next()) {
                this.step(ast)
            }
            return this
        }

        /**
         * @param {Ast} ast
         * @returns {void}
         */
        step(ast) {
            if (ast instanceof Next) {
                this._memory[++this._index] ??= 0
            } else if (ast instanceof Prev) {
                if (--this._index < 0) {
                    throw new Error(`memory error: ${this._index}`)
                }
            } else if (ast instanceof Incr) {
                this._memory[this._index] = (this._memory[this._index] + 1) & 0xff
            } else if (ast instanceof Decr) {
                this._memory[this._index] = (this._memory[this._index] - 1) & 0xff
            } else if (ast instanceof Get) {
                let value = this.#input.shift()
                if (value == null) {
                    if (this.#eof.equals(EOFBehavior.VALUE_0)) {
                        value = 0
                    } else if (this.#eof.equals(EOFBehavior.VALUE_255)) {
                        value = 255
                    } else {
                        value = this._memory[this._index]
                    }
                }
                this._memory[this._index] = value & 0xff
            } else if (ast instanceof Put) {
                this.#output.push(this._memory[this._index])
            }
        }
    }

    Object.assign(root, {
        Brainfuck: {
            Ast, Root, Next, Prev, Incr, Decr, Get, Put, While, Undefined,
            EOFBehavior,
            Interpreter,
            parse,
        }
    })

    root.dispatchEvent(new Event('BrainfuckLoaded'))
})(window)
