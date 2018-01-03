import { FinalTypes } from './enums';


function setBit(x: number, mask: number) {
    return x | 1 << mask;
}


function getBit(x: number, mask: number) {
    return ((x >> mask) % 2 !== 0);
}

function removedExcluded<T>(array: T[], excluded: T[]): T[] {
    let res: T[] = [];
    if (excluded) {
        array.map( el => {
            if (excluded.indexOf(el) === -1) {
                res.push(el);
            }
        });
    } else {
        res = array;
    }
    return res;
}

function getAlphabet(excluded?: string[]): number[] {
    let vals: number[] = [];
    for (let i = 'a'.charCodeAt(0); i < 'z'.charCodeAt(0); i++) {
            vals.push(i); vals.push(i - 32);
    }
    let excludedAscii: number[] = [];
    if (excluded) excluded.map( el => excludedAscii.push(el.charCodeAt(0)));
    return removedExcluded<number>(vals, excludedAscii);
}

function getSeparators(excluded?: string[]): string[] {
    let vals = [ ';', ':', '{', '}', '(', ')', '[', ']', ',', '.' ];
    return removedExcluded<string>(vals, excluded);
}

function getDigits(excluded?: string[]): string[] {
    let vals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return removedExcluded<string>(vals, excluded);
}

function getSpecialChars(excluded?: string[]): string[] {
    let vals = [
        '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '=', '_', '+', '`', '~',
        '[', ']', '{', '}', ':', ';', '\'', '"', '\\', '|', ',', '<', '.', '>', '/', '?'
    ];
    return removedExcluded<string>(vals, excluded);
}

function getBackslash(excluded?: string[]): string[] {
    let vals = ['\n', '\r', '\t'];
    return removedExcluded<string>(vals, excluded);
}

function getOperators(excluded?: string[]): string[] {
    let vals = ['+', '-', '%', '*', '/', '&', '|', '='];
    return removedExcluded<string>(vals, excluded);
}

function getAll(excluded?: string[]): number[] {
    let res = getAlphabet(excluded);
    let separatos = getSeparators(excluded);
    let digits = getDigits(excluded);
    let specialChars = getSpecialChars(excluded);

    separatos.map( sep => res.push(sep.charCodeAt(0)));
    digits.map( digit => res.push(digit.charCodeAt(0)));
    specialChars.map( specialChar => res.push(specialChar.charCodeAt(0)));

    return res;
}

function readFromFile(url: string): void {
    let rawFile = new XMLHttpRequest();
    rawFile.open('GET', url, false);
    rawFile.onreadystatechange = function handler () {
        if (rawFile.readyState === 4 && (rawFile.status === 200 || rawFile.status === 0)) {
            console.log(rawFile.responseText);
        }
    };
}

function getTypeFromState(state: number): string {
    for (let type in FinalTypes) {
        if (FinalTypes[type] === state) {
            return type.toLowerCase();
        }
    }
    return undefined;
}

export let BitOperations = {
    setBit: setBit,
    getBit: getBit
};

export let Utils = {
    getAlphabet: getAlphabet,
    getSeparators: getSeparators,
    getDigits: getDigits,
    getSpecialChars: getSpecialChars,
    getBackslash: getBackslash,
    getOperators: getOperators,
    getAll: getAll,
    getTypeFromState: getTypeFromState
};

export let File = {
    readFromFile: readFromFile
}