/**
 * @file bf-ast.test.js
 * @copyright 2026 PlasticHeart
 */

document.addEventListener('DOMContentLoaded', () => {
    test('null', () => {
        const result = new Brainfuck.Interpreter()
            .run('')
            .output()
        assertEq(result, '')
    })

    test('echo', () => {
        const result = new Brainfuck.Interpreter()
            .input('Hello, world!')
            .run(',[.,]')
            .output()
        assertEq(result, 'Hello, world!')
    })

    test('Hello, World!', () => {
        const code = '--------[>+>+++++>-->-->--->++++>------<<<<<<<-------]>.>---.>----..>-.>++++.>.>+++++++.<<<.+++.<.<-.>>>>+.'
        const result = new Brainfuck.Interpreter()
            .run(code)
            .output()
        assertEq(result, 'Hello, World!')
    })

    test('square', () => {
        const code = `++++[>+++++<-]>[<+++++>-]+<+[
            >[>+>+<<-]++>>[<<+>>-]>>>[-]++>[-]+
            >>>+[[-]++++++>>>]<<<[[<++++++++<++>>-]+<.<[>----<-]<]
            <<[>>>>>[>>>[-]+++++++++<[>-<-]+++++++++>[-[<->-]+[<<<]]<[>+<-]>]<<-]<<-
        ]`
        const result = new Brainfuck.Interpreter()
            .run(code)
            .output()
        assertEq(result, Array.from({ length: 101 }, (_, i) => i * i).join('\n') + '\n')
    })
})
