define([
    "./compression",
    "./inflate"
], function(compression, Inflate) {

    'use strict';

    return compression.ungzip = Inflate.uncompress;

});