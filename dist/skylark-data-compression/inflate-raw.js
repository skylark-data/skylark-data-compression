/**
 * skylark-data-compression - The skylark compression utility library
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./compression","./inflate"],function(n,e){"use strict";return n.inflateRaw=function(n,r){return(r=r||{}).raw=!0,e.uncompress(n,r)}});
//# sourceMappingURL=sourcemaps/inflate-raw.js.map
