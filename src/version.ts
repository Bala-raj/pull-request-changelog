import {IChangesContent} from "./common";

export const bumpVersion = (
    masks: number[],
    currentVersion: string,
): string => {

    let bitMap = ['major', 'minor', 'patch'];
    let bumpAt = 'patch';
    let oldVer = currentVersion.match(/\d+/g);

    for (let i = 0; i < masks.length; ++i) {
        if (masks[i] === 1) {
            bumpAt = bitMap[i];
            break;
        }
    }

    let bumpIdx = bitMap.indexOf(bumpAt);
    let newVersion = []
    for (let i = 0; i < oldVer.length; ++i) {
        if (i < bumpIdx) {
            newVersion[i] = +oldVer[i];
        } else if (i === bumpIdx) {
            newVersion[i] = +oldVer[i] + 1;
        } else {
            newVersion[i] = 0;
        }
    }

    return newVersion.join('.');
};

