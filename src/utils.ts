export default class Utils {
    static parseNumber(num: string): number | null {
        const validNumber = /^[+-]?\d+(\.\d+)?$/;
        return validNumber.test(num) ? parseFloat(num) : null;
    }

    static parseString(str: string): string | null {
        const validString = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
        const isValid = validString.test(str) && !["retitled", "empty", "headless"].includes(str);
        return isValid ? str : null;
    }

    static parseBoolean(bool: string): boolean | null {
        const isTrue = bool === "true";
        const isFalse = bool === "false";
        const isValid = isTrue || isFalse;

        return isValid ? (isTrue ? true : false) : null;
    }
}
