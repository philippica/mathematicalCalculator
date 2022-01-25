!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.mathematica=t():e.mathematica=t()}(this,(function(){return(()=>{"use strict";var e={d:(t,i)=>{for(var s in i)e.o(i,s)&&!e.o(t,s)&&Object.defineProperty(t,s,{enumerable:!0,get:i[s]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},t={};e.r(t),e.d(t,{Lexical:()=>d});class i{constructor(e,t,i){this.symbols=new Set,this.child=t,this.value=i,this.type=e}}class s{static _base=10;static compressDegree=4;static realBase=this._base**this.compressDegree;constructor(e){this.rawDec=[],this.decimal=[],this.positive=!0,e&&this.parse(e)}clone(){const e=new s(this.rawDec);return e.positive=this.positive,e}parseNumber(e){e<0&&(this.positive=!1,e=-e);let t=e;for(this.rawDec=[];0!==t;)this.rawDec.push(t%s.realBase),t=parseInt(t/s.realBase,s._base)}parseString(e){"-"===e[0]&&(e=e.slice(1),this.positive=!1);const t=this.trimLeadingZero(e);let i;for(i=0;i<t.length&&"."!==t[i];i++);const n=[t.slice(0,i)];this.rawDec=[];let r=n[0].length-1,o=0;const a=n[0];for(;r>=0;){this.rawDec.push(0),o=this.rawDec.length-1;const e=s.compressDegree,t=s._base;let n=0;for(i=e-1;i>=0;i--)n=n*t+parseInt(a[r-i]??0,t);this.rawDec[o]=n,r-=e}}parse(e){if(Array.isArray(e))this.rawDec=e;else switch(typeof e){case"number":this.parseNumber(e),this.positive=e>0;break;case"string":this.parseString(e)}}trimLeadingZero(e){let t=0;for(;"0"===e[t];)t++;return""===e.slice(t)?"0":e.slice(t)}toString(){if(this.isZero())return"0";const e=this.rawDec.slice(0);let t="";for(;e.length>0;){let i=e.pop(),n="";for(let e=0;e<s.compressDegree;e++)n=(i%s._base).toString()+n,i=parseInt(i/s._base,s._base);t+=n}return t=this.trimLeadingZero(t),!1===this.positive&&(t=`-${t}`),t}inverse(){const e=new s(this.rawDec);return e.positive=!this.positive,e}linearOp(e,t,i,n){const r=s.realBase;let o=0,a=this.rawDec,l=e.rawDec;const c=[];if(n){const e=a;a=l,l=e}for(let e=0;e<a.length||e<l.length;e++){const s=a[e]??0,n=l[e]??0,h=(t(s,n,o)+r)%r;c.push(h),o=i(t(s,n,o))}for(c.push(o);0===c[c.length-1]&&c.length>1;)c.pop();return new s(c)}add(e){let t=e;return"number"!=typeof e&&"string"!=typeof e||(t=new s(e)),this.positive&&t.positive?this.linearOp(t,((e,t,i)=>e+t+i),(e=>e>=s.realBase?1:0)):this.positive||t.positive?this.positive?this.minus(t.inverse()):t.minus(this.inverse()):this.linearOp(t,((e,t,i)=>e+t+i),(e=>e>=s.realBase?1:0)).inverse()}isZero(){for(const e of this.rawDec)if(0!==e)return!1;return!0}minus(e){let t=e;if("number"!=typeof e&&"string"!=typeof e||(t=new s(e)),!this.positive&&!t.positive)return t.inverse().minus(this);if(!this.positive&&t.positive)return this.inverse().add(t).inverse();if(this.positive&&!t.positive)return this.add(t.inverse());const i=!this.largerThan(t),n=this.linearOp(t,((e,t,i)=>e-t-i),(e=>e<0?1:0),i);for(i&&(n.positive=!1);0===n.rawDec[n.rawDec.length-1]&&n.rawDec.length>1;)n.rawDec.pop();return n}multiply(e){let t=e;"number"!=typeof e&&"string"!=typeof e||(t=new s(e));const i=s.realBase,n=[],r=t.rawDec.length,o=this.rawDec.length,a=r+o+1;for(let e=1;e<=a;e++)n.push(0);for(let e=0;e<r;e++)for(let s=0;s<o;s++){const r=n[e+s]+t.rawDec[e]*this.rawDec[s];n[e+s]=r%i;const o=parseInt(r/i,10);o&&(n[e+s+1]+=o)}const l=new s(n);for(l.positive=!(this.positive^t.positive);0===l.rawDec[l.rawDec.length-1]&&l.rawDec.length>1;)l.rawDec.pop();return l}divide(e){const t=(e,t,i)=>{let s=0;for(;;){const n=i.minus(e);if(!n.positive&&!n.isZero())break;s+=t,i=n}return[s,i]};let i=e;"number"!=typeof e&&"string"!=typeof e||(i=new s(e));const n=this.rawDec.length-i.rawDec.length;if(n<0)return{quotient:new s(0),remainder:this};let r=new s(this.rawDec.slice(n)),o="";const a=new s;a.rawDec.push(1e3);const l=new s;l.rawDec.push(100);const c=new s;c.rawDec.push(10);for(let e=n;e>=0;e--){let n=0,[h,u]=t(i.multiply(a),1e3,r);n+=h,r=u,[h,u]=t(i.multiply(l),100,r),n+=h,r=u,[h,u]=t(i.multiply(c),10,r),n+=h,r=u,[h,u]=t(i,1,r),n+=h,r=u;let p=n.toString();for(;p.length<s.compressDegree;)p=`0${p}`;for(o+=p,e>0&&(r.rawDec.unshift(0),r.rawDec[0]=this.rawDec[e-1]);0===r.rawDec[r.rawDec.length-1]&&r.rawDec.length>1;)r.rawDec.pop();r.positive=!0}const h=new s(o);return h.positive=!(this.positive^i.positive),{quotient:h,remainder:r}}largerThan(e){let t=e;for("number"!=typeof e&&"string"!=typeof e||(t=new s(e));0===t.rawDec[t.rawDec.length-1]&&t.rawDec.length>1;)t.rawDec.pop();for(;0===this.rawDec[this.rawDec.length-1]&&this.rawDec.length>1;)this.rawDec.pop();if(t.rawDec.length!==this.rawDec.length)return this.rawDec.length>t.rawDec.length;for(let e=t.rawDec.length-1;e>=0;e--)if(this.rawDec[e]!==t.rawDec[e])return this.rawDec[e]>t.rawDec[e];return!1}isEqual(e){let t=e;for("number"!=typeof e&&"string"!=typeof e||(t=new s(e));0===t.rawDec[t.rawDec.length-1]&&t.rawDec.length>1;)t.rawDec.pop();for(;0===this.rawDec[this.rawDec.length-1]&&this.rawDec.length>1;)this.rawDec.pop();if(t.rawDec.length!==this.rawDec.length)return!1;for(let e=t.rawDec.length-1;e>=0;e--)if(this.rawDec[e]!==t.rawDec[e])return!1;return t.positive===this.positive}gcd(e){let t=e;"number"!=typeof e&&"string"!=typeof e||(t=new s(e));let i=this,n=t;for(;!n.isZero();){const e=i.divide(n).remainder;i=n,n=e}return i}}class n extends i{constructor(e){super("integer",null),e.rawDec&&(this.obj=e.toString(),this.value=e),this.obj=e}compute(){const e=this.clone();return e.value=this.value??new s(this.obj),e}toString(e){this.value||(this.value=new s(this.obj));let t=this.value.toString();return this.obj=t,!1!==this.value.positive||this.value.isZero()||e&&(t=`(${t})`),t}clone(){return new n(this.obj)}derivative(){return new n("0")}}class r extends i{constructor(e,t){super(e,t,null)}getSimplify(){return"positive"===this.type?this.child:"negative"===this.child.type?this.child.child:this}compute(){let e=this.child.compute();if("integer"===e.type)return e=e.compute(),"negative"===this.type&&(e.value.positive=!e.value.positive,e.obj=e.value.toString()),e;const t=new r(this.type,e);for(const i of e.symbols)t.symbols.add(i);return t.getSimplify()}toString(e){if(this.strRaw)return this.strRaw;const t=this.child.toString();return"positive"===this.type?this.strRaw=`+${t}`:"negative"===this.type&&(this.strRaw=`-${t}`),e?`(${this.strRaw})`:this.strRaw}clone(){return new r(this.type,this.child.clone())}derivative(e){return new r(this.type,this.child.derivative(e))}}class o extends i{constructor(e,t){super("function"),this.parameter=t,this.functionName=e}getSimplify(){let e=this;switch(this.functionName){case"sin":"negative"===this.parameter.type&&(e=new o("sin",this.parameter.child),e.symbols=this.symbols,e=new r("negative",e),e.symbols=this.symbols);break;case"exp":break;case"cos":"negative"===this.parameter.type&&(this.parameter=this.parameter.child);break;case"ln":if("Exponent"===this.parameter.type){e=new l(this.parameter.power);const t=new o("ln",this.parameter.base);e.add("multiply",t)}}return e}compute(){const e=this.clone();e.parameter=e.parameter.compute();for(const t of this.parameter.symbols)e.symbols.add(t);return e.getSimplify()}clone(){return new o(this.functionName,this.parameter.clone())}toString(){let e;return e="term"===this.parameter.type||"negative"===this.parameter.type?`${this.functionName}${this.parameter.toString()}`:`${this.functionName}(${this.parameter.toString()})`,e}functionDerivativeProcess(e){let t;switch(e.functionName){case"sin":e.functionName="cos",t=e;break;case"exp":e.functionName="exp",t=e;break;case"cos":e.functionName="sin",t=new r("negative",e);break;case"ln":t=new l(new n("1")),t.add("divide",e.parameter);break;default:e.functionName=`${e.functionName}'`,t=e}return t}derivative(e){const t=this.functionDerivativeProcess(this.clone()),i=new l(t);return i.add("multiply",this.parameter.derivative(e)),i}}class a extends i{constructor(e,t){super("Exponent",null),this.base=e,this.power=t}add(e){this.power=e}getSimplify(){return this.power?"integer"===this.power.type&&"1"===this.power?.obj?this.base:this:this.base}quickPower(e,t){if(t.isZero())return new s(1);if(1&t.rawDec[0])return e.multiply(this.quickPower(e,t.minus(1)));const i=this.quickPower(e,t.divide(2).quotient);return i.multiply(i)}compute(){const e=this.base.compute(),t=this.power.compute();if("integer"===e.type&&"integer"===t.type){let i=new s(1);if(!t.value.positive){const s=new l;return i=this.quickPower(e.value,t.value.inverse()),s.add("divide",new n(i.toString())),s}return i=this.quickPower(e.value,t.value),new n(i.toString())}const i=new a(e,t).getSimplify();for(const t of e.symbols)i.symbols.add(t);for(const e of t.symbols)i.symbols.add(e);return i.getSimplify()}toString(){if(this.strRaw)return this.strRaw;let e=this.base.toString(!0),t=this.power.toString(!0);return"Exponent"!==this.base.type&&"factor"!==this.base.type||(e=`(${e})`),"Exponent"!==this.power.type&&"factor"!==this.power.type||(t=`(${t})`),this.strRaw=`${e} ^ ${t}`,this.strRaw}clone(){return new a(this.base,this.power)}derivative(e){if(!this.base.symbols.has(e)&&!this.power.symbols.has(e))return new n("1");if(!this.power.symbols.has(e)){const e=new l;e.add("multiply",this.power.clone());const t=new c(this.power.clone());return t.add("minus",new n("1")),e.add("multiply",new a(this.base,t)),e}if(!this.base.symbols.has(e)){const e=new l;return e.add("multiply",this.power.derivative("x")),e.add("multiply",this.clone()),e.add("multiply",new o("ln",this.base.compute())),e}const t=new l(this.clone()),i=new l(this.power.clone());return i.add("multiply",new o("ln",this.base.compute())),t.add("multiply",i.derivative("x")),t.compute()}}class l extends i{constructor(e){super("factor",[]),e&&this.add("multiply",e)}add(e,t){this.child.push({type:e,value:t})}combine(){const e=new Map;this.child.forEach((t=>{let i=t.value.toString(),n=new s(1);"Exponent"===t.value.type&&"integer"===t.value.power.type&&(i=t.value.base.toString(),n=t.value.power.compute().value);const r=e.get(i);r?(e.set(i,r.add(n)),"multiply"===t.type?e.set(i,r.add(n)):e.set(i,r.minus(n))):"multiply"===t.type?e.set(i,n):e.set(i,n.inverse())}));const t=[];this.child.forEach((i=>{let r=i.value.toString(),o=i.value;"Exponent"===i.value.type&&"integer"===i.value.power.type&&(r=i.value.base.toString(),o=i.value.base);const l=e.get(r);if(!l.isZero()){if(l.isEqual(1))t.push({type:"multiply",value:o});else if(l.isEqual(-1))t.push({type:"divide",value:o});else{const e=new a(o);e.add(new n(l.toString())),i.value=e,i.type="multiply",t.push(i)}e.set(r,new s(0))}})),this.child=t}withoutCoefficient(){const e=new l;for(let t=0;t<this.child.length;t++){const i=this.child[t];"integer"===i.value.type&&"multiply"===i.type||e.add(i.type,i.value)}return e}getRidOfNestedFactor(){const e=this.child?.filter((e=>"factor"===e.value.type&&"multiply"===e.type));this.child=this.child?.filter((e=>"factor"!==e.value.type||"multiply"!==e.type)),e.forEach((e=>{e.value.child.forEach((e=>{this.child.push(e)}))}))}getSimplify(){this.getRidOfNestedFactor(),this.child=this.child?.filter((e=>"integer"!==e.value.type||"1"!==e.value?.obj));const e=this.child?.filter((e=>"integer"===e.value.type&&"0"===e.value?.obj));if(e.length>0)return new n("0").compute();if(0===this.child.length)return new n("1").compute();if(this.combine(),1===this.child.length&&"multiply"===this.child[0].type)return this.child[0].value;if(0===this.child.length)return new n("1").compute();let t=0;return this.child?.forEach((e=>{"negative"===e.value.type?(e.value=e.value.child,t++):"positive"===e.value.type?e.value=e.value.child:"integer"===e.value.type&&!1===e.value.compute().value.positive&&(e.value.value.positive=!0,e.value.obj=e.value.value.toString(),t++)})),this.child=this.child?.filter((e=>"integer"!==e.value.type||"1"!==e.value?.obj)),1&t?new r("negative",this):this}expand(e,t){const i=new c;return e.child.forEach((e=>{t.child.forEach((t=>{const s=new l;s.add("multiply",e.value),s.add("multiply",t.value),i.add(e.type===t.type?"add":"minus",s.compute())}))})),i}compute(){if(this.getRidOfNestedFactor(),i.isExpandFactor){const e=[],t=new l;for(let i=0;i<this.child.length;i++)"multiply"===this.child[i].type&&"term"===this.child[i].value.type?e.push(this.child[i].value.compute()):t.child.push(this.child[i]);if(this.child.filter((e=>"multiply"!==e.type||"term"!==e.value.type)),0!==e.length){const i=new c;for(let t=1;t<e.length;t++)e[0]=this.expand(e[0],e[t]);return e[0].child.forEach((e=>{const s=new l;s.add("multiply",e.value),s.add("multiply",t),i.add(e.type,s.compute())})),i.compute()}}const e=new l,t=this.child.filter((e=>"multiply"===e.type)).map((e=>e.value.compute())),s=this.child.filter((e=>"divide"===e.type)).map((e=>e.value.compute())),r=t.filter((e=>"integer"!==e.type));let o=t.filter((e=>"integer"===e.type)).reduce(((e,t)=>{const i=e.value.multiply(t.value),s=new n(i.toString());return s.value=i,s}),new n("1").compute());const a=s.filter((e=>"integer"!==e.type));let h=s.filter((e=>"integer"===e.type)).reduce(((e,t)=>{const i=e.value.multiply(t.value),s=new n(i.toString());return s.value=i,s}),new n("1").compute());const u=o.value.gcd(h.value);return u.rawDec&&1!==u.rawDec[0]&&(o=new n(o.value.divide(u).quotient.toString()),h=new n(h.value.divide(u).quotient.toString())),e.add("multiply",o),r.forEach((t=>{for(const i of t.symbols)e.symbols.add(i);e.add("multiply",t)})),e.add("divide",h),a.forEach((t=>{for(const i of t.symbols)e.symbols.add(i);e.add("divide",t)})),e.getSimplify()}derivative(e){const t=this.child.filter((e=>"multiply"===e.type)).map((e=>e.value.compute())),i=this.child.filter((e=>"divide"===e.type)).map((e=>e.value.compute()));let s=new c,r=new l;if(t.forEach((e=>{r.add("multiply",e)})),r=r.compute(),"factor"!==r.type)s=r.derivative("x").compute();else for(let i=0;i<t.length;i++){const t=r.clone();t.child[i].value=t.child[i].value.derivative(e).compute(),s.add("add",t)}if(s=s.compute(),0===i.length)return s.compute();let o=new l;i.forEach((e=>{o.add("multiply",e)})),o=o.compute();const h=o.derivative(e).compute(),u=new l(s);u.add("multiply",o);const p=new l(h);p.add("multiply",r);const d=new c(u);d.add("minus",p);const f=new a(o.clone(),new n("2")),v=new l(d.compute());return v.add("divide",f.compute()),v.compute()}clone(){const e=new l;for(let t=0;t<this.child.length;t++)e.add(this.child[t].type,this.child[t].value.clone());return e}toString(){if(this.strRaw)return this.strRaw;const e=this.child.filter((e=>"multiply"===e.type)),t=this.child.filter((e=>"divide"===e.type));let i;if(0===e.length){i="1";for(let e=0;e<t.length;e++)i+=` / ${t[e].value.toString(!0)}`;return i}i=e[0].value.toString(!0);for(let t=1;t<e.length;t++)i=`${i} * ${e[t].value.toString(!0)}`;for(let e=0;e<t.length;e++)i=`${i} / ${t[e].value.toString(!0)}`;return this.strRaw=i,this.strRaw}}class c extends i{constructor(e){super("term",[]),e&&this.add("add",e)}add(e,t){this.child.push({type:e,value:t})}combine(){const e=new Map;this.child.forEach((t=>{let i=1,s=t.value.toString();if("factor"===t.value.type){const e=t.value.child.filter((e=>"integer"===e.value.type&&"multiply"===e.type));1===e.length&&(s=t.value.withoutCoefficient().toString(),i=parseInt(e[0].value.obj))}const n=e.get(s);n?(e.set(s,n+i),"add"===t.type?e.set(s,n+i):e.set(s,n-i)):"add"===t.type?e.set(s,i):e.set(s,-i)}));const t=[];this.child.forEach((i=>{let s=i.value.toString(),r=i.value;if("factor"===i.value.type&&1===i.value.child.filter((e=>"integer"===e.value.type&&"multiply"===e.type)).length){const e=i.value.withoutCoefficient();s=e.toString(),r=e}const o=e.get(s);if(0!==o){if(1===o)i.type="add",t.push(i);else if(-1===o)i.type="minus",t.push(i);else{const e=new l;e.add("multiply",new n(o.toString())),e.add("multiply",r),i.value=e,i.type="add",t.push(i)}e.set(s,0)}})),this.child=t}getSimplify(){const e=this.child?.filter((e=>"term"===e.value.type&&"add"===e.type));return this.child=this.child?.filter((e=>"term"!==e.value.type||"add"!==e.type)),e.forEach((e=>{e.value.child.forEach((e=>{this.child.push(e)}))})),this.child=this.child?.filter((e=>"integer"!==e.value.type||!e.value?.value?.isZero())),this.combine(),1===this.child.length?"add"===this.child[0].type?this.child[0].value:new r("negative",this.child[0].value):0===this.child.length?new n("0").compute():(this.child.forEach((e=>{"positive"===e.value.type?e.value=e.value.child:"negative"===e.value.type&&(e.value=e.value.child,"add"===e.type?e.type="minus":e.type="add")})),this)}compute(){this.getSimplify();const e=new c,t=this.child.filter((e=>"add"===e.type)).map((e=>e.value.compute())),i=this.child.filter((e=>"minus"===e.type)).map((e=>e.value.compute())),s=i.filter((e=>"integer"!==e.type)),r=i.filter((e=>"integer"===e.type)).reduce(((e,t)=>{const i=e.value.add(t.compute().value),s=new n(i.toString());return s.value=i,s.compute()}),new n("0").compute());r.value.positive=!r.value.positive;const o=t.filter((e=>"integer"!==e.type)),a=t.filter((e=>"integer"===e.type)).reduce(((e,t)=>{const i=e.value.add(t.compute().value),s=new n(i.toString());return s.value=i,s.compute()}),r);return!0===a.value.positive?e.add("add",a):(a.value.positive=!0,a.obj=a.value.toString(),e.add("minus",a)),o.forEach((t=>{for(const i of t.symbols)e.symbols.add(i);e.add("add",t)})),s.forEach((t=>{for(const i of t.symbols)e.symbols.add(i);e.add("minus",t)})),e.getSimplify()}toString(e){if(this.strRaw)return e?`(${this.strRaw})`:this.strRaw;for(let e=0,t=0;e<this.child.length;e++)if("add"===this.child[e].type){if(e!==t){const i=this.child[e];this.child[e]=this.child[t],this.child[t]=i}t++}let t=this.child[0].value.toString();"minus"===this.child[0].type&&(t=`-${t}`);for(let e=1;e<this.child.length;e++){const i=this.child[e].value.toString();switch(this.child[e].type){case"add":t+=` + ${i}`;break;case"minus":t+=` - ${i}`}}return this.strRaw=t,e?`(${t})`:this.strRaw}clone(){const e=new c;for(let t=0;t<this.child.length;t++)e.add(this.child[t].type,this.child[t].value.clone());return e}derivative(e){const t=this.clone();return t.child=t.child.map((t=>(t.value=t.value.derivative(e),t))),t.getSimplify()}}class h extends i{constructor(e){super("symbol"),this.symbolName=e,this.symbols.add(e)}compute(){return this.clone()}toString(){return this.symbolName}clone(){return new h(this.symbolName)}getSimplify(){return this}derivative(e){let t;return t=this.symbolName===e?new n("1"):new n("0"),t}}class u{constructor(e,t){this.type=e,this.content=t}}class p{constructor(e,t,i,s){this.index=e,this.type=t,this.ast=i,this.value=s}}class d{constructor(e){this.symbols=new Set,this.tokens=[],e&&this.generateTokens(e)}setSym(e){this.symbols.add(e)}singleCharacterProcess(e){switch(e){case"+":case"-":case"*":case"/":return this.tokens.push(new u("sign",e)),0;case"(":case")":return this.tokens.push(new u("parentheses",e)),0;case"\t":case"\n":case" ":return 0}}vacantProcess(e){switch(e){case"+":case"-":case"*":case"/":case"^":case"=":return this.tokens.push(new u("sign",e)),0;case"(":case")":return this.tokens.push(new u("parentheses",e)),0;case"\t":case"\n":case" ":return 0}return/^[_a-zA-Z|\/|\\]$/.test(e)?(this.tokens.push(new u("function",e)),1):/^[0-9]$/.test(e)?(this.tokens.push(new u("integer",e)),2):void 0}receiveFuncProcess(e){if(/^[_0-9a-zA-Z|\\]$/.test(e)){const t=this.tokens.pop();return t.content+=e,this.tokens.push(t),1}return this.vacantProcess(e)}receiveIntegerProcess(e){if(/^[0-9]$/.test(e)){const t=this.tokens.pop();return t.content+=e,this.tokens.push(t),2}return this.vacantProcess(e)}generateTokens(e){let t=0;for(const i of e)switch(t){case 0:t=this.vacantProcess(i);break;case 1:t=this.receiveFuncProcess(i);break;case 2:t=this.receiveIntegerProcess(i)}for(const e of this.tokens)"function"===e.type&&this.symbols.has(e.content)&&(e.type="symbol");return this.tokens}findPower(e){let t=e;const i=this.tokens[t];if("("===i?.content){const e=this.findExpression(t+1);if(t=e.index,")"!==this.tokens[t]?.content)throw Error("parentheses is not match");return new p(t+1,"expression",e.ast)}if("integer"===i.type)return new p(t+1,i.type,new n(i.content));if("symbol"===i.type)return new p(t+1,i.type,new h(i.content));if("function"===i.type&&"("===this.tokens[t+1].content){const e=this.findExpression(t+2);if(t=e.index,")"!==this.tokens[t]?.content)throw Error("parentheses is not match");const s={};return s.functionName=i.content,s.parameter=e.ast,new p(t+1,i.type,new o(i.content,e.ast))}if("+"===i?.content){const i=this.findTerm(e+1),s=new r("positive",i.ast);return t=i.index,new p(t,"expression",s)}if("-"===i?.content){const i=this.findTerm(e+1),s=new r("negative",i.ast);return t=i.index,new p(t,"expression",s)}}findFactor(e){const t=this.findPower(e);let i=t.index;const s=new a(t.ast);if("^"===this.tokens[i]?.content){const e=this.findPower(i+1);s.add(e.ast),i=e.index}return new p(i,"term",s.getSimplify())}findTerm(e){const t=this.findFactor(e);let i=t.index;const s=new l(t.ast);for(;;)if("*"===this.tokens[i]?.content){const e=this.findFactor(i+1);s.add("multiply",e.ast),i=e.index}else{if("/"!==this.tokens[i]?.content)break;{const e=this.findFactor(i+1);s.add("divide",e.ast),i=e.index}}return new p(i,"term",s.getSimplify())}findExpression(e){const t=this.findTerm(e);let i=t.index;const s=new c(t.ast);for(;;)if("+"===this.tokens[i]?.content){const e=this.findTerm(i+1);s.add("add",e.ast),i=e.index}else{if("-"!==this.tokens[i]?.content)break;{const e=this.findTerm(i+1);s.add("minus",e.ast),i=e.index}}return new p(i,"unaryExpression",s.getSimplify())}findUnaryExpression(e){const t=this.tokens[e];let i,s=e;if("+"===t?.content){const t=this.findUnaryExpression(e+1);i=new r("positive",t.ast),s=t.index}else if("-"===t?.content){const t=this.findUnaryExpression(e+1);i=new r("negative",t.ast),s=t.index}else{const t=this.findUnaryExpression(e);i=t.ast,s=t.index}return new p(s,"expression",i)}parse(){return this.findExpression(0)}}return t})()}));