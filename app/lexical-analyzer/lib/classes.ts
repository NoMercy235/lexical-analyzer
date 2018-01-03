import { AFD } from './afd';
import { ITokenResponse } from './interfaces';
import { FinalTypes } from './enums';
import { Utils } from './utilityFunctions';

export class Token {
    public value: number;
    public type: string;
    public codePos: number;

    public hidden: boolean;

    setValue(value: number, state: number) {
        this.value = value;
        // this.codePos = codePos;
        for (let type in FinalTypes) {
            if (FinalTypes[type] === state) {
                this.type = type.toLowerCase().replace(/[0-9]/g, "");
            }
        }
    }
}

export class Scanner {
    private codePos: number;
    private text: string;
    private afd: AFD;

    public blocked: boolean;
    public valueMapper: Map<string, string[]>;


    constructor (afd: AFD, text: string) {
        this.text = text;
        this.afd = afd;
        this.codePos = 0;
        this.blocked = false;
        this.valueMapper = new Map<string, string[]>();
    }

    private updateMapper(response: ITokenResponse, excluded?: string[]): number {
        let type = Utils.getTypeFromState(response.state).replace(/[0-9]/g, "");
        if (excluded && excluded.indexOf(type) !== -1) {
            return undefined;
        }

        if (!this.valueMapper.has(type)) {
            this.valueMapper.set(type, []);
        }

        let pos = this.valueMapper.get(type).indexOf(JSON.stringify(response.text));
        if (pos !== -1) {
            return pos;
        } else {
            this.valueMapper.get(type).push(JSON.stringify(response.text));
            pos = this.valueMapper.get(type).length - 1;
            return pos;
        }
    }

    getToken(excluded?: string[]): Token {
        if (this.blocked || this.codePos === this.text.length - 1) {
            this.blocked = true;
            return undefined;
        }

        let response: ITokenResponse;
        response = this.afd.discover(this.text, this.codePos);

        if (response.state === -1) {
            let token: Token = new Token();
            token.setValue(this.updateMapper(response, excluded), response.state)
            token.codePos = this.codePos + 1;

            this.blocked = true;
            return token;
        }
        this.codePos = response.pos ? response.pos : this.codePos + 1;

        let token: Token = new Token();
        token.codePos = this.codePos;
        token.setValue(this.updateMapper(response, excluded), response.state);

        if (excluded && excluded.indexOf(token.type) !== -1) {
            return null;
        }
        
        return token;
    }
}