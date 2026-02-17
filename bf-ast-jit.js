/**
 * @file bf-ast-jit.js
 * @copyright 2026 PlasticHeart
 */

!(root => {
    const { Ast, Root, Next, Prev, Incr, Decr, Get, Put, While, Undefined, EOFBehavior, parse } = root.Brainfuck

    class JitAst extends Ast {
        /**
         * @param {Ast} other
         * @returns {[Ast]}
         */
        optimize(other) { return [this, other] }
    }

    class Move extends JitAst {
        /**
         * @param {number} value
         */
        constructor(value) {
            super()
            this.value = value
        }

        /**
         * @param {Ast} other
         * @returns {JitAst}
         */
        optimize(other) {
            if (other instanceof Next) {
                return [new Move(this.value + 1)]
            } else if (other instanceof Prev) {
                return [new Move(this.value - 1)]
            } else if (other instanceof Move) {
                return [new Move(this.value + other.value)]
            }
            return super.optimize(other)
        }
    }

    class Add extends JitAst {
        /**
         * @param {number} value
         */
        constructor(value) {
            super()
            this.value = value
        }

        /**
         * @param {Ast} other
         * @returns {JitAst}
         */
        optimize(other) {
            if (other instanceof Incr) {
                return [new Add(this.value + 1)]
            } else if (other instanceof Decr) {
                return [new Add(this.value - 1)]
            } else if (other instanceof Add) {
                return [new Add(this.value + other.value)]
            }
            return super.optimize(other)
        }
    }

    class Load extends JitAst {
        /**
         * @param {number} value
         */
        constructor(value) {
            super()
            this.value = value
        }

        /**
         * @param {Ast} other
         * @returns {JitAst}
         */
        optimize(other) {
            if (other instanceof Incr) {
                return [new Load(this.value + 1)]
            } else if (other instanceof Decr) {
                return [new Load(this.value - 1)]
            } else if (other instanceof Add) {
                return [new Load(this.value + other.value)]
            } else if (other instanceof Load) {
                return [other]
            }
            return super.optimize(other)
        }
    }

    /**
     * @param {Ast} ast
     * @returns {Ast}
     */
    function optimize(ast) {
        let result = ast
        result = stripUndefined(result)
        result = replaceToJitAst(result)
        result = aggregateJitAst(result)
        result = optimizeLoad0(result)
        result = aggregateJitAst(result)
        return result
    }

    /**
     * @param {Ast} ast
     * @returns {Ast}
     */
    function aggregateJitAst(ast) {
        if (ast instanceof Root) {
            return new Root(aggregateJitAstArray(ast.children))
        } else if (ast instanceof While) {
            return new While(aggregateJitAstArray(ast.children))
        }
        return ast
    }

    /**
     * @param {[Ast]} asts
     * @returns {[Ast]}
     */
    function aggregateJitAstArray(asts) {
        const output = []
        const input = asts.map(x => aggregateJitAst(x))
        while (input.length > 0) {
            const [lhs, rhs] = [output.pop(), input.shift()]
            output.push(...aggregateJitAstPredicate(lhs, rhs))
        }
        return output
    }

    /**
     * @param {Ast} lhs
     * @param {Ast} rhs
     * @returns {[Ast]}
     */
    function aggregateJitAstPredicate(lhs, rhs) {
        if (lhs && rhs) {
            if (typeof lhs.optimize == 'function') {
                return lhs.optimize(rhs)
            }
            return [lhs, rhs]
        } else if (rhs) {
            return [rhs]
        }
        return []
    }

    /**
     * @param {Ast} ast
     * @returns {Ast}
     */
    function optimizeLoad0(ast) {
        if (ast instanceof Root) {
            return new Root(ast.children.map(x => optimizeLoad0(x)))
        } else if (ast instanceof While) {
            if (ast.children.length == 1) {
                const child = ast.children[0]
                if (child instanceof Add && Math.abs(child.value) == 1) {
                    return new Load(0)
                }
            }
            return new While(ast.children.map(x => optimizeLoad0(x)))
        }
        return ast
    }

    /**
     * @param {Ast} ast
     * @returns {Ast}
     */
    function replaceToJitAst(ast) {
        if (ast instanceof Root) {
            return new Root(ast.children.map(x => replaceToJitAst(x)))
        } else if (ast instanceof Next) {
            return new Move(1)
        } else if (ast instanceof Prev) {
            return new Move(-1)
        } else if (ast instanceof Incr) {
            return new Add(1)
        } else if (ast instanceof Decr) {
            return new Add(-1)
        } else if (ast instanceof While) {
            return new While(ast.children.map(x => replaceToJitAst(x)))
        }
        return ast
    }

    /**
     * @param {Ast} ast
     * @returns {Ast}
     */
    function stripUndefined(ast) {
        if (ast instanceof Root) {
            return new Root(ast.children.filter(x => !(x instanceof Undefined)).map(x => stripUndefined(x)))
        } else if (ast instanceof While) {
            return new While(ast.children.filter(x => !(x instanceof Undefined)).map(x => stripUndefined(x)))
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
            } else if (ast instanceof Move) {
                if ((index += ast.value) < 0) {
                    throw new Error('memory error')
                }
                memory[index] ??= 0
            } else if (ast instanceof Add) {
                memory[index] = (memory[index] + ast.value) & 0xff
            } else if (ast instanceof Load) {
                memory[index] = ast.value
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

        const ast = parse(code)
        const optimized = optimize(ast)
        _execute(optimized)
    }

    Object.assign(root.Brainfuck, { execute })

    root.dispatchEvent(new Event('BrainfuckJitLoaded'))
})(window)
