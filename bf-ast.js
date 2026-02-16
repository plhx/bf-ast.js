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
         * @param {[Ast]} children
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
         * @param {[Ast]} children
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
     * @returns {[Ast]}
     */
    function parseCode(code) {
        return parseCodeIter(code[Symbol.iterator]())
    }

    /**
     * @param {Iterable<string>} iter
     * @returns {[Ast]}
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

    /**
     * @param {string} code
     * @param {Object} options
     * @param {[number]} options.memory
     * @param {[string]} options.input
     * @param {[string]} options.output
     * @param {EOFBehavior} options.eof
     * @returns {void}
     */
    function execute(code, { memory, input, output, eof } = {}) {
        let index = 0
        memory = (memory?.length ?? 0) > 0 ? memory : [0]
        input ??= []
        output ??= []
        eof ??= EOFBehavior.VALUE_0

        function _execute(ast) {
            if (ast instanceof Root) {
                for (const x of ast.children) {
                    _execute(x)
                }
            } else if (ast instanceof Next) {
                memory[++index] ??= 0
            } else if (ast instanceof Prev) {
                if (--index < 0) {
                    throw new Error('memory error')
                }
            } else if (ast instanceof Incr) {
                memory[index] = (memory[index] + 1) & 0xff
            } else if (ast instanceof Decr) {
                memory[index] = (memory[index] - 1) & 0xff
            } else if (ast instanceof Get) {
                let value = input.shift()?.charCodeAt(0)
                if (value == null) {
                    if (eof.equals(EOFBehavior.VALUE_0)) {
                        value = 0
                    } else if (eof.equals(EOFBehavior.VALUE_255)) {
                        value = 255
                    } else {
                        value = memory[index]
                    }
                }
                memory[index] = value & 0xff
            } else if (ast instanceof Put) {
                output.push(String.fromCodePoint(memory[index]))
            } else if (ast instanceof While) {
                while (memory[index]) {
                    for (const x of ast.children) {
                        _execute(x)
                    }
                }
            }
        }

        _execute(parse(code))
    }

    Object.assign(root, {
        Brainfuck: {
            Ast, Root, Next, Prev, Incr, Decr, Get, Put, While, Undefined,
            EOFBehavior,
            parse, execute
        }
    })

    root.dispatchEvent(new Event('BrainfuckLoaded'))
})(window)
