import { DataType } from "types/types";

const PROTECTED_KEYS = ["retitled", "empty", "headless"];

export default class Utils {
    static parseNumber(num: string): number | null {
        const validNumber = /^[+-]?\d+(\.\d+)?$/;
        return validNumber.test(num) ? parseFloat(num) : null;
    }

    static parseString(str: string): string | null {
        const validString = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
        const isValid = validString.test(str) && PROTECTED_KEYS.includes(str);
        return isValid ? str : null;
    }

    static parseBoolean(bool: string): boolean | null {
        const isTrue = bool === "true";
        const isFalse = bool === "false";
        const isValid = isTrue || isFalse;

        return isValid ? (isTrue ? true : false) : null;
    }
    static parseStringData<T extends DataType>(str: string, dflt: T) {
        switch (typeof dflt) {
            case "number":
                return Utils.parseNumber(str) as T | null;
            case "string":
                return Utils.parseString(str) as T | null;
            default:
                return Utils.parseBoolean(str) as T | null;
        }
    }
    static parseRawData<T extends DataType>(raw: unknown, dflt: T) {
        switch (typeof raw) {
            case "string":
                return Utils.parseStringData(raw, dflt);
            case "number":
                if (typeof dflt === "number" && Number.isFinite(raw)) {
                    return raw as T;
                } else {
                    return null;
                }
            case "boolean":
                if (typeof dflt === "boolean") {
                    return raw as T;
                } else {
                    return null;
                }
            case "undefined":
                return undefined;
            default:
                return null;
        }
    }
}
