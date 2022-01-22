/**
 * skylark-data-compression - The skylark compression utility library
 * @author Hudaokeji Co.,Ltd
 * @version v0.9.0
 * @link www.skylarkjs.org
 * @license MIT
 */
define(["./adler32","./crc32","./inffast","./inftrees","./constants"],function(e,t,a,i,s){"use strict";const{Z_FINISH:n,Z_BLOCK:r,Z_TREES:o,Z_OK:l,Z_STREAM_END:d,Z_NEED_DICT:c,Z_STREAM_ERROR:f,Z_DATA_ERROR:h,Z_MEM_ERROR:b,Z_BUF_ERROR:k,Z_DEFLATED:m}=__module__4,w=e=>(e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24);const u=e=>{if(!e||!e.state)return f;const t=e.state;return e.total_in=e.total_out=t.total=0,e.msg="",t.wrap&&(e.adler=1&t.wrap),t.mode=1,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new Int32Array(852),t.distcode=t.distdyn=new Int32Array(592),t.sane=1,t.back=-1,l},g=e=>{if(!e||!e.state)return f;const t=e.state;return t.wsize=0,t.whave=0,t.wnext=0,u(e)},_=(e,t)=>{let a;if(!e||!e.state)return f;const i=e.state;return t<0?(a=0,t=-t):(a=1+(t>>4),t<48&&(t&=15)),t&&(t<8||t>15)?f:(null!==i.window&&i.wbits!==t&&(i.window=null),i.wrap=a,i.wbits=t,g(e))},x=(e,t)=>{if(!e)return f;const a=new function(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new Uint16Array(320),this.work=new Uint16Array(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0};e.state=a,a.window=null;const i=_(e,t);return i!==l&&(e.state=null),i};let v,p,y=!0;const R=e=>{if(y){v=new Int32Array(512),p=new Int32Array(32);let t=0;for(;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(i(1,e.lens,0,288,v,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;i(2,e.lens,0,32,p,0,e.work,{bits:5}),y=!1}e.lencode=v,e.lenbits=9,e.distcode=p,e.distbits=5},A=(e,t,a,i)=>{let s;const n=e.state;return null===n.window&&(n.wsize=1<<n.wbits,n.wnext=0,n.whave=0,n.window=new Uint8Array(n.wsize)),i>=n.wsize?(n.window.set(t.subarray(a-n.wsize,a),0),n.wnext=0,n.whave=n.wsize):((s=n.wsize-n.wnext)>i&&(s=i),n.window.set(t.subarray(a-i,a-i+s),n.wnext),(i-=s)?(n.window.set(t.subarray(a-i,a),0),n.wnext=i,n.whave=n.wsize):(n.wnext+=s,n.wnext===n.wsize&&(n.wnext=0),n.whave<n.wsize&&(n.whave+=s))),0};return{inflateReset:g,inflateReset2:_,inflateResetKeep:u,inflateInit:e=>x(e,15),inflateInit2:x,inflate:(s,u)=>{let g,_,x,v,p,y,E,z,Z,I,D,S,U,C,O,T,M,N,F,K,B,H,L=0;const j=new Uint8Array(4);let G,q;const J=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]);if(!s||!s.state||!s.output||!s.input&&0!==s.avail_in)return f;12===(g=s.state).mode&&(g.mode=13),p=s.next_out,x=s.output,E=s.avail_out,v=s.next_in,_=s.input,y=s.avail_in,z=g.hold,Z=g.bits,I=y,D=E,H=l;e:for(;;)switch(g.mode){case 1:if(0===g.wrap){g.mode=13;break}for(;Z<16;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}if(2&g.wrap&&35615===z){g.check=0,j[0]=255&z,j[1]=z>>>8&255,g.check=t(g.check,j,2,0),z=0,Z=0,g.mode=2;break}if(g.flags=0,g.head&&(g.head.done=!1),!(1&g.wrap)||(((255&z)<<8)+(z>>8))%31){s.msg="incorrect header check",g.mode=30;break}if((15&z)!==m){s.msg="unknown compression method",g.mode=30;break}if(Z-=4,B=8+(15&(z>>>=4)),0===g.wbits)g.wbits=B;else if(B>g.wbits){s.msg="invalid window size",g.mode=30;break}g.dmax=1<<g.wbits,s.adler=g.check=1,g.mode=512&z?10:12,z=0,Z=0;break;case 2:for(;Z<16;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}if(g.flags=z,(255&g.flags)!==m){s.msg="unknown compression method",g.mode=30;break}if(57344&g.flags){s.msg="unknown header flags set",g.mode=30;break}g.head&&(g.head.text=z>>8&1),512&g.flags&&(j[0]=255&z,j[1]=z>>>8&255,g.check=t(g.check,j,2,0)),z=0,Z=0,g.mode=3;case 3:for(;Z<32;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}g.head&&(g.head.time=z),512&g.flags&&(j[0]=255&z,j[1]=z>>>8&255,j[2]=z>>>16&255,j[3]=z>>>24&255,g.check=t(g.check,j,4,0)),z=0,Z=0,g.mode=4;case 4:for(;Z<16;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}g.head&&(g.head.xflags=255&z,g.head.os=z>>8),512&g.flags&&(j[0]=255&z,j[1]=z>>>8&255,g.check=t(g.check,j,2,0)),z=0,Z=0,g.mode=5;case 5:if(1024&g.flags){for(;Z<16;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}g.length=z,g.head&&(g.head.extra_len=z),512&g.flags&&(j[0]=255&z,j[1]=z>>>8&255,g.check=t(g.check,j,2,0)),z=0,Z=0}else g.head&&(g.head.extra=null);g.mode=6;case 6:if(1024&g.flags&&((S=g.length)>y&&(S=y),S&&(g.head&&(B=g.head.extra_len-g.length,g.head.extra||(g.head.extra=new Uint8Array(g.head.extra_len)),g.head.extra.set(_.subarray(v,v+S),B)),512&g.flags&&(g.check=t(g.check,_,S,v)),y-=S,v+=S,g.length-=S),g.length))break e;g.length=0,g.mode=7;case 7:if(2048&g.flags){if(0===y)break e;S=0;do{B=_[v+S++],g.head&&B&&g.length<65536&&(g.head.name+=String.fromCharCode(B))}while(B&&S<y);if(512&g.flags&&(g.check=t(g.check,_,S,v)),y-=S,v+=S,B)break e}else g.head&&(g.head.name=null);g.length=0,g.mode=8;case 8:if(4096&g.flags){if(0===y)break e;S=0;do{B=_[v+S++],g.head&&B&&g.length<65536&&(g.head.comment+=String.fromCharCode(B))}while(B&&S<y);if(512&g.flags&&(g.check=t(g.check,_,S,v)),y-=S,v+=S,B)break e}else g.head&&(g.head.comment=null);g.mode=9;case 9:if(512&g.flags){for(;Z<16;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}if(z!==(65535&g.check)){s.msg="header crc mismatch",g.mode=30;break}z=0,Z=0}g.head&&(g.head.hcrc=g.flags>>9&1,g.head.done=!0),s.adler=g.check=0,g.mode=12;break;case 10:for(;Z<32;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}s.adler=g.check=w(z),z=0,Z=0,g.mode=11;case 11:if(0===g.havedict)return s.next_out=p,s.avail_out=E,s.next_in=v,s.avail_in=y,g.hold=z,g.bits=Z,c;s.adler=g.check=1,g.mode=12;case 12:if(u===r||u===o)break e;case 13:if(g.last){z>>>=7&Z,Z-=7&Z,g.mode=27;break}for(;Z<3;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}switch(g.last=1&z,Z-=1,3&(z>>>=1)){case 0:g.mode=14;break;case 1:if(R(g),g.mode=20,u===o){z>>>=2,Z-=2;break e}break;case 2:g.mode=17;break;case 3:s.msg="invalid block type",g.mode=30}z>>>=2,Z-=2;break;case 14:for(z>>>=7&Z,Z-=7&Z;Z<32;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}if((65535&z)!=(z>>>16^65535)){s.msg="invalid stored block lengths",g.mode=30;break}if(g.length=65535&z,z=0,Z=0,g.mode=15,u===o)break e;case 15:g.mode=16;case 16:if(S=g.length){if(S>y&&(S=y),S>E&&(S=E),0===S)break e;x.set(_.subarray(v,v+S),p),y-=S,v+=S,E-=S,p+=S,g.length-=S;break}g.mode=12;break;case 17:for(;Z<14;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}if(g.nlen=257+(31&z),z>>>=5,Z-=5,g.ndist=1+(31&z),z>>>=5,Z-=5,g.ncode=4+(15&z),z>>>=4,Z-=4,g.nlen>286||g.ndist>30){s.msg="too many length or distance symbols",g.mode=30;break}g.have=0,g.mode=18;case 18:for(;g.have<g.ncode;){for(;Z<3;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}g.lens[J[g.have++]]=7&z,z>>>=3,Z-=3}for(;g.have<19;)g.lens[J[g.have++]]=0;if(g.lencode=g.lendyn,g.lenbits=7,G={bits:g.lenbits},H=i(0,g.lens,0,19,g.lencode,0,g.work,G),g.lenbits=G.bits,H){s.msg="invalid code lengths set",g.mode=30;break}g.have=0,g.mode=19;case 19:for(;g.have<g.nlen+g.ndist;){for(;T=(L=g.lencode[z&(1<<g.lenbits)-1])>>>16&255,M=65535&L,!((O=L>>>24)<=Z);){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}if(M<16)z>>>=O,Z-=O,g.lens[g.have++]=M;else{if(16===M){for(q=O+2;Z<q;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}if(z>>>=O,Z-=O,0===g.have){s.msg="invalid bit length repeat",g.mode=30;break}B=g.lens[g.have-1],S=3+(3&z),z>>>=2,Z-=2}else if(17===M){for(q=O+3;Z<q;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}Z-=O,B=0,S=3+(7&(z>>>=O)),z>>>=3,Z-=3}else{for(q=O+7;Z<q;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}Z-=O,B=0,S=11+(127&(z>>>=O)),z>>>=7,Z-=7}if(g.have+S>g.nlen+g.ndist){s.msg="invalid bit length repeat",g.mode=30;break}for(;S--;)g.lens[g.have++]=B}}if(30===g.mode)break;if(0===g.lens[256]){s.msg="invalid code -- missing end-of-block",g.mode=30;break}if(g.lenbits=9,G={bits:g.lenbits},H=i(1,g.lens,0,g.nlen,g.lencode,0,g.work,G),g.lenbits=G.bits,H){s.msg="invalid literal/lengths set",g.mode=30;break}if(g.distbits=6,g.distcode=g.distdyn,G={bits:g.distbits},H=i(2,g.lens,g.nlen,g.ndist,g.distcode,0,g.work,G),g.distbits=G.bits,H){s.msg="invalid distances set",g.mode=30;break}if(g.mode=20,u===o)break e;case 20:g.mode=21;case 21:if(y>=6&&E>=258){s.next_out=p,s.avail_out=E,s.next_in=v,s.avail_in=y,g.hold=z,g.bits=Z,a(s,D),p=s.next_out,x=s.output,E=s.avail_out,v=s.next_in,_=s.input,y=s.avail_in,z=g.hold,Z=g.bits,12===g.mode&&(g.back=-1);break}for(g.back=0;T=(L=g.lencode[z&(1<<g.lenbits)-1])>>>16&255,M=65535&L,!((O=L>>>24)<=Z);){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}if(T&&0==(240&T)){for(N=O,F=T,K=M;T=(L=g.lencode[K+((z&(1<<N+F)-1)>>N)])>>>16&255,M=65535&L,!(N+(O=L>>>24)<=Z);){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}z>>>=N,Z-=N,g.back+=N}if(z>>>=O,Z-=O,g.back+=O,g.length=M,0===T){g.mode=26;break}if(32&T){g.back=-1,g.mode=12;break}if(64&T){s.msg="invalid literal/length code",g.mode=30;break}g.extra=15&T,g.mode=22;case 22:if(g.extra){for(q=g.extra;Z<q;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}g.length+=z&(1<<g.extra)-1,z>>>=g.extra,Z-=g.extra,g.back+=g.extra}g.was=g.length,g.mode=23;case 23:for(;T=(L=g.distcode[z&(1<<g.distbits)-1])>>>16&255,M=65535&L,!((O=L>>>24)<=Z);){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}if(0==(240&T)){for(N=O,F=T,K=M;T=(L=g.distcode[K+((z&(1<<N+F)-1)>>N)])>>>16&255,M=65535&L,!(N+(O=L>>>24)<=Z);){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}z>>>=N,Z-=N,g.back+=N}if(z>>>=O,Z-=O,g.back+=O,64&T){s.msg="invalid distance code",g.mode=30;break}g.offset=M,g.extra=15&T,g.mode=24;case 24:if(g.extra){for(q=g.extra;Z<q;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}g.offset+=z&(1<<g.extra)-1,z>>>=g.extra,Z-=g.extra,g.back+=g.extra}if(g.offset>g.dmax){s.msg="invalid distance too far back",g.mode=30;break}g.mode=25;case 25:if(0===E)break e;if(S=D-E,g.offset>S){if((S=g.offset-S)>g.whave&&g.sane){s.msg="invalid distance too far back",g.mode=30;break}S>g.wnext?(S-=g.wnext,U=g.wsize-S):U=g.wnext-S,S>g.length&&(S=g.length),C=g.window}else C=x,U=p-g.offset,S=g.length;S>E&&(S=E),E-=S,g.length-=S;do{x[p++]=C[U++]}while(--S);0===g.length&&(g.mode=21);break;case 26:if(0===E)break e;x[p++]=g.length,E--,g.mode=21;break;case 27:if(g.wrap){for(;Z<32;){if(0===y)break e;y--,z|=_[v++]<<Z,Z+=8}if(D-=E,s.total_out+=D,g.total+=D,D&&(s.adler=g.check=g.flags?t(g.check,x,D,p-D):e(g.check,x,D,p-D)),D=E,(g.flags?z:w(z))!==g.check){s.msg="incorrect data check",g.mode=30;break}z=0,Z=0}g.mode=28;case 28:if(g.wrap&&g.flags){for(;Z<32;){if(0===y)break e;y--,z+=_[v++]<<Z,Z+=8}if(z!==(4294967295&g.total)){s.msg="incorrect length check",g.mode=30;break}z=0,Z=0}g.mode=29;case 29:H=d;break e;case 30:H=h;break e;case 31:return b;case 32:default:return f}return s.next_out=p,s.avail_out=E,s.next_in=v,s.avail_in=y,g.hold=z,g.bits=Z,(g.wsize||D!==s.avail_out&&g.mode<30&&(g.mode<27||u!==n))&&A(s,s.output,s.next_out,D-s.avail_out)?(g.mode=31,b):(I-=s.avail_in,D-=s.avail_out,s.total_in+=I,s.total_out+=D,g.total+=D,g.wrap&&D&&(s.adler=g.check=g.flags?t(g.check,x,D,s.next_out-D):e(g.check,x,D,s.next_out-D)),s.data_type=g.bits+(g.last?64:0)+(12===g.mode?128:0)+(20===g.mode||15===g.mode?256:0),(0===I&&0===D||u===n)&&H===l&&(H=k),H)},inflateEnd:e=>{if(!e||!e.state)return f;let t=e.state;return t.window&&(t.window=null),e.state=null,l},inflateGetHeader:(e,t)=>{if(!e||!e.state)return f;const a=e.state;return 0==(2&a.wrap)?f:(a.head=t,t.done=!1,l)},inflateSetDictionary:(t,a)=>{const i=a.length;let s,n,r;return t&&t.state?0!==(s=t.state).wrap&&11!==s.mode?f:11===s.mode&&(n=e(n=1,a,i,0))!==s.check?h:(r=A(t,a,i,i))?(s.mode=31,b):(s.havedict=1,l):f},inflateInfo:"pako inflate (from Nodeca project)"}});
//# sourceMappingURL=../sourcemaps/zlib/inflate.js.map
