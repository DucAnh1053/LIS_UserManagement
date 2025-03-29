import forOwn from "lodash/forOwn";
import { CallbackWithoutResultAndOptionalError } from "mongoose";
import { SequenceSchema, SequenceModel } from "../models/sequence.model";

/**
 * Replaces substring of given string begin from the provided
 * start index with the "character" to be replaced
 */
const replaceCharAt = (str: string, index: number, character: string) => {
    return (
        str.substring(0, index) +
        character +
        str.substring(index + character.length)
    );
};

/**
 * Returns the next alphanumeric character if given
 * character is not the last one (z, Z, 9), else returns null
 */
const incrementChar = (seqChar: string) => {
    if (seqChar.match(/[zZ9]/)) {
        return null;
    }

    return String.fromCharCode(seqChar.charCodeAt(0) + 1);
};

/**
 * Returns starting character (a, A, 0) if given character is
 * the last one (z, Z, 9)
 */
const resetChar = (charToReset: string) => {
    if (charToReset === "Z") {
        return "A";
    } else if (charToReset === "z") {
        return "a";
    } else {
        return "0";
    }
};

/**
 * Returns boolean after checking if given id has reached last
 * value, like 9999 or zzzz or zz9999
 */
const isLastId = (id: string, prefix: string, suffix: string) => {
    id = deaffixId(id, prefix, suffix);

    return id.match(/[0-8a-yA-Y]+/) === null;
};

/**
 * Removes prefixes and/or suffixes (if any)
 */
const deaffixId = (affixedValue: string, prefix: string, suffix: string) => {
    let idValue = affixedValue;

    if (prefix) {
        idValue = idValue.replace(new RegExp("^" + prefix), "");
    }

    if (suffix) {
        idValue = idValue.replace(new RegExp(suffix + "$"), "");
    }

    return idValue;
};

/**
 * Adds prefixes and/or suffixes (if any)
 */
const affixId = (idValue = "", prefix = "", suffix = "") => {
    let affixedValue = idValue;

    if (prefix) {
        affixedValue = prefix + affixedValue;
    }

    if (suffix) {
        affixedValue = affixedValue + suffix;
    }

    return affixedValue;
};

/**
 * Calculate and returns the next incremented value.
 * Increment should happen only for one character at a time
 */
const nextId = (currentSeqValue = "", prefix = "", suffix = "") => {
    // Removes prefixes and/or suffixes (if any)
    currentSeqValue = deaffixId(currentSeqValue, prefix, suffix);

    let incVal;

    // If it is last available as per given configuration,
    // returns the same after adding prefixes and/or suffixes (if any)
    if (isLastId(currentSeqValue, prefix, suffix)) {
        incVal = affixId(currentSeqValue, prefix, suffix);
        return incVal;
    }

    /**
     * Split the current sequence value, so indvidual characters
     * can be incremented as per given configuration
     */
    let seqChars = currentSeqValue.split("");

    // Iterates through characters and process them
    for (let i = seqChars.length - 1; i >= 0; i--) {
        let seqChar = seqChars[i];

        // Increment only if character is alphabet or number
        if (seqChar.match(/^[0-9a-zA-Z]+$/)) {
            let incrementedChar = incrementChar(seqChar);

            /**
             * If character is incremented, say from "2" to "3" or "B" to "C"
             * then replace the character in given string and return it (after adding
             * prefixes and/or suffixes). Because, we should increment
             * only one character at a time
             *
             * If increment did not happen because it is a last characher (z, Z or 9)
             * then reset the character to starting character (a, A or 0) and
             * continue the iteration
             */
            if (incrementedChar) {
                incVal = affixId(
                    replaceCharAt(currentSeqValue, i, incrementedChar),
                    prefix,
                    suffix
                );
                return incVal;
            } else {
                currentSeqValue = replaceCharAt(
                    currentSeqValue,
                    i,
                    resetChar(seqChar)
                );
            }
        }
    }

    incVal = affixId(currentSeqValue, prefix, suffix);

    return incVal;
};

/**
 * Define the field(s) in SequenceSchema, if already does not exist
 */
const fixPathType = ($options: any) => {
    forOwn($options.fields, (value: any, key: string) => {
        const path = SequenceSchema.path(key);

        !path && SequenceSchema.path(key, String);
    });
};

/**
 * Set the "auto incremental" field's value in given document
 */
const setFieldsValue = async ($doc: any, $options: any) => {
    // Kiểm tra xem trường có giá trị chưa
    let needSequence = false;

    forOwn($options.fields, (value: any, key: string) => {
        // Nếu trường chưa có giá trị, cần tạo sequence
        if (!$doc[key]) {
            needSequence = true;
        }
    });

    // Nếu không cần sequence (tất cả trường đã có giá trị), thoát
    if (!needSequence) return;

    let lastSeq = await SequenceModel.findOne({ seqId: $options.seqId }).exec();

    // Create a new document, if does not exist
    if (lastSeq === null) {
        lastSeq = new SequenceModel({});
    }

    // Phần còn lại giữ nguyên...
    forOwn($options.fields, (value: any, key: string) => {
        const lastSeqValue = lastSeq ? lastSeq.get(key) : null;

        lastSeq &&
            lastSeq.set(
                key,
                !lastSeqValue
                    ? affixId(value.startWith, value.prefix, value.suffix)
                    : nextId(lastSeqValue, value.prefix, value.suffix)
            );
    });

    const alphaNumRes = await SequenceModel.getNextAlphaNumSeq(
        $options.seqId,
        lastSeq
    );

    // Chỉ gán giá trị nếu trường chưa được thiết lập
    forOwn($options.fields, (value: any, key: string) => {
        if (!$doc[key]) {
            $doc[key] = alphaNumRes.get(key);
        }
    });
};

/**
 * Mongoose plugin function definition
 *
 * Here we can define Schema's "pre" hook(s), as we should
 * set "auto incremental" field's value before saving/updating document
 *
 * This plugin accepts 2 arguments:
 *
 * @param $schema - Schema - mongoose Schema reference to which we want to bind this plugin
 * @param $options - Object - This should be JavaScript Object with 2 properties:
 *
 *       - fields {Object}: It's "keys" should be name of the fields (which
 *            has to be "auto incremental") of the given Schema. Value of each
 *            "key" (field name) is the configuration object for that field.
 *            We can define the following options for each field:
 *            - startWith {String}: This property can be used to define "Sequence Id"
 *                 format, length (what should be size of id) and from where the
 *                 sequence should begin. Uppercase characters increment to next
 *                 Uppercase character only and same is with lowercase.
 *                 For example, if startWith is"AAaa001", then it's last value would be "ZZzz999"
 *            - prefix {String} - to be prefixed with "Sequence Id" string after increment
 *            - sufix {String} - to be sufixed with "Sequence Id" string after increment
 *            prefix and sufix will be constants only.
 *       - seqId {String}: Identifier to be used in Sequence Schema to find and increment
 *           existing field's value (if any) and create new one
 */
function sequencePlugin($schema: any, $options: any) {
    $schema.pre("save", async function (this: any, next: any) {
        fixPathType($options);

        const $doc = this;
        await setFieldsValue($doc, $options);

        next();
    });

    $schema.pre(
        "insertMany",
        async function (
            this: any,
            next: CallbackWithoutResultAndOptionalError,
            $docs: any[]
        ) {
            fixPathType($options);

            for (let i = 0; i < $docs.length; i++) {
                await setFieldsValue($docs[i], $options);
            }

            next();
        }
    );
}

export default sequencePlugin;
