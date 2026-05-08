/**
 * @file bf-ast-jit.js
 * @copyright 2026 PlasticHeart
 */

!(root => {
    const { Ast, Root, Next, Prev, Incr, Decr, While, Undefined, Interpreter, parse } = root.Brainfuck

    class JitAst extends Ast {
        /**
         * @param {Ast} other
         * @returns {Ast[]}
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
         * @returns {Ast[]}
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
         * @returns {Ast[]}
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
         * @returns {Ast[]}
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
     * @param {Ast[]} asts
     * @returns {Ast[]}
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
     * @returns {Ast[]}
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

    class JitInterpreter extends Interpreter {
        /**
         * @param {string} code
         * @returns {Interpreter}
         */
        load(code) {
            this._ast = optimize(parse(code))
            return this
        }

        /**
         * @param {Ast} ast
         * @returns {void}
         */
        step(ast) {
            if (ast instanceof Move) {
                if ((this._index += ast.value) < 0) {
                    throw new Error(`memory error: ${this._index}`)
                }
                this._memory[this._index] ??= 0
            } else if (ast instanceof Add) {
                this._memory[this._index] = (this._memory[this._index] + ast.value) & 0xff
            } else if (ast instanceof Load) {
                this._memory[this._index] = ast.value
            } else {
                super.step(ast)
            }
        }
    }

    Object.assign(root.Brainfuck, { Interpreter: JitInterpreter })

    root.dispatchEvent(new Event('BrainfuckJitLoaded'))
})(window)
