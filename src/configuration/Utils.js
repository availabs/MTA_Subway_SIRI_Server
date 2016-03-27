'use strict' ;


function mutatorIsValid (mutator) {
    return Array.isArray(mutator) &&
           (mutator.length === 2)  &&
           (typeof mutator[0] === 'string') &&
           (typeof mutator[1] === 'string') ;
}


function validateNumericField (hotConfig, fieldName, validationMessage) {
    if (isNaN(parseInt(hotConfig[fieldName]))) { 
        validationMessage[fieldName] = { 
            error: ('GTFS-Realtime configuration field \'' + fieldName + '\' must be a numeric value.') ,
        };
    } else {
        validationMessage[fieldName] = { 
            info: ('GTFS-Realtime configuration field \'' + fieldName + '\' looks valid.') ,
        };
    }
}


module.exports = {
    mutatorIsValid       : mutatorIsValid ,
    validateNumericField : validateNumericField ,
};
