define([
    './zlib/inflate',
    './utils/common',
    './utils/strings',
    './zlib/messages',
    './zlib/zstream',
    './zlib/gzheader',
    './zlib/constants'
], function (zlib_inflate, utils, strings, msg, ZStream, GZheader, constants) {
    'use strict';


    const toString = Object.prototype.toString;
    const {Z_NO_FLUSH, Z_FINISH, Z_OK, Z_STREAM_END, Z_NEED_DICT, Z_STREAM_ERROR, Z_DATA_ERROR, Z_MEM_ERROR} = constants;
    function Inflate(options) {
        this.options = utils.assign({
            chunkSize: 1024 * 64,
            windowBits: 15,
            to: ''
        }, options || {});
        const opt = this.options;
        if (opt.raw && opt.windowBits >= 0 && opt.windowBits < 16) {
            opt.windowBits = -opt.windowBits;
            if (opt.windowBits === 0) {
                opt.windowBits = -15;
            }
        }
        if (opt.windowBits >= 0 && opt.windowBits < 16 && !(options && options.windowBits)) {
            opt.windowBits += 32;
        }
        if (opt.windowBits > 15 && opt.windowBits < 48) {
            if ((opt.windowBits & 15) === 0) {
                opt.windowBits |= 15;
            }
        }
        this.err = 0;
        this.msg = '';
        this.ended = false;
        this.chunks = [];
        this.strm = new ZStream();
        this.strm.avail_out = 0;
        let status = zlib_inflate.inflateInit2(this.strm, opt.windowBits);
        if (status !== Z_OK) {
            throw new Error(msg[status]);
        }
        this.header = new GZheader();
        zlib_inflate.inflateGetHeader(this.strm, this.header);
        if (opt.dictionary) {
            if (typeof opt.dictionary === 'string') {
                opt.dictionary = strings.string2buf(opt.dictionary);
            } else if (toString.call(opt.dictionary) === '[object ArrayBuffer]') {
                opt.dictionary = new Uint8Array(opt.dictionary);
            }
            if (opt.raw) {
                status = zlib_inflate.inflateSetDictionary(this.strm, opt.dictionary);
                if (status !== Z_OK) {
                    throw new Error(msg[status]);
                }
            }
        }
    }
    Inflate.prototype.push = function (data, flush_mode) {
        const strm = this.strm;
        const chunkSize = this.options.chunkSize;
        const dictionary = this.options.dictionary;
        let status, _flush_mode, last_avail_out;
        if (this.ended)
            return false;
        if (flush_mode === ~~flush_mode)
            _flush_mode = flush_mode;
        else
            _flush_mode = flush_mode === true ? Z_FINISH : Z_NO_FLUSH;
        if (toString.call(data) === '[object ArrayBuffer]') {
            strm.input = new Uint8Array(data);
        } else {
            strm.input = data;
        }
        strm.next_in = 0;
        strm.avail_in = strm.input.length;
        for (;;) {
            if (strm.avail_out === 0) {
                strm.output = new Uint8Array(chunkSize);
                strm.next_out = 0;
                strm.avail_out = chunkSize;
            }
            status = zlib_inflate.inflate(strm, _flush_mode);
            if (status === Z_NEED_DICT && dictionary) {
                status = zlib_inflate.inflateSetDictionary(strm, dictionary);
                if (status === Z_OK) {
                    status = zlib_inflate.inflate(strm, _flush_mode);
                } else if (status === Z_DATA_ERROR) {
                    status = Z_NEED_DICT;
                }
            }
            while (strm.avail_in > 0 && status === Z_STREAM_END && strm.state.wrap > 0 && data[strm.next_in] !== 0) {
                zlib_inflate.inflateReset(strm);
                status = zlib_inflate.inflate(strm, _flush_mode);
            }
            switch (status) {
            case Z_STREAM_ERROR:
            case Z_DATA_ERROR:
            case Z_NEED_DICT:
            case Z_MEM_ERROR:
                this.onEnd(status);
                this.ended = true;
                return false;
            }
            last_avail_out = strm.avail_out;
            if (strm.next_out) {
                if (strm.avail_out === 0 || status === Z_STREAM_END) {
                    if (this.options.to === 'string') {
                        let next_out_utf8 = strings.utf8border(strm.output, strm.next_out);
                        let tail = strm.next_out - next_out_utf8;
                        let utf8str = strings.buf2string(strm.output, next_out_utf8);
                        strm.next_out = tail;
                        strm.avail_out = chunkSize - tail;
                        if (tail)
                            strm.output.set(strm.output.subarray(next_out_utf8, next_out_utf8 + tail), 0);
                        this.onData(utf8str);
                    } else {
                        this.onData(strm.output.length === strm.next_out ? strm.output : strm.output.subarray(0, strm.next_out));
                    }
                }
            }
            if (status === Z_OK && last_avail_out === 0)
                continue;
            if (status === Z_STREAM_END) {
                status = zlib_inflate.inflateEnd(this.strm);
                this.onEnd(status);
                this.ended = true;
                return true;
            }
            if (strm.avail_in === 0)
                break;
        }
        return true;
    };
    Inflate.prototype.onData = function (chunk) {
        this.chunks.push(chunk);
    };
    Inflate.prototype.onEnd = function (status) {
        if (status === Z_OK) {
            if (this.options.to === 'string') {
                this.result = this.chunks.join('');
            } else {
                this.result = utils.flattenChunks(this.chunks);
            }
        }
        this.chunks = [];
        this.err = status;
        this.msg = this.strm.msg;
    };
    
    Inflate.uncompress = function(input, options) {
        const inflator = new Inflate(options);
        inflator.push(input);
        if (inflator.err)
            throw inflator.msg || msg[inflator.err];
        return inflator.result;
    }
    function inflateRaw(input, options) {
        options = options || {};
        options.raw = true;
        return inflate(input, options);
    }


    return Inflate;
  
});