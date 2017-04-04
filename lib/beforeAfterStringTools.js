"use strict";
var EMPTY_FUNCTION = function() {};
var validateInput = function(text, opening, closing, replaceWith, iterator) {
    var isValidInput = true;
    var errorObject = {};
    if (!_.isString(text)) {
        errorObject.invalidParam = text;
        errorObject.invalidParamName = 'text';
        errorObject.invalidParamExpectedType = 'string';
        isValidInput = false;
    } else if (!_.isString(opening)) {
        errorObject.invalidParam = opening;
        errorObject.invalidParamName = 'opening';
        errorObject.invalidParamExpectedType = 'string';
        isValidInput = false;
    } else if (!_.isString(closing)) {
        errorObject.invalidParam = closing;
        errorObject.invalidParamName = 'closing';
        errorObject.invalidParamExpectedType = 'string';
        isValidInput = false;
    } else if (!(_.isString(replaceWith) || _.isFunction(replaceWith))) {
        errorObject.invalidParam = replaceWith;
        errorObject.invalidParamName = 'replaceWith';
        errorObject.invalidParamExpectedType = 'string or function';
        isValidInput = false;
    } else if (!_.isFunction(iterator)) {
        errorObject.invalidParam = iterator;
        errorObject.invalidParamName = 'iterator';
        errorObject.invalidParamExpectedType = 'function';
        isValidInput = false;
    }
    if (!isValidInput) {
        handleInvalidInputError(errorObject);
    }
    return isValidInput;
};
var handleInvalidInputError = function(errorObject) {
    console.error('Invalid input for param "' + errorObject.invalidParamName + '". ' +
        typeof errorObject.invalidParam + ' is not a ' + errorObject.invalidParamExpectedType);
};
var getBeforeAfterReplacement = function(replaceWith, match, ignoredText, beforeAfterMatch, index) {
    if (_.isString(replaceWith)) {
        return ignoredText + replaceWith;
    } else if (_.isFunction(replaceWith)) {
        return ignoredText + replaceWith(match, ignoredText, beforeAfterMatch, index);
    }
};
var getRegex = function(text, opening, closing) {
    var openingRegexStr = _.escapeRegExp(opening);
    var closingRegexStr = _.escapeRegExp(closing);
    return new RegExp('(' + openingRegexStr + '.*?' + closingRegexStr + ')*(.+?(?=' + openingRegexStr + '|$))', 'g');
};
var replaceBeforeAfter = function(text, opening, closing, replaceWith, replaceMatchIndexes) {
    if (validateInput(text, opening, closing, replaceWith, EMPTY_FUNCTION)) {
        var regex = getRegex(text, opening, closing);
        var index = -1;
        return text.replace(regex, function(match, ignoredText, beforeAfterMatch) {
            var matchFoundIsEmptyString = _.isUndefined(ignoredText) && beforeAfterMatch === '';
            var matchFoundIsEqualToStringIgnored = match === ignoredText || beforeAfterMatch === ignoredText;
            if (matchFoundIsEmptyString) {
                return '';
            } else if (matchFoundIsEqualToStringIgnored) {
                return ignoredText;
            }else {
                index++;
                if (replaceMatchIndexes === 'all' || _.indexOf(replaceMatchIndexes, index) !== -1) {
                var replacedString= getBeforeAfterReplacement(replaceWith, match || '', ignoredText || '', beforeAfterMatch || '', index);
                    return replacedString;
                }
                return (ignoredText || '') + (beforeAfterMatch || '');
            }
        });
    }
    return text;
};
var beforeAfterStringExports = {};
var replace = function(text, opening, closing, replaceWith) {
    return replaceBeforeAfter(text, opening, closing, replaceWith, 'all');
};
var replaceAt = function(text, opening, closing, replaceWith, replaceMatchIndexes) {
    if (!_.isArray(replaceMatchIndexes)) {
        replaceMatchIndexes = 'all';
    }
    return replaceBeforeAfter(text, opening, closing, replaceWith, replaceMatchIndexes);
};
var replaceFirstN = function(text, opening, closing, replaceWith, occurances) {
    var replaceMatchIndexes = 'all';
    if (_.isInteger(occurances)) {
        replaceMatchIndexes = _.range(occurances);
    }
    return replaceBeforeAfter(text, opening, closing, replaceWith, replaceMatchIndexes);
};
var replaceLastN = function(text, opening, closing, replaceWith, occurances) {
    var numberOfMatches = findBeforeAfter(text, opening, closing).length;
    if (numberOfMatches > 0) {
        indexStart = numberOfMatches - occurances;
        var replaceMatchIndexes = 'all';
        if (indexStart > 0) {     
            replaceMatchIndexes = _.range(indexStart, numberOfMatches);
        }
        return replaceBeforeAfter(text, opening, closing, replaceWith, replaceMatchIndexes);
    }
    return text;
};
beforeAfterStringExports.replace = replace;
beforeAfterStringExports.replaceAt = replaceAt;
beforeAfterStringExports.replaceFirstN = replaceFirstN;
beforeAfterStringExports.replaceLastN = replaceLastN;

var remove = function(text, opening, closing) {
    return replace(text, opening, closing, '', 'all');
};
var removeAt = function(text, opening, closing, replaceMatchIndexes) {
    return replaceAt(text, opening, closing, '', replaceMatchIndexes);
};
var removeFirstN = function(text, opening, closing, occurances) {
    return replaceFirstN(text, opening, closing, '', occurances);
};
var removeLastN = function(text, opening, closing, occurances) {
    return replaceLastN(text, opening, closing, '', occurances);
};
beforeAfterStringExports.remove = remove;
beforeAfterStringExports.removeAt = removeAt;
beforeAfterStringExports.removeFirstN = removeFirstN;
beforeAfterStringExports.removeLastN = removeLastN;

var getReplaceWithFunction = function(parseFunction, lodashArgs) {
    return function(match, ignoredText, beforeAfterMatch) {
        var args = [beforeAfterMatch];
        if (_.isArray(lodashArgs)) {
            args = args.concat(lodashArgs);
        }
        return parseFunction.apply(this, args);
    };
};
var getEscapeFunction = function(escapeFunction) {
    if (_.isFunction(escapeFunction)) {
        return getReplaceWithFunction(escapeFunction);
    }
    return getReplaceWithFunction(_.escape);
};
var getUnescapeFunction = function(unescapeFunction) {
    if (_.isFunction(unescapeFunction)) {
        return getReplaceWithFunction(unescapeFunction);
    }
    return getReplaceWithFunction(_.unescape);
};



var escape = function(text, opening, closing, escapeFunction) {
    return replace(text, opening, closing, getEscapeFunction(escapeFunction), 'all');
};
var escapeAt = function(text, opening, closing, replaceMatchIndexes) {
    return replaceAt(text, opening, closing, getEscapeFunction(escapeFunction), replaceMatchIndexes);
};
var escapeFirstN = function(text, opening, closing, occurances) {
    return replaceFirstN(text, opening, closing, getEscapeFunction(escapeFunction), occurances);
};
var escapeLastN = function(text, opening, closing, occurances) {
    return replaceLastN(text, opening, closing, getEscapeFunction(escapeFunction), occurances);
};
beforeAfterStringExports.escape = escape;
beforeAfterStringExports.escapeAt = escapeAt;
beforeAfterStringExports.escapeFirstN = escapeFirstN;
beforeAfterStringExports.escapeLastN = escapeLastN;

var unescape = function(text, opening, closing, escapeFunction) {
    return replace(text, opening, closing, getUnescapeFunction(getEscapeFunction), 'all');
};
var unescapeAt = function(text, opening, closing, replaceMatchIndexes) {
    return replaceAt(text, opening, closing, getUnescapeFunction(getEscapeFunction), replaceMatchIndexes);
};
var unescapeFirstN = function(text, opening, closing, occurances) {
    return replaceFirstN(text, opening, closing, getUnescapeFunction(getEscapeFunction), occurances);
};
var unescapeLastN = function(text, opening, closing, occurances) {
    return replaceLastN(text, opening, closing, getUnescapeFunction(getEscapeFunction), occurances);
};
beforeAfterStringExports.unescape = unescape;
beforeAfterStringExports.unescapeAt = unescapeAt;
beforeAfterStringExports.unescapeFirstN = unescapeFirstN;
beforeAfterStringExports.unescapeLastN = unescapeLastN;

var repeatWith = function(text, opening, closing) {
    var lodashArgs = _.drop(arguments, 3);
    return replace(text, opening, closing, function(match, ignoredText, beforeAfterMatch){
        return _.repeat.apply(this, lodashArgs);
    }, 'all');
};
var repeatWithAt = function(text, opening, closing, replaceMatchIndexes) {
    var lodashArgs = _.drop(arguments, 4);
    return replaceAt(text, opening, closing, function(match, ignoredText, beforeAfterMatch){
        return _.repeat.apply(this, lodashArgs);
    }, replaceMatchIndexes);
};
var repeatWithFirstN = function(text, opening, closing, occurances) {
    var lodashArgs = _.drop(arguments, 4);
    return replaceFirstN(text, opening, closing, function(match, ignoredText, beforeAfterMatch){
        return _.repeat.apply(this, lodashArgs);
    }, occurances);
};
var repeatWithLastN = function(text, opening, closing, occurances) {
    var lodashArgs = _.drop(arguments, 4);
    return replaceLastN(text, opening, closing, function(match, ignoredText, beforeAfterMatch){
        return _.repeat.apply(this, lodashArgs);
    }, occurances);
};
beforeAfterStringExports.repeatWith = repeatWith;
beforeAfterStringExports.repeatWithAt = repeatWithAt;
beforeAfterStringExports.repeatWithFirstN = repeatWithFirstN;
beforeAfterStringExports.repeatWithLastN = repeatWithLastN;

var eachBeforeAfter = function(text, opening, closing, iterator) {
    if (validateInput(text, opening, closing, '', iterator)) {
        var index = -1;
        var regex = getRegex(text, opening, closing);
        text.replace(regex, function(match, ignoredText, beforeAfterMatch) {
            index++;
            var matchFoundIsEmptyString = _.isUndefined(ignoredText) && beforeAfterMatch === '';
            var matchFoundIsEqualToStringIgnored = match === ignoredText;
            if (!matchFoundIsEmptyString && !matchFoundIsEqualToStringIgnored) {
                iterator(beforeAfterMatch, index);
            }
            return ignoredText;
        });
    }
};
beforeAfterStringExports.each = eachBeforeAfter;
var findBeforeAfter = function(text, opening, closing) {
    var matches = [];
    var findIterator = function(beforeAfterMatch) {
        matches.push(beforeAfterMatch);
    };
    eachBeforeAfter(text, opening, closing, findIterator);
    if (matches.join('') === text) {
        matches = [];
    }
    return matches;
};
beforeAfterStringExports.find = findBeforeAfter;

var loadLodashStringFunctions = function() {
    var lodashStringUtils = [
        'camelCase',
        'capitalize',
        'deburr',
        'endsWith',
        'escapeRegExp',
        'kebabCase',
        'lowerCase',
        'lowerFirst',
        'pad',
        'padEnd',
        'padStart',
        'repeat',
        'snakeCase',
        'startCase',
        'toLower',
        'toUpper',
        'trim',
        'trimEnd',
        'trimStart',
        'truncate',
        'upperCase',
        'upperFirst',
        'words'
    ];
    beforeAfterStringNameExtentions = ['', 'At', 'FirstN', 'LastN'];
    _.each(lodashStringUtils, function(lodashFunctionName) {
        if (!_.isUndefined(_[lodashFunctionName])) {
            _.each(beforeAfterStringNameExtentions, function(beforeAfterStringNameExtention) {
                beforeAfterStringExports[lodashFunctionName + beforeAfterStringNameExtention] = function(text, opening, closing, arg4) {
                    var firstNArgumentsToDrop = 4;
                    var replaceMatchOccuranceOrIndexes = arg4;
                    if (beforeAfterStringNameExtention === '') {
                        firstNArgumentsToDrop = 3;
                        replaceMatchOccuranceOrIndexes = 'all';
                    }
                    var lodashArgs = _.drop(arguments, firstNArgumentsToDrop);
                    var replaceWith = getReplaceWithFunction(_[lodashFunctionName], lodashArgs);
                    return beforeAfterStringExports['replace' + beforeAfterStringNameExtention](text, opening, closing, replaceWith, replaceMatchOccuranceOrIndexes);
                };
            });
        }
    });  
};
loadLodashStringFunctions();
modulus.exports = beforeAfterStringExports;
