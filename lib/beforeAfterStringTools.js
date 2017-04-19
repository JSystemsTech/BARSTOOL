var EMPTY_FUNCTION = function() {};
var _validateInput = function(text, opening, closing, replaceWith, iterator) {
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
        _handleInvalidInputError(errorObject);
    }
    return isValidInput;
};
var _handleInvalidInputError = function(errorObject) {
    console.error('Invalid input for param "' + errorObject.invalidParamName + '". ' +
        typeof errorObject.invalidParam + ' is not a ' + errorObject.invalidParamExpectedType);
};
var _getBeforeAfterReplacement = function(replaceWith, match, ignoredText, beforeAfterMatch, index) {
    if (_.isString(replaceWith)) {
        return ignoredText + replaceWith;
    } else if (_.isFunction(replaceWith)) {
        return ignoredText + replaceWith(match, ignoredText, beforeAfterMatch, index);
    }
};
var _getRegex = function(text, opening, closing) {
    var openingRegexStr = _.escapeRegExp(opening);
    var closingRegexStr = _.escapeRegExp(closing);
    return new RegExp('(' + openingRegexStr + '.*?' + closingRegexStr + ')*(.+?(?=' + openingRegexStr + '|$))', 'g');
};
var replaceBeforeAfter = function(text, opening, closing, replaceWith, replaceMatchIndexes) {
    if (_validateInput(text, opening, closing, replaceWith, EMPTY_FUNCTION)) {
        var regex = _getRegex(text, opening, closing);
        var index = -1;
        return text.replace(regex, function(match, ignoredText, beforeAfterMatch) {
            var matchFoundIsEmptyString = _.isUndefined(ignoredText) && beforeAfterMatch === '';
            var matchFoundIsEqualToStringIgnored = match === ignoredText || beforeAfterMatch === ignoredText;
            if (matchFoundIsEmptyString) {
                return '';
            } else if (matchFoundIsEqualToStringIgnored) {
                return ignoredText;
            } else {
                index++;
                if (replaceMatchIndexes === 'all' || _.indexOf(replaceMatchIndexes, index) !== -1) {
                    var replacedString = _getBeforeAfterReplacement(replaceWith, match || '', ignoredText || '', beforeAfterMatch || '', index);
                    return replacedString;
                }
                return (ignoredText || '') + (beforeAfterMatch || '');
            }
        });
    }
    return text;
};

var beforeAfterStringExports = {
    replace: function(text, opening, closing, replaceWith) {
        return replaceBeforeAfter(text, opening, closing, replaceWith, 'all');
    },
    replaceAt: function(text, opening, closing, replaceWith, replaceMatchIndexes) {
        if (!_.isArray(replaceMatchIndexes)) {
            replaceMatchIndexes = 'all';
        }
        return replaceBeforeAfter(text, opening, closing, replaceWith, replaceMatchIndexes);
    },
    replaceFirstN: function(text, opening, closing, replaceWith, occurances) {
        var replaceMatchIndexes = 'all';
        if (_.isInteger(occurances)) {
            replaceMatchIndexes = _.range(occurances);
        }
        return replaceBeforeAfter(text, opening, closing, replaceWith, replaceMatchIndexes);
    },
    replaceLastN: function(text, opening, closing, replaceWith, occurances) {
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
    },
    eachBeforeAfter: function(text, opening, closing, iterator) {
        if (_validateInput(text, opening, closing, '', iterator)) {
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
    },
    findBeforeAfter: function(text, opening, closing) {
        var matches = [];
        var findIterator = function(beforeAfterMatch) {
            matches.push(beforeAfterMatch);
        };
        this.eachBeforeAfter(text, opening, closing, findIterator);
        if (matches.join('') === text) {
            matches = [];
        }
        return matches;
    }
};

var getReplaceWithFunction = function(parseFunction, lodashArgs) {
    return function(match, ignoredText, beforeAfterMatch) {
        var args = [beforeAfterMatch];
        if (_.isArray(lodashArgs)) {
            args = args.concat(lodashArgs);
        }
        return parseFunction.apply(this, args);
    };
};

_registerHelpers = function(helpersMap) {
    var helpersToRegister = {};
    _.each(helpersMap, function(helperFunction, name) {
        _.each(['', 'At', 'FirstN', 'LastN'], function(beforeAfterStringNameExtention) {
            helpersToRegister[name + beforeAfterStringNameExtention] = function(text, opening, closing, arg4) {
                var firstNArgumentsToDrop = 4;
                var replaceMatchOccuranceOrIndexes = arg4;
                if (beforeAfterStringNameExtention === '') {
                    firstNArgumentsToDrop = 3;
                    replaceMatchOccuranceOrIndexes = 'all';
                }
                var helperSpecificArgs = _.drop(arguments, firstNArgumentsToDrop);
                var replaceWith = getReplaceWithFunction(helperFunction, helperSpecificArgs);
                return _.get(beforeAfterStringExports, 'replace' + beforeAfterStringNameExtention)(text, opening, closing, replaceWith, replaceMatchOccuranceOrIndexes);
            };
        });
    });
    _.defaults(beforeAfterStringExports, helpersToRegister);
};
_validateHelper = function(helper, callback, options) {
    options = options || {};
    var testString = _.get(options, 'testString');
    if (!_.isString(testString)) {
        testString = 'test string';
    }
    var expectedString = _.get(options, 'expectedString');
    var additionalArgs = _.get(options, 'additionalArgs', []);
    var args = [helper, testString].concat(additionalArgs);

    var validateHelper = _.attempt.apply(this, args);
    var isString = _.isString(validateHelper);
    var isError = _.isError(validateHelper);
    var isExpectedResponse = true;
    if (_.isString(expectedString)) {
        isExpectedResponse = expectedString === validateHelper;
    }

    if (isError || !isString || !isExpectedResponse) {
        if (isError) {
            console.error(validateHelper);
        } else if (!isString) {
            console.error(new Error('Helper does not return a string. Helper returns a ' + typeof validateHelper));
        } else {
            console.error(new Error('Helper did not return expected value\nexpected- "' + expectedString + '"\n  actual- "' + validateHelper + '"'));
        }
        return callback(true);
    }
    return callback(false);
};
_registerHelper = function(name, helper, options) {
    _validateHelper(helper, function(hasError) {
        if (!hasError) {
            _registerHelpers(_.set({}, name, helper));
        }
    }, options);
};
_.set(beforeAfterStringExports, 'Utils.RegisterHelper', _registerHelper);

var getEscUEscFunction = function(customFunction, lodashDefaultname) {
    if (_.isFunction(customFunction)) {
        return customFunction;
    }
    return getReplaceWithFunction(_[lodashDefaultname]);
};

var builtInReplaceHelpers = {
    remove: function() {
        return '';
    },
    escape: function(beforeAfterMatch, escapeFunction) {
        return getEscUEscFunction(escapeFunction, 'escape')(beforeAfterMatch);
    },
    unescape: function(beforeAfterMatch, escapeFunction) {
        return getEscUEscFunction(escapeFunction, 'unescape')(beforeAfterMatch);
    },
    repeatWith: function(beforeAfterMatch, repeatWithText, timesToRepeat) {
        return _.repeat(repeatWithText, timesToRepeat);
    },
    strip: function(beforeAfterMatch, stripOpeningStr, stripClosingStr) {
        var start = _.escapeRegExp(stripOpeningStr);
        var end = _.escapeRegExp(stripClosingStr);
        var regex = new RegExp(start + '[^' + end + ']*' + end, 'g');
        return beforeAfterMatch.replace(regex, '');
    },
    stripHtmlTags: function(beforeAfterMatch) {
        return beforeAfterMatch.replace(/<[^>]*>/g, '');
    },
    toTitleCase: function(string, additionalWords, overwriteWords) {
        var smallWordsList = ['a', 'am', 'an', 'and', 'as', 'at', 'be', 'but', 'by', 'do', 'en', 'for', 'from', 'if', 'in', 'into', 'is', 'it', 'near', 'nor', 'of', 'on', 'onto', 'or', 'per', 'the', 'to', 'vs?\\.?', 'via', 'with'];
        if (_.isArray(additionalWords)) {
            smallWordsList = _.uniq(smallWordsList.concat(additionalWords));
        }
        var smallWordRegex = new RegExp('^(' + smallWordsList.join('|') + ')$', 'i');
        return string.replace(/[A-Za-z0-9\u00C0-\u00FF]+[^\s-]*/g, function(match, index, title) {
            if (index > 0 && index + match.length !== title.length &&
                match.search(smallWordRegex) > -1 && title.charAt(index - 2) !== ":" &&
                (title.charAt(index + match.length) !== '-' || title.charAt(index - 1) === '-') &&
                title.charAt(index - 1).search(/[^\s-]/) < 0) {
                return match.toLowerCase();
            }

            if (match.substr(1).search(/[A-Z]|\../) > -1) {
                return match;
            }

            return match.charAt(0).toUpperCase() + match.substr(1);
        });
    }
};
var lodashStringUtils = _.pick(_, [
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
    'upperFirst'
]);
var allReplaceHelpers = _.defaults(builtInReplaceHelpers, lodashStringUtils);
_registerHelpers(allReplaceHelpers);
