import { map } from 'rxjs/operator/map';
import { BitOperations } from './utilityFunctions';
import { FinalTypes } from './enums';
import { Utils } from './utilityFunctions';
import { ITokenResponse } from './interfaces';

export class AFD {
    private stateNr: number;
    // private final: number;
    private final: number[];
    private transitions: number[][];

    constructor () {
        this.stateNr = 0;
    }

    getStateNr (): number {
        return this.stateNr;
    }

    setStateNr (stateNr: number): boolean {
        if (stateNr < 0) {
            return false;
        }
        this.stateNr = stateNr;
        this.final = [];

        this.transitions = [];
        for (let i = 0; i < stateNr; i++) {
            this.transitions.push([]);
            this.transitions[i] = [];
            for (let j = 0; j < 256; j ++) {
                this.transitions[i].push(-1);
            }
        }
    }

    isFinal (state: number): boolean {
        return (this.final.indexOf(state) !== -1);
        // return BitOperations.getBit(this.final, state);
    }

    setFinal (state: number): boolean {
        if (state < 0 || state >= this.stateNr) {
            return false;
        }
        this.final.push(state);
        // this.final = BitOperations.setBit(this.final, state);
        return true;
    }

    getTransition (state: number, asciiChar: number | string): number {
        return this.transitions[state][this.parseValue(asciiChar)];
    }

    private parseValue(val: number | string): number {
        if (typeof(val) === 'string') {
            if ((<any>val).length !== 1) {
                return -1;
            }
            return (<any>val).charCodeAt(0);
        } else {
            return (<any>val);
        }
    }

    setCollectionTransition (fromState: number, collection: (number | string)[], toState: number): void {
        collection.map( item => this.setTransition(fromState, item, toState));
    }

    setTransition (fromState: number, asciiChar: number | string, toState: number): boolean {
        if (fromState < 0 || fromState >= this.stateNr || toState < -1 || toState >= this.stateNr) {
            return false;
        }
        if ((asciiChar = this.parseValue(asciiChar)) === -1) {
            return false;
        }
        this.transitions[fromState][asciiChar] = toState;
        return true;
    }

    private showToken(value: string, state: number, excluded?: number[]): void {
        for (let type in FinalTypes) {
            if (FinalTypes[type] === state && (excluded ? excluded.indexOf(state) !== -1 : true)) {
                console.log(JSON.stringify(`Token: ${type.toLowerCase()} - ${value}`));
            }
        }
    }

    discover (text: string, pos: number): ITokenResponse {
        let state: number = 0, tmpState: number = 0, lastIndex: number = 0;
        let buffer: string = '', tmpBuffer: string = '';

        for (let i: number = pos; i < text.length || tmpState !== 0; i++ ) {
            if (state === -1 && tmpState === 0) {
                return { text: buffer, pos: pos, state: -1 };
            } else
            if (state === -1 && tmpState !== 0) {
                return { text: tmpBuffer, pos: lastIndex + 1, state: tmpState };
            }
            if (i >= text.length - 1) break;
            
            state = this.transitions[state][text[i].charCodeAt(0)];
            buffer += text[i];

            if (this.isFinal(state)) {
                tmpState = state;
                tmpBuffer = buffer;
                lastIndex = i;
            }
        }
        if (this.isFinal(state)) {
            return { text: tmpBuffer, pos: undefined, state: tmpState };
        } else {
            return { text: buffer, pos: undefined, state: buffer.length === 0 ? 0 : -1 };
        }
    }

}

export let configuredAFD = function (): AFD {
    let afd = new AFD();

    afd.setStateNr(128);

    function finalTypes(afd: AFD) {
        for (let type in FinalTypes) {
            if (!afd.setFinal(FinalTypes[type])) {
                console.error('Invalid final state');
            }
        }
    }
    finalTypes(afd);

    // WHITESPACE
    afd.setCollectionTransition(0, [' ', '\n', '\r', '\t'], FinalTypes.SPACE);
    afd.setCollectionTransition(FinalTypes.SPACE, [' ', '\n', '\r', '\t'], FinalTypes.SPACE);
    // WHITESPACE

    // SEPARATORS
    afd.setCollectionTransition(0, Utils.getSeparators(['.']), FinalTypes.SEPARATOR);
    afd.setTransition(0, '.', FinalTypes.SEPARATOR1);
    // SEPARATORS

    // COMMENTS
    afd.setTransition(0, '/', FinalTypes.OPERATOR);

    // WITH //
    afd.setTransition(FinalTypes.OPERATOR, '/', 51);

    afd.setCollectionTransition(51, [' ', '\r', '\t'], 51);
    afd.setCollectionTransition(51, Utils.getAll(), 51);

    afd.setTransition(51, '\n', FinalTypes.COMMENT);
    // COMMENT WITH //

    // COMMENT WITH /* ..... */
    afd.setTransition(FinalTypes.OPERATOR, '*', 52);

    afd.setCollectionTransition(52, [' ', '\r', '\t', '\n'], 52);
    afd.setCollectionTransition(52, Utils.getAll(['*']), 52);

    afd.setTransition(52, '*', 53);
    afd.setTransition(53, '*', 53);
    afd.setCollectionTransition(53, [' ', '\r', '\t', '\n'], 52);
    afd.setCollectionTransition(53, Utils.getAll(['/', '*']), 52);
    afd.setTransition(53, '/', FinalTypes.COMMENT);
    // COMMENT WITH /* ..... */
    // COMMENT

    // IDENTIFIER
    afd.setCollectionTransition(0, Utils.getAlphabet(), FinalTypes.IDENTIFIER);
    afd.setTransition(0, '_', FinalTypes.IDENTIFIER);

    afd.setTransition(FinalTypes.IDENTIFIER, '_', FinalTypes.IDENTIFIER);
    afd.setCollectionTransition(FinalTypes.IDENTIFIER, Utils.getAlphabet(), FinalTypes.IDENTIFIER);
    afd.setCollectionTransition(FinalTypes.IDENTIFIER, Utils.getDigits(), FinalTypes.IDENTIFIER);
    // IDENTIFIER


    // . -> 0-9 -> Float1
    afd.setCollectionTransition(FinalTypes.SEPARATOR1, Utils.getDigits(), FinalTypes.FLOAT1);

    afd.setTransition(0, '0', FinalTypes.DECIMAL1);
    afd.setCollectionTransition(0, Utils.getDigits(['0']), FinalTypes.DECIMAL);

    // NUMBER
    afd.setCollectionTransition(FinalTypes.DECIMAL, Utils.getDigits(), FinalTypes.DECIMAL);

    afd.setTransition(FinalTypes.DECIMAL1, 'x', 55);
    afd.setCollectionTransition(55, Utils.getDigits(), FinalTypes.HEXADECIMAL);
    afd.setCollectionTransition(55, ['a', 'b', 'c', 'd', 'e', 'f', 'A', 'B', 'C', 'D', 'E', 'F'], FinalTypes.HEXADECIMAL);
    afd.setCollectionTransition(FinalTypes.HEXADECIMAL, Utils.getDigits(), FinalTypes.HEXADECIMAL);
    afd.setCollectionTransition(
        FinalTypes.HEXADECIMAL,
        ['a', 'b', 'c', 'd', 'e', 'f', 'A', 'B', 'C', 'D', 'E', 'F'],
        FinalTypes.HEXADECIMAL
    );

    afd.setTransition(54, '0', FinalTypes.OCTAL);
    afd.setCollectionTransition(FinalTypes.OCTAL, Utils.getDigits(['8', '9']), FinalTypes.OCTAL);
    // NUMBER

    // FLOAT
    afd.setTransition(54, '.', 57);
    afd.setTransition(54, 'e,', 58);
    afd.setTransition(FinalTypes.DECIMAL, '.', 57);
    afd.setTransition(FinalTypes.DECIMAL, 'e', 58);
    afd.setCollectionTransition(58, ['-', '+'], 59);
    afd.setCollectionTransition(57, Utils.getDigits(), FinalTypes.FLOAT1);
    afd.setTransition(FinalTypes.FLOAT1, 'e', 58);
    afd.setCollectionTransition(FinalTypes.FLOAT1, Utils.getDigits(), FinalTypes.FLOAT1);

    afd.setCollectionTransition(58, Utils.getDigits(), FinalTypes.FLOAT2);
    afd.setTransition(FinalTypes.FLOAT2, '-', 57);
    afd.setCollectionTransition(FinalTypes.FLOAT2, Utils.getDigits(), FinalTypes.FLOAT2);

    afd.setCollectionTransition(59, Utils.getDigits(), FinalTypes.FLOAT);
    afd.setCollectionTransition(FinalTypes.FLOAT, Utils.getDigits(), FinalTypes.FLOAT);
    // FLOAT


    // CHAR
    afd.setTransition(0, '\'', 60);

    afd.setCollectionTransition(60, Utils.getAll(['\'' , '\\']), 61);
    afd.setCollectionTransition(60, Utils.getBackslash(), 61);
    afd.setTransition(60, '\\', 62);
    afd.setCollectionTransition(62, Utils.getAll(['\'' , '\\']), 61);
    afd.setCollectionTransition(62, Utils.getBackslash(), 61);

    afd.setTransition(61, '\'', FinalTypes.CHAR);
    // CHAR

    // STRING
    afd.setTransition(0, '"', 63);

    afd.setTransition(63, ' ', 63);
    afd.setCollectionTransition(63, Utils.getAll(['"', '\\']), 63);
    afd.setCollectionTransition(63, Utils.getBackslash(), 63);
    afd.setTransition(63, '\\', 64);
    afd.setCollectionTransition(64, Utils.getAll(), 63);
    afd.setCollectionTransition(64, Utils.getBackslash(), 63);

    afd.setTransition(63, '"', FinalTypes.STRING);
    // STRING

    // OPERATOR
    // / has problems
    // afd.setCollectionTransition(0, [
    //         '+', '-', '/', '*', '%', '&', '|', '>', '<', '='
    //     ],
    //     FinalTypes.OPERATOR1
    // );
    // afd.setCollectionTransition(0, ['&'], FinalTypes.OPERATOR1)

    afd.setTransition(0, '+', FinalTypes.OPERATOR2);
    afd.setCollectionTransition(FinalTypes.OPERATOR2, ['+', '='], FinalTypes.OPERATOR1);

    afd.setTransition(0, '-', FinalTypes.OPERATOR3);
    afd.setCollectionTransition(FinalTypes.OPERATOR3, ['-', '='], FinalTypes.OPERATOR1);

    // afd.setTransition(0, '/', FinalTypes.OPERATOR);
    afd.setTransition(FinalTypes.OPERATOR, '=', FinalTypes.OPERATOR1);

    afd.setTransition(0, '*', FinalTypes.OPERATOR5);
    afd.setTransition(FinalTypes.OPERATOR5, '=', FinalTypes.OPERATOR1);

    afd.setTransition(0, '%', FinalTypes.OPERATOR6);
    afd.setTransition(FinalTypes.OPERATOR6, '=', FinalTypes.OPERATOR1);

    afd.setTransition(0, '&', FinalTypes.OPERATOR7);
    afd.setTransition(FinalTypes.OPERATOR7, '&', FinalTypes.OPERATOR8);

    afd.setTransition(0, '|', FinalTypes.OPERATOR9);
    afd.setTransition(FinalTypes.OPERATOR9, '|', FinalTypes.OPERATOR10);

    afd.setTransition(0, '>', FinalTypes.OPERATOR11);
    afd.setTransition(FinalTypes.OPERATOR11, '>', FinalTypes.OPERATOR12);
    afd.setTransition(FinalTypes.OPERATOR11, '=', FinalTypes.OPERATOR1);
    afd.setTransition(FinalTypes.OPERATOR12, '=', FinalTypes.OPERATOR1);
    afd.setTransition(0, '<', FinalTypes.OPERATOR13);
    afd.setTransition(FinalTypes.OPERATOR13, '<', FinalTypes.OPERATOR14);
    afd.setTransition(FinalTypes.OPERATOR13, '=', FinalTypes.OPERATOR1);
    afd.setTransition(FinalTypes.OPERATOR14, '=', FinalTypes.OPERATOR1);

    afd.setTransition(0, '=', FinalTypes.OPERATOR15);
    afd.setTransition(FinalTypes.OPERATOR15, '=', FinalTypes.OPERATOR1);
    // OPERATOR

    return afd;
};