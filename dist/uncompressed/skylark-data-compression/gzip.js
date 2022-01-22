define([
    "./compression",
    "./deflate"
], function(compression, Deflate) {

    'use strict';

    function gzip(input, options) {
        options = options || {};
        options.gzip = true;
        return Deflate.compress(input, options);
    }

    return compression.gzip = gzip;

});