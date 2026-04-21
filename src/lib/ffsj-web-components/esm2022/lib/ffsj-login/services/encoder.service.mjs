import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import * as i0 from "@angular/core";
export class EncoderService {
    constructor() {
        this.key = 'eFfFsJ2023*';
        this.iv = CryptoJS.enc.Utf8.parse('1234567890123456');
        this.key = 'eFfFsJ2023*';
        this.iv = CryptoJS.enc.Utf8.parse('1234567890123456');
    }
    encryptPassword(data) {
        return CryptoJS.SHA256(data).toString();
    }
    checkPassword(password, encrypted) {
        return this.encryptPassword(password) === encrypted;
    }
    encrypt(password) {
        const encryptedValue = CryptoJS.AES.encrypt(password, this.key, { iv: this.iv });
        return encryptedValue.toString();
    }
    decrypt(passwordToDecrypt) {
        const decrypted = CryptoJS.AES.decrypt(passwordToDecrypt, this.key, { iv: this.iv });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }
    static { this.Éµfac = i0.ÉµÉµngDeclareFactory({ minVersion: "12.0.0", version: "17.3.11", ngImport: i0, type: EncoderService, deps: [], target: i0.ÉµÉµFactoryTarget.Injectable }); }
    static { this.Éµprov = i0.ÉµÉµngDeclareInjectable({ minVersion: "12.0.0", version: "17.3.11", ngImport: i0, type: EncoderService, providedIn: 'root' }); }
}
i0.ÉµÉµngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.11", ngImport: i0, type: EncoderService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [] });
