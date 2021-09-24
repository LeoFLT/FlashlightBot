export type parsedArgs = Record<string, (boolean | string | number | (string | number)[])>;

export default function(strArr: string[]): parsedArgs {
    const firstArgRegex = /^(?<_>.+)/i;
    const strArgRegex = /^(?:[-]{1,2})(?<key>\w+?)=(?<delimiter>"|')(?!\k<delimiter>)(?<value>.*?)?(?:\k<delimiter>)/i;
    const regArgRegex = /^(?:[-]{1,2})(?:(?<key>\w+?)=(?!"|')(?<value>\S+\w*?)|(?<bool>\w+))/i;
    let argObj: any = { _: null, size: 0 };

    for (const [index, arg] of strArr.entries()) {
        if (index === 0) {
            argObj._ = arg.match(firstArgRegex)?.groups?._;
            continue;
        }

        let matches = sanitizeMatches(arg.match(strArgRegex));
        
        if (!matches)
            matches = sanitizeMatches(arg.match(regArgRegex), true);

        if (matches)
            argObj = { ...argObj, ...matches };
    }

    argObj.size = Object.keys(argObj).length - 2;
    return argObj;
}

function sanitizeMatches(regexObj: RegExpMatchArray | null, isNotStr?: boolean): (parsedArgs | undefined) {
    if (!regexObj)
        return;

    if (regexObj.groups?.bool)
        return { [regexObj.groups.bool.toLowerCase()]: true };

    if (!regexObj.groups?.key)
        return;

    if (!regexObj.groups?.value)
        return { [regexObj.groups.key.toLowerCase()]: false };

    if (!isNaN(Number(regexObj.groups.value)))
        return { [regexObj.groups.key.toLowerCase()]: Number(regexObj.groups.value) };

    if (regexObj.groups.value.includes(",") && isNotStr) {
        const res: (string | number)[] = [];    

        for (const el of regexObj.groups.value.split(",")) {
            if (!isNaN(Number(el)))
                res.push(Number(el));

            else
                if (el)
                    res.push(el);
            }
            return { [regexObj.groups.key.toLowerCase()]: res };
    }
    else
        return { [regexObj.groups.key.toLowerCase()]: regexObj.groups.value };
}