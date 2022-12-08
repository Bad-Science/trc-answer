import $$ from "./$$";

class PhoneNumber {
    public readonly base: number;
    constructor (base: number|string) {
        this.base = $$.toI(base);
    }

    public get value(): string {
        return `${this.base}`;
    }
}

class ExtendedPhoneNumber extends PhoneNumber {
    public readonly extension: number;
    constructor (base: number|string, extension: number|string) {
        super(base);
        this.extension = $$.toI(extension);
    }

    public get value(): string {
        return `${this.base}#${this.extension}`;
    }
}

export class Rolodex {
    public static normalize(rawNumber: string): string {
        return rawNumber.trim().replace('-', '');
    }

    private static readonly numberMap: Map<ExtendedPhoneNumber, PhoneNumber>;

    public static resolve(ExtendedPhoneNumber)
};