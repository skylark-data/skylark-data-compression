define([
    "./compression",
    "./deflate"
], function(compression, Deflate) {

    'use strict';

    function deflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return Deflate.compress(input, options);
    }

    return compression.deflateRaw = deflateRaw;

});