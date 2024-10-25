export default class Utils {
    private static getValidNumberOrNull(num: string): number | null {
        const validNumber = /^[+-]?\d+(\.\d+)?$/;
        return validNumber.test(num) ? parseFloat(num) : null;
    }

    private static getValidStringOrNull(str: string): string | null {
        const validString = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
        return validString.test(str) ? str : null;
    }

    private static getValidBooleanOrNull(bool: string): boolean | null {
        const isTrue = bool === 'true'
        const isFalse = bool === 'false'
        const isValid = isTrue || isFalse

        return isValid ? (isTrue ? true : false) : null;
    }

    // a setting data, string
    static getStringAsDataOrNull(str: string, expectType: string) {
        switch (expectType) {
            case 'number':
                return this.getValidNumberOrNull(str);
            case 'string':
                return this.getValidStringOrNull(str);
            case 'boolean':
                return this.getValidBooleanOrNull(str);
            default:
                return null;
        }
    }

    // a setting data loaded data.json/frontmatter, could be anything, so check type first.
    static getRawAsDataOrNone(raw: unknown, expectType: string) {
        switch (typeof raw) {
            case 'string':
                return this.getStringAsDataOrNull(raw, expectType);
            case 'number':
                if (expectType === 'number' && Number.isFinite(raw)) {
                    return raw;
                }
                return null
            case 'boolean':
                if (expectType === 'boolean') {
                    return raw;
                }
                return null
            case 'undefined':
                return undefined
            default:
                return null
        }
    }

}