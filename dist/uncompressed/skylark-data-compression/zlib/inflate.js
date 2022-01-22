define([
    './adler32',
    './crc32',
    './inffast',
    './inftrees',
    './constants'
], function (adler32, crc32, inflate_fast, inflate_table, constants) {
    'use strict';

    const CODES = 0;
    const LENS = 1;
    const DISTS = 2;
    const {Z_FINISH, Z_BLOCK, Z_TREES, Z_OK, Z_STREAM_END, Z_NEED_DICT, Z_STREAM_ERROR, Z_DATA_ERROR, Z_MEM_ERROR, Z_BUF_ERROR, Z_DEFLATED} = __module__4;
    const HEAD = 1;
    const FLAGS = 2;
    const TIME = 3;
    const OS = 4;
    const EXLEN = 5;
    const EXTRA = 6;
    const NAME = 7;
    const COMMENT = 8;
    const HCRC = 9;
    const DICTID = 10;
    const DICT = 11;
    const TYPE = 12;
    const TYPEDO = 13;
    const STORED = 14;
    const COPY_ = 15;
    const COPY = 16;
    const TABLE = 17;
    const LENLENS = 18;
    const CODELENS = 19;
    const LEN_ = 20;
    const LEN = 21;
    const LENEXT = 22;
    const DIST = 23;
    const DISTEXT = 24;
    const MATCH = 25;
    const LIT = 26;
    const CHECK = 27;
    const LENGTH = 28;
    const DONE = 29;
    const BAD = 30;
    const MEM = 31;
    const SYNC = 32;
    const ENOUGH_LENS = 852;
    const ENOUGH_DISTS = 592;
    const MAX_WBITS = 15;
    const DEF_WBITS = MAX_WBITS;
    const zswap32 = q => {
        return (q >>> 24 & 255) + (q >>> 8 & 65280) + ((q & 65280) << 8) + ((q & 255) << 24);
    };
    function InflateState() {
        this.mode = 0;
        this.last = false;
        this.wrap = 0;
        this.havedict = false;
        this.flags = 0;
        this.dmax = 0;
        this.check = 0;
        this.total = 0;
        this.head = null;
        this.wbits = 0;
        this.wsize = 0;
        this.whave = 0;
        this.wnext = 0;
        this.window = null;
        this.hold = 0;
        this.bits = 0;
        this.length = 0;
        this.offset = 0;
        this.extra = 0;
        this.lencode = null;
        this.distcode = null;
        this.lenbits = 0;
        this.distbits = 0;
        this.ncode = 0;
        this.nlen = 0;
        this.ndist = 0;
        this.have = 0;
        this.next = null;
        this.lens = new Uint16Array(320);
        this.work = new Uint16Array(288);
        this.lendyn = null;
        this.distdyn = null;
        this.sane = 0;
        this.back = 0;
        this.was = 0;
    }
    const inflateResetKeep = strm => {
        if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
        }
        const state = strm.state;
        strm.total_in = strm.total_out = state.total = 0;
        strm.msg = '';
        if (state.wrap) {
            strm.adler = state.wrap & 1;
        }
        state.mode = HEAD;
        state.last = 0;
        state.havedict = 0;
        state.dmax = 32768;
        state.head = null;
        state.hold = 0;
        state.bits = 0;
        state.lencode = state.lendyn = new Int32Array(ENOUGH_LENS);
        state.distcode = state.distdyn = new Int32Array(ENOUGH_DISTS);
        state.sane = 1;
        state.back = -1;
        return Z_OK;
    };
    const inflateReset = strm => {
        if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
        }
        const state = strm.state;
        state.wsize = 0;
        state.whave = 0;
        state.wnext = 0;
        return inflateResetKeep(strm);
    };
    const inflateReset2 = (strm, windowBits) => {
        let wrap;
        if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
        }
        const state = strm.state;
        if (windowBits < 0) {
            wrap = 0;
            windowBits = -windowBits;
        } else {
            wrap = (windowBits >> 4) + 1;
            if (windowBits < 48) {
                windowBits &= 15;
            }
        }
        if (windowBits && (windowBits < 8 || windowBits > 15)) {
            return Z_STREAM_ERROR;
        }
        if (state.window !== null && state.wbits !== windowBits) {
            state.window = null;
        }
        state.wrap = wrap;
        state.wbits = windowBits;
        return inflateReset(strm);
    };
    const inflateInit2 = (strm, windowBits) => {
        if (!strm) {
            return Z_STREAM_ERROR;
        }
        const state = new InflateState();
        strm.state = state;
        state.window = null;
        const ret = inflateReset2(strm, windowBits);
        if (ret !== Z_OK) {
            strm.state = null;
        }
        return ret;
    };
    const inflateInit = strm => {
        return inflateInit2(strm, DEF_WBITS);
    };
    let virgin = true;
    let lenfix, distfix;
    const fixedtables = state => {
        if (virgin) {
            lenfix = new Int32Array(512);
            distfix = new Int32Array(32);
            let sym = 0;
            while (sym < 144) {
                state.lens[sym++] = 8;
            }
            while (sym < 256) {
                state.lens[sym++] = 9;
            }
            while (sym < 280) {
                state.lens[sym++] = 7;
            }
            while (sym < 288) {
                state.lens[sym++] = 8;
            }
            inflate_table(LENS, state.lens, 0, 288, lenfix, 0, state.work, { bits: 9 });
            sym = 0;
            while (sym < 32) {
                state.lens[sym++] = 5;
            }
            inflate_table(DISTS, state.lens, 0, 32, distfix, 0, state.work, { bits: 5 });
            virgin = false;
        }
        state.lencode = lenfix;
        state.lenbits = 9;
        state.distcode = distfix;
        state.distbits = 5;
    };
    const updatewindow = (strm, src, end, copy) => {
        let dist;
        const state = strm.state;
        if (state.window === null) {
            state.wsize = 1 << state.wbits;
            state.wnext = 0;
            state.whave = 0;
            state.window = new Uint8Array(state.wsize);
        }
        if (copy >= state.wsize) {
            state.window.set(src.subarray(end - state.wsize, end), 0);
            state.wnext = 0;
            state.whave = state.wsize;
        } else {
            dist = state.wsize - state.wnext;
            if (dist > copy) {
                dist = copy;
            }
            state.window.set(src.subarray(end - copy, end - copy + dist), state.wnext);
            copy -= dist;
            if (copy) {
                state.window.set(src.subarray(end - copy, end), 0);
                state.wnext = copy;
                state.whave = state.wsize;
            } else {
                state.wnext += dist;
                if (state.wnext === state.wsize) {
                    state.wnext = 0;
                }
                if (state.whave < state.wsize) {
                    state.whave += dist;
                }
            }
        }
        return 0;
    };
    const inflate = (strm, flush) => {
        let state;
        let input, output;
        let next;
        let put;
        let have, left;
        let hold;
        let bits;
        let _in, _out;
        let copy;
        let from;
        let from_source;
        let here = 0;
        let here_bits, here_op, here_val;
        let last_bits, last_op, last_val;
        let len;
        let ret;
        const hbuf = new Uint8Array(4);
        let opts;
        let n;
        const order = new Uint8Array([
            16,
            17,
            18,
            0,
            8,
            7,
            9,
            6,
            10,
            5,
            11,
            4,
            12,
            3,
            13,
            2,
            14,
            1,
            15
        ]);
        if (!strm || !strm.state || !strm.output || !strm.input && strm.avail_in !== 0) {
            return Z_STREAM_ERROR;
        }
        state = strm.state;
        if (state.mode === TYPE) {
            state.mode = TYPEDO;
        }
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        _in = have;
        _out = left;
        ret = Z_OK;
        inf_leave:
            for (;;) {
                switch (state.mode) {
                case HEAD:
                    if (state.wrap === 0) {
                        state.mode = TYPEDO;
                        break;
                    }
                    while (bits < 16) {
                        if (have === 0) {
                            break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    if (state.wrap & 2 && hold === 35615) {
                        state.check = 0;
                        hbuf[0] = hold & 255;
                        hbuf[1] = hold >>> 8 & 255;
                        state.check = crc32(state.check, hbuf, 2, 0);
                        hold = 0;
                        bits = 0;
                        state.mode = FLAGS;
                        break;
                    }
                    state.flags = 0;
                    if (state.head) {
                        state.head.done = false;
                    }
                    if (!(state.wrap & 1) || (((hold & 255) << 8) + (hold >> 8)) % 31) {
                        strm.msg = 'incorrect header check';
                        state.mode = BAD;
                        break;
                    }
                    if ((hold & 15) !== Z_DEFLATED) {
                        strm.msg = 'unknown compression method';
                        state.mode = BAD;
                        break;
                    }
                    hold >>>= 4;
                    bits -= 4;
                    len = (hold & 15) + 8;
                    if (state.wbits === 0) {
                        state.wbits = len;
                    } else if (len > state.wbits) {
                        strm.msg = 'invalid window size';
                        state.mode = BAD;
                        break;
                    }
                    state.dmax = 1 << state.wbits;
                    strm.adler = state.check = 1;
                    state.mode = hold & 512 ? DICTID : TYPE;
                    hold = 0;
                    bits = 0;
                    break;
                case FLAGS:
                    while (bits < 16) {
                        if (have === 0) {
                            break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    state.flags = hold;
                    if ((state.flags & 255) !== Z_DEFLATED) {
                        strm.msg = 'unknown compression method';
                        state.mode = BAD;
                        break;
                    }
                    if (state.flags & 57344) {
                        strm.msg = 'unknown header flags set';
                        state.mode = BAD;
                        break;
                    }
                    if (state.head) {
                        state.head.text = hold >> 8 & 1;
                    }
                    if (state.flags & 512) {
                        hbuf[0] = hold & 255;
                        hbuf[1] = hold >>> 8 & 255;
                        state.check = crc32(state.check, hbuf, 2, 0);
                    }
                    hold = 0;
                    bits = 0;
                    state.mode = TIME;
                case TIME:
                    while (bits < 32) {
                        if (have === 0) {
                            break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    if (state.head) {
                        state.head.time = hold;
                    }
                    if (state.flags & 512) {
                        hbuf[0] = hold & 255;
                        hbuf[1] = hold >>> 8 & 255;
                        hbuf[2] = hold >>> 16 & 255;
                        hbuf[3] = hold >>> 24 & 255;
                        state.check = crc32(state.check, hbuf, 4, 0);
                    }
                    hold = 0;
                    bits = 0;
                    state.mode = OS;
                case OS:
                    while (bits < 16) {
                        if (have === 0) {
                            break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    if (state.head) {
                        state.head.xflags = hold & 255;
                        state.head.os = hold >> 8;
                    }
                    if (state.flags & 512) {
                        hbuf[0] = hold & 255;
                        hbuf[1] = hold >>> 8 & 255;
                        state.check = crc32(state.check, hbuf, 2, 0);
                    }
                    hold = 0;
                    bits = 0;
                    state.mode = EXLEN;
                case EXLEN:
                    if (state.flags & 1024) {
                        while (bits < 16) {
                            if (have === 0) {
                                break inf_leave;
                            }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        state.length = hold;
                        if (state.head) {
                            state.head.extra_len = hold;
                        }
                        if (state.flags & 512) {
                            hbuf[0] = hold & 255;
                            hbuf[1] = hold >>> 8 & 255;
                            state.check = crc32(state.check, hbuf, 2, 0);
                        }
                        hold = 0;
                        bits = 0;
                    } else if (state.head) {
                        state.head.extra = null;
                    }
                    state.mode = EXTRA;
                case EXTRA:
                    if (state.flags & 1024) {
                        copy = state.length;
                        if (copy > have) {
                            copy = have;
                        }
                        if (copy) {
                            if (state.head) {
                                len = state.head.extra_len - state.length;
                                if (!state.head.extra) {
                                    state.head.extra = new Uint8Array(state.head.extra_len);
                                }
                                state.head.extra.set(input.subarray(next, next + copy), len);
                            }
                            if (state.flags & 512) {
                                state.check = crc32(state.check, input, copy, next);
                            }
                            have -= copy;
                            next += copy;
                            state.length -= copy;
                        }
                        if (state.length) {
                            break inf_leave;
                        }
                    }
                    state.length = 0;
                    state.mode = NAME;
                case NAME:
                    if (state.flags & 2048) {
                        if (have === 0) {
                            break inf_leave;
                        }
                        copy = 0;
                        do {
                            len = input[next + copy++];
                            if (state.head && len && state.length < 65536) {
                                state.head.name += String.fromCharCode(len);
                            }
                        } while (len && copy < have);
                        if (state.flags & 512) {
                            state.check = crc32(state.check, input, copy, next);
                        }
                        have -= copy;
                        next += copy;
                        if (len) {
                            break inf_leave;
                        }
                    } else if (state.head) {
                        state.head.name = null;
                    }
                    state.length = 0;
                    state.mode = COMMENT;
                case COMMENT:
                    if (state.flags & 4096) {
                        if (have === 0) {
                            break inf_leave;
                        }
                        copy = 0;
                        do {
                            len = input[next + copy++];
                            if (state.head && len && state.length < 65536) {
                                state.head.comment += String.fromCharCode(len);
                            }
                        } while (len && copy < have);
                        if (state.flags & 512) {
                            state.check = crc32(state.check, input, copy, next);
                        }
                        have -= copy;
                        next += copy;
                        if (len) {
                            break inf_leave;
                        }
                    } else if (state.head) {
                        state.head.comment = null;
                    }
                    state.mode = HCRC;
                case HCRC:
                    if (state.flags & 512) {
                        while (bits < 16) {
                            if (have === 0) {
                                break inf_leave;
                            }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        if (hold !== (state.check & 65535)) {
                            strm.msg = 'header crc mismatch';
                            state.mode = BAD;
                            break;
                        }
                        hold = 0;
                        bits = 0;
                    }
                    if (state.head) {
                        state.head.hcrc = state.flags >> 9 & 1;
                        state.head.done = true;
                    }
                    strm.adler = state.check = 0;
                    state.mode = TYPE;
                    break;
                case DICTID:
                    while (bits < 32) {
                        if (have === 0) {
                            break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    strm.adler = state.check = zswap32(hold);
                    hold = 0;
                    bits = 0;
                    state.mode = DICT;
                case DICT:
                    if (state.havedict === 0) {
                        strm.next_out = put;
                        strm.avail_out = left;
                        strm.next_in = next;
                        strm.avail_in = have;
                        state.hold = hold;
                        state.bits = bits;
                        return Z_NEED_DICT;
                    }
                    strm.adler = state.check = 1;
                    state.mode = TYPE;
                case TYPE:
                    if (flush === Z_BLOCK || flush === Z_TREES) {
                        break inf_leave;
                    }
                case TYPEDO:
                    if (state.last) {
                        hold >>>= bits & 7;
                        bits -= bits & 7;
                        state.mode = CHECK;
                        break;
                    }
                    while (bits < 3) {
                        if (have === 0) {
                            break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    state.last = hold & 1;
                    hold >>>= 1;
                    bits -= 1;
                    switch (hold & 3) {
                    case 0:
                        state.mode = STORED;
                        break;
                    case 1:
                        fixedtables(state);
                        state.mode = LEN_;
                        if (flush === Z_TREES) {
                            hold >>>= 2;
                            bits -= 2;
                            break inf_leave;
                        }
                        break;
                    case 2:
                        state.mode = TABLE;
                        break;
                    case 3:
                        strm.msg = 'invalid block type';
                        state.mode = BAD;
                    }
                    hold >>>= 2;
                    bits -= 2;
                    break;
                case STORED:
                    hold >>>= bits & 7;
                    bits -= bits & 7;
                    while (bits < 32) {
                        if (have === 0) {
                            break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    if ((hold & 65535) !== (hold >>> 16 ^ 65535)) {
                        strm.msg = 'invalid stored block lengths';
                        state.mode = BAD;
                        break;
                    }
                    state.length = hold & 65535;
                    hold = 0;
                    bits = 0;
                    state.mode = COPY_;
                    if (flush === Z_TREES) {
                        break inf_leave;
                    }
                case COPY_:
                    state.mode = COPY;
                case COPY:
                    copy = state.length;
                    if (copy) {
                        if (copy > have) {
                            copy = have;
                        }
                        if (copy > left) {
                            copy = left;
                        }
                        if (copy === 0) {
                            break inf_leave;
                        }
                        output.set(input.subarray(next, next + copy), put);
                        have -= copy;
                        next += copy;
                        left -= copy;
                        put += copy;
                        state.length -= copy;
                        break;
                    }
                    state.mode = TYPE;
                    break;
                case TABLE:
                    while (bits < 14) {
                        if (have === 0) {
                            break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    state.nlen = (hold & 31) + 257;
                    hold >>>= 5;
                    bits -= 5;
                    state.ndist = (hold & 31) + 1;
                    hold >>>= 5;
                    bits -= 5;
                    state.ncode = (hold & 15) + 4;
                    hold >>>= 4;
                    bits -= 4;
                    if (state.nlen > 286 || state.ndist > 30) {
                        strm.msg = 'too many length or distance symbols';
                        state.mode = BAD;
                        break;
                    }
                    state.have = 0;
                    state.mode = LENLENS;
                case LENLENS:
                    while (state.have < state.ncode) {
                        while (bits < 3) {
                            if (have === 0) {
                                break inf_leave;
                            }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        state.lens[order[state.have++]] = hold & 7;
                        hold >>>= 3;
                        bits -= 3;
                    }
                    while (state.have < 19) {
                        state.lens[order[state.have++]] = 0;
                    }
                    state.lencode = state.lendyn;
                    state.lenbits = 7;
                    opts = { bits: state.lenbits };
                    ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
                    state.lenbits = opts.bits;
                    if (ret) {
                        strm.msg = 'invalid code lengths set';
                        state.mode = BAD;
                        break;
                    }
                    state.have = 0;
                    state.mode = CODELENS;
                case CODELENS:
                    while (state.have < state.nlen + state.ndist) {
                        for (;;) {
                            here = state.lencode[hold & (1 << state.lenbits) - 1];
                            here_bits = here >>> 24;
                            here_op = here >>> 16 & 255;
                            here_val = here & 65535;
                            if (here_bits <= bits) {
                                break;
                            }
                            if (have === 0) {
                                break inf_leave;
                            }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        if (here_val < 16) {
                            hold >>>= here_bits;
                            bits -= here_bits;
                            state.lens[state.have++] = here_val;
                        } else {
                            if (here_val === 16) {
                                n = here_bits + 2;
                                while (bits < n) {
                                    if (have === 0) {
                                        break inf_leave;
                                    }
                                    have--;
                                    hold += input[next++] << bits;
                                    bits += 8;
                                }
                                hold >>>= here_bits;
                                bits -= here_bits;
                                if (state.have === 0) {
                                    strm.msg = 'invalid bit length repeat';
                                    state.mode = BAD;
                                    break;
                                }
                                len = state.lens[state.have - 1];
                                copy = 3 + (hold & 3);
                                hold >>>= 2;
                                bits -= 2;
                            } else if (here_val === 17) {
                                n = here_bits + 3;
                                while (bits < n) {
                                    if (have === 0) {
                                        break inf_leave;
                                    }
                                    have--;
                                    hold += input[next++] << bits;
                                    bits += 8;
                                }
                                hold >>>= here_bits;
                                bits -= here_bits;
                                len = 0;
                                copy = 3 + (hold & 7);
                                hold >>>= 3;
                                bits -= 3;
                            } else {
                                n = here_bits + 7;
                                while (bits < n) {
                                    if (have === 0) {
                                        break inf_leave;
                                    }
                                    have--;
                                    hold += input[next++] << bits;
                                    bits += 8;
                                }
                                hold >>>= here_bits;
                                bits -= here_bits;
                                len = 0;
                                copy = 11 + (hold & 127);
                                hold >>>= 7;
                                bits -= 7;
                            }
                            if (state.have + copy > state.nlen + state.ndist) {
                                strm.msg = 'invalid bit length repeat';
                                state.mode = BAD;
                                break;
                            }
                            while (copy--) {
                                state.lens[state.have++] = len;
                            }
                        }
                    }
                    if (state.mode === BAD) {
                        break;
                    }
                    if (state.lens[256] === 0) {
                        strm.msg = 'invalid code -- missing end-of-block';
                        state.mode = BAD;
                        break;
                    }
                    state.lenbits = 9;
                    opts = { bits: state.lenbits };
                    ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
                    state.lenbits = opts.bits;
                    if (ret) {
                        strm.msg = 'invalid literal/lengths set';
                        state.mode = BAD;
                        break;
                    }
                    state.distbits = 6;
                    state.distcode = state.distdyn;
                    opts = { bits: state.distbits };
                    ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
                    state.distbits = opts.bits;
                    if (ret) {
                        strm.msg = 'invalid distances set';
                        state.mode = BAD;
                        break;
                    }
                    state.mode = LEN_;
                    if (flush === Z_TREES) {
                        break inf_leave;
                    }
                case LEN_:
                    state.mode = LEN;
                case LEN:
                    if (have >= 6 && left >= 258) {
                        strm.next_out = put;
                        strm.avail_out = left;
                        strm.next_in = next;
                        strm.avail_in = have;
                        state.hold = hold;
                        state.bits = bits;
                        inflate_fast(strm, _out);
                        put = strm.next_out;
                        output = strm.output;
                        left = strm.avail_out;
                        next = strm.next_in;
                        input = strm.input;
                        have = strm.avail_in;
                        hold = state.hold;
                        bits = state.bits;
                        if (state.mode === TYPE) {
                            state.back = -1;
                        }
                        break;
                    }
                    state.back = 0;
                    for (;;) {
                        here = state.lencode[hold & (1 << state.lenbits) - 1];
                        here_bits = here >>> 24;
                        here_op = here >>> 16 & 255;
                        here_val = here & 65535;
                        if (here_bits <= bits) {
                            break;
                        }
                        if (have === 0) {
                            break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    if (here_op && (here_op & 240) === 0) {
                        last_bits = here_bits;
                        last_op = here_op;
                        last_val = here_val;
                        for (;;) {
                            here = state.lencode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                            here_bits = here >>> 24;
                            here_op = here >>> 16 & 255;
                            here_val = here & 65535;
                            if (last_bits + here_bits <= bits) {
                                break;
                            }
                            if (have === 0) {
                                break inf_leave;
                            }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        hold >>>= last_bits;
                        bits -= last_bits;
                        state.back += last_bits;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    state.back += here_bits;
                    state.length = here_val;
                    if (here_op === 0) {
                        state.mode = LIT;
                        break;
                    }
                    if (here_op & 32) {
                        state.back = -1;
                        state.mode = TYPE;
                        break;
                    }
                    if (here_op & 64) {
                        strm.msg = 'invalid literal/length code';
                        state.mode = BAD;
                        break;
                    }
                    state.extra = here_op & 15;
                    state.mode = LENEXT;
                case LENEXT:
                    if (state.extra) {
                        n = state.extra;
                        while (bits < n) {
                            if (have === 0) {
                                break inf_leave;
                            }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        state.length += hold & (1 << state.extra) - 1;
                        hold >>>= state.extra;
                        bits -= state.extra;
                        state.back += state.extra;
                    }
                    state.was = state.length;
                    state.mode = DIST;
                case DIST:
                    for (;;) {
                        here = state.distcode[hold & (1 << state.distbits) - 1];
                        here_bits = here >>> 24;
                        here_op = here >>> 16 & 255;
                        here_val = here & 65535;
                        if (here_bits <= bits) {
                            break;
                        }
                        if (have === 0) {
                            break inf_leave;
                        }
                        have--;
                        hold += input[next++] << bits;
                        bits += 8;
                    }
                    if ((here_op & 240) === 0) {
                        last_bits = here_bits;
                        last_op = here_op;
                        last_val = here_val;
                        for (;;) {
                            here = state.distcode[last_val + ((hold & (1 << last_bits + last_op) - 1) >> last_bits)];
                            here_bits = here >>> 24;
                            here_op = here >>> 16 & 255;
                            here_val = here & 65535;
                            if (last_bits + here_bits <= bits) {
                                break;
                            }
                            if (have === 0) {
                                break inf_leave;
                            }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        hold >>>= last_bits;
                        bits -= last_bits;
                        state.back += last_bits;
                    }
                    hold >>>= here_bits;
                    bits -= here_bits;
                    state.back += here_bits;
                    if (here_op & 64) {
                        strm.msg = 'invalid distance code';
                        state.mode = BAD;
                        break;
                    }
                    state.offset = here_val;
                    state.extra = here_op & 15;
                    state.mode = DISTEXT;
                case DISTEXT:
                    if (state.extra) {
                        n = state.extra;
                        while (bits < n) {
                            if (have === 0) {
                                break inf_leave;
                            }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        state.offset += hold & (1 << state.extra) - 1;
                        hold >>>= state.extra;
                        bits -= state.extra;
                        state.back += state.extra;
                    }
                    if (state.offset > state.dmax) {
                        strm.msg = 'invalid distance too far back';
                        state.mode = BAD;
                        break;
                    }
                    state.mode = MATCH;
                case MATCH:
                    if (left === 0) {
                        break inf_leave;
                    }
                    copy = _out - left;
                    if (state.offset > copy) {
                        copy = state.offset - copy;
                        if (copy > state.whave) {
                            if (state.sane) {
                                strm.msg = 'invalid distance too far back';
                                state.mode = BAD;
                                break;
                            }
                        }
                        if (copy > state.wnext) {
                            copy -= state.wnext;
                            from = state.wsize - copy;
                        } else {
                            from = state.wnext - copy;
                        }
                        if (copy > state.length) {
                            copy = state.length;
                        }
                        from_source = state.window;
                    } else {
                        from_source = output;
                        from = put - state.offset;
                        copy = state.length;
                    }
                    if (copy > left) {
                        copy = left;
                    }
                    left -= copy;
                    state.length -= copy;
                    do {
                        output[put++] = from_source[from++];
                    } while (--copy);
                    if (state.length === 0) {
                        state.mode = LEN;
                    }
                    break;
                case LIT:
                    if (left === 0) {
                        break inf_leave;
                    }
                    output[put++] = state.length;
                    left--;
                    state.mode = LEN;
                    break;
                case CHECK:
                    if (state.wrap) {
                        while (bits < 32) {
                            if (have === 0) {
                                break inf_leave;
                            }
                            have--;
                            hold |= input[next++] << bits;
                            bits += 8;
                        }
                        _out -= left;
                        strm.total_out += _out;
                        state.total += _out;
                        if (_out) {
                            strm.adler = state.check = state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out);
                        }
                        _out = left;
                        if ((state.flags ? hold : zswap32(hold)) !== state.check) {
                            strm.msg = 'incorrect data check';
                            state.mode = BAD;
                            break;
                        }
                        hold = 0;
                        bits = 0;
                    }
                    state.mode = LENGTH;
                case LENGTH:
                    if (state.wrap && state.flags) {
                        while (bits < 32) {
                            if (have === 0) {
                                break inf_leave;
                            }
                            have--;
                            hold += input[next++] << bits;
                            bits += 8;
                        }
                        if (hold !== (state.total & 4294967295)) {
                            strm.msg = 'incorrect length check';
                            state.mode = BAD;
                            break;
                        }
                        hold = 0;
                        bits = 0;
                    }
                    state.mode = DONE;
                case DONE:
                    ret = Z_STREAM_END;
                    break inf_leave;
                case BAD:
                    ret = Z_DATA_ERROR;
                    break inf_leave;
                case MEM:
                    return Z_MEM_ERROR;
                case SYNC:
                default:
                    return Z_STREAM_ERROR;
                }
            }
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        if (state.wsize || _out !== strm.avail_out && state.mode < BAD && (state.mode < CHECK || flush !== Z_FINISH)) {
            if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
                state.mode = MEM;
                return Z_MEM_ERROR;
            }
        }
        _in -= strm.avail_in;
        _out -= strm.avail_out;
        strm.total_in += _in;
        strm.total_out += _out;
        state.total += _out;
        if (state.wrap && _out) {
            strm.adler = state.check = state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out);
        }
        strm.data_type = state.bits + (state.last ? 64 : 0) + (state.mode === TYPE ? 128 : 0) + (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
        if ((_in === 0 && _out === 0 || flush === Z_FINISH) && ret === Z_OK) {
            ret = Z_BUF_ERROR;
        }
        return ret;
    };
    const inflateEnd = strm => {
        if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
        }
        let state = strm.state;
        if (state.window) {
            state.window = null;
        }
        strm.state = null;
        return Z_OK;
    };
    const inflateGetHeader = (strm, head) => {
        if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
        }
        const state = strm.state;
        if ((state.wrap & 2) === 0) {
            return Z_STREAM_ERROR;
        }
        state.head = head;
        head.done = false;
        return Z_OK;
    };
    const inflateSetDictionary = (strm, dictionary) => {
        const dictLength = dictionary.length;
        let state;
        let dictid;
        let ret;
        if (!strm || !strm.state) {
            return Z_STREAM_ERROR;
        }
        state = strm.state;
        if (state.wrap !== 0 && state.mode !== DICT) {
            return Z_STREAM_ERROR;
        }
        if (state.mode === DICT) {
            dictid = 1;
            dictid = adler32(dictid, dictionary, dictLength, 0);
            if (dictid !== state.check) {
                return Z_DATA_ERROR;
            }
        }
        ret = updatewindow(strm, dictionary, dictLength, dictLength);
        if (ret) {
            state.mode = MEM;
            return Z_MEM_ERROR;
        }
        state.havedict = 1;
        return Z_OK;
    };


    return {
        inflateReset,
        inflateReset2,
        inflateResetKeep,
        inflateInit,
        inflateInit2,
        inflate,
        inflateEnd,
        inflateGetHeader,
        inflateSetDictionary,
        inflateInfo : 'pako inflate (from Nodeca project)'
    };
});