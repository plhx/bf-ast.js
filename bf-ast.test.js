/**
 * @file bf-ast.test.js
 * @copyright 2026 PlasticHeart
 */

window.addEventListener('BrainfuckJitLoaded', () => {
    /**
     * @param {T} a
     * @param {T} b
     * @returns {boolean}
     */
    function equals(a, b) {
        if (a === b) {
            return true
        } else if (typeof a == 'number' && typeof b == 'number') {
            return Number.isNaN(a) && Number.isNaN(b) || a == b
        } else if (typeof a == 'bigint' && typeof b == 'bigint') {
            return a == b
        } else if (typeof a == 'string' && typeof b == 'string') {
            return a == b
        } else if (typeof a == 'symbol' && typeof b == 'symbol') {
            return a == b
        } else if (a instanceof Date && b instanceof Date) {
            return equals(a.valueOf(), b.valueOf())
        } else if (typeof a?.equals == 'function') {
            return a.equals(b)
        } else if (typeof a?.compare == 'function') {
            return a.compare(b) == 0
        }
        return false
    }

    /**
     * @param {string} testName
     * @param {function()} action
     */
    function test(testName, action) {
        try {
            action()
            console.debug(`[UnitTest] ${testName}: OK`)
        } catch (e) {
            console.warn(`[UnitTest] ${testName}: ${e}`)
            throw e
        }
    }

    /**
     * @param {T} a
     * @param {T} b
     */
    function assertEq(a, b) {
        const result = equals(a, b)
        if (!result) {
            console.assert(result, `assertion failed: ${a} != ${b}`)
            throw new Error(`assertion failed: ${a} != ${b}`)
        }
    }

    test('null', () => {
        const code = ''
        const output = []
        Brainfuck.execute(code, { output })
        assertEq('', output.join(''))
    })

    test('echo', () => {
        const code = ',[.,]'
        const input = 'Hello, world!'
        const output = []
        Brainfuck.execute(code, { input: [...input], output })
        assertEq(input, output.join(''))
    })

    test('Hello, World!', () => {
        const code = '--------[>+>+++++>-->-->--->++++>------<<<<<<<-------]>.>---.>----..>-.>++++.>.>+++++++.<<<.+++.<.<-.>>>>+.'
        const output = []
        Brainfuck.execute(code, { output })
        assertEq('Hello, World!', output.join(''))
    })

    test('square', () => {
        const code = `++++[>+++++<-]>[<+++++>-]+<+[
            >[>+>+<<-]++>>[<<+>>-]>>>[-]++>[-]+
            >>>+[[-]++++++>>>]<<<[[<++++++++<++>>-]+<.<[>----<-]<]
            <<[>>>>>[>>>[-]+++++++++<[>-<-]+++++++++>[-[<->-]+[<<<]]<[>+<-]>]<<-]<<-
        ]`
        const output = []
        Brainfuck.execute(code, { output })
        assertEq(Array.from({ length: 101 }, (_, i) => i * i).join('\n') + '\n', output.join(''))
    })
})
