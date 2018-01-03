import { NgModule, Injectable } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

import { PipeTransform, Pipe } from '@angular/core';

@Pipe({ name: 'keys', pure: false })
export class KeysPipe implements PipeTransform {
    transform(input: Map<string, string[]>, args: string[]): any {
        let res = [];
        input.forEach( (value: string[], key: string) => {
            res.push({ key: key, values: input.get(key)});
        });
        console.log(res);
        return res;
    }
}

@NgModule({
    imports: [BrowserModule],
    declarations: [AppComponent, KeysPipe],
    bootstrap: [AppComponent]
})
export class AppModule { }
