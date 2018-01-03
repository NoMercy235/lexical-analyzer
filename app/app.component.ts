/// <reference path="../typings/index.d.ts" />

import {Component, ChangeDetectionStrategy} from '@angular/core';

import { AFD, configuredAFD } from './lexical-analyzer/lib/afd';
import { Scanner } from './lexical-analyzer/lib/classes';
import { Token } from './lexical-analyzer/lib/classes';
import { FinalTypes } from './lexical-analyzer/lib/enums';

@Component({
    selector: 'my-app',
    templateUrl: './app.component.html'
})

export class AppComponent {
    afd: AFD;
    scanner: Scanner;
    tokens: Token[];
    excluded: string[] = ['comment', 'space'];

    constructor () {
        this.afd = configuredAFD();
        this.scanner = undefined;
        this.tokens = [];
    }

    changeListener($event) : void {
        var file: File = $event.target.files[0]; 
        var reader: FileReader = new FileReader();
        var self = this;
        reader.onloadend = function(e) {
            self.tokens = [];
            self.scanner = new Scanner(self.afd, reader.result);
            // self.scanner = new Scanner(self.afd, "//abc\n abc  //error");
        };

        reader.readAsText(file);
    }

    // getTokenType(type: string): string {
    //     return type.toLowerCase().replace(/[0-9]/g, '');
    // }

    getTokenValue(token: Token): string {
        return (this.scanner.valueMapper.get(token.type))[token.value];
    }

    private updateTokens(token: Token, excluded?: string[]): void {
        if (!token.hidden)
            this.tokens.push(token);
    }

    getToken(): void {
        let token: Token;
        do {
            token = this.scanner.getToken(this.excluded);
        } while (!token && !this.scanner.blocked);
        if (!token) return;
        this.updateTokens(token, this.excluded);
    }

    all(): void {
        let token: Token;
        do  {
            token = this.scanner.getToken(this.excluded);
            if (token){
                this.updateTokens(token, this.excluded);
            }
        } while(!this.scanner.blocked);
    }
}
