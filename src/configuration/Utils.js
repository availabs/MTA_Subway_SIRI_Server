'use strict' ;


function mutatorIsValid (mutator) {
    return Array.isArray(mutator) &&
           (mutator.length === 2)  &&
           (typeof mutator[0] === 'string') &&
           (typeof mutator[1] === 'string') ;
}



function extractValidationErrorMessages (msgObject) {
    if (!msgObject) { return false; }

    var keys = Object.keys(msgObject),
        m, i;

    for ( i = 0; i < keys.length; ++i ) {
        m =  msgObject[keys[i]];
        if (m && m.error) {
            return true;
        }
    }
}


module.exports = {
    mutatorIsValid                 : mutatorIsValid ,
    extractValidationErrorMessages : extractValidationErrorMessages ,
};
