/**
 * skylark-data-compression - The skylark compression utility library
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./compression","./deflate"],function(e,n){"use strict";return e.gzip=function(e,i){return(i=i||{}).gzip=!0,n.compress(e,i)}});
//# sourceMappingURL=sourcemaps/gzip.js.map
