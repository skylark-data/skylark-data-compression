define([
    "./compression",
    "./inflate"
], function(compression, Inflate) {

    'use strict';

    function inflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return Inflate.uncompress(input, options);
    }

    return compression.inflateRaw = inflateRaw;

});