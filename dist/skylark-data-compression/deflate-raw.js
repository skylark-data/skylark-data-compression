/**
 * skylark-data-compression - The skylark compression utility library
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./compression","./deflate"],function(e,n){"use strict";return e.deflateRaw=function(e,r){return(r=r||{}).raw=!0,n.compress(e,r)}});
//# sourceMappingURL=sourcemaps/deflate-raw.js.map
