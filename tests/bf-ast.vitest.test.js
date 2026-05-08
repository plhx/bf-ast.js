/**
 * @file bf-ast.vitest.test.js
 * @copyright 2026 PlasticHeart
 */

import { describe, test, expect } from 'vitest'
import { Interpreter } from '../src/bf-ast.js'
import { JitInterpreter } from '../src/bf-ast-jit.js'

function runTests(InterpreterClass) {
    test('null', () => {
        const result = new InterpreterClass()
            .run('')
            .output()
        expect(result).toBe('')
    })

    test('echo', () => {
        const result = new InterpreterClass()
            .input('Hello, world!')
            .run(',[.,]')
            .output()
        expect(result).toBe('Hello, world!')
    })

    test('Hello, World!', () => {
        const code = '--------[>+>+++++>-->-->--->++++>------<<<<<<<-------]>.>---.>----..>-.>++++.>.>+++++++.<<<.+++.<.<-.>>>>+.'
        const result = new InterpreterClass()
            .run(code)
            .output()
        expect(result).toBe('Hello, World!')
    })

    test('square', () => {
        const code = `++++[>+++++<-]>[<+++++>-]+<+[
            >[>+>+<<-]++>>[<<+>>-]>>>[-]++>[-]+
            >>>+[[-]++++++>>>]<<<[[<++++++++<++>>-]+<.<[>----<-]<]
            <<[>>>>>[>>>[-]+++++++++<[>-<-]+++++++++>[-[<->-]+[<<<]]<[>+<-]>]<<-]<<-
        ]`
        const result = new InterpreterClass()
            .run(code)
            .output()
        expect(result).toBe(Array.from({ length: 101 }, (_, i) => i * i).join('\n') + '\n')
    })
}

describe('Interpreter', () => {
    runTests(Interpreter)
})

describe('JitInterpreter', () => {
    runTests(JitInterpreter)
})
