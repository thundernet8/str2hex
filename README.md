# Note
This is a package modified from [confusion](https://www.npmjs.com/package/confusion)

# About
Sometimes, we want to obfuscate our source code to against theft or abuse.

**Confusion** makes it harder to decipher your code by replacing string literals 
and property accesses with lookups into a string map.

**Gulp-str2hex** inherit the basic functionality of Confusion, integrate with gulp, and also bring some enhancement.

* Convert strings and object property names to Hex string like '\x00' (None ASCII char to '\u0000' unicode)
* Compress the code, remove comments, new lines, spaces()

## Install

use npm:


```
npm install gulp-str2hex --save
```

## Example

This code snippet:

```js
var cnStr = "中文测试";
var enStr = 'This is a sentence in English';
 
String.prototype.myLog = function () {
    console.log('>> ' + str + ' <<');
};
```

will be converted to

```js
var cnStr = '\u4e2d\u6587\u6d4b\u8bd5';
var enStr = '\x54\x68\x69\x73\x20\x69\x73\x20\x61\x20\x73\x65\x6e\x74\x65\x6e\x63\x65\x20\x69\x6e\x20\x45\x6e\x67\x6c\x69\x73\x68';
String[['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65']][['\x6d\x79\x4c\x6f\x67']] = function () {
    console[['\x6c\x6f\x67']]('\x3e\x3e\x20' + str + '\x20\x3c\x3c');
};
```

or use string map

```js
var _x28494 = [
    '\u4e2d\u6587\u6d4b\u8bd5',
    '\x54\x68\x69\x73\x20\x69\x73\x20\x61\x20\x73\x65\x6e\x74\x65\x6e\x63\x65\x20\x69\x6e\x20\x45\x6e\x67\x6c\x69\x73\x68',
    '\x6d\x79\x4c\x6f\x67',
    '\x70\x72\x6f\x74\x6f\x74\x79\x70\x65',
    '\x6c\x6f\x67',
    '\x3e\x3e\x20',
    '\x20\x3c\x3c'
];
var cnStr = _x28494[0];
var enStr = _x28494[1];
String[_x28494[3]][_x28494[2]] = function () {
    console[_x28494[4]](_x28494[5] + str + _x28494[6]);
};
```

or bring all the string through call parameter of <abbr title="immediately invoced function expression">IIFE</abbr>:

```js
(function (_x16425) {
    'use strict';
    var cnStr = _x16425[0];
    var enStr = _x16425[1];
    String[_x16425[3]][_x16425[2]] = function () {
        console[_x16425[4]](_x16425[5] + str + _x16425[6]);
    };
}.call(this, [
    '\u4e2d\u6587\u6d4b\u8bd5',
    '\x54\x68\x69\x73\x20\x69\x73\x20\x61\x20\x73\x65\x6e\x74\x65\x6e\x63\x65\x20\x69\x6e\x20\x45\x6e\x67\x6c\x69\x73\x68',
    '\x6d\x79\x4c\x6f\x67',
    '\x70\x72\x6f\x74\x6f\x74\x79\x70\x65',
    '\x6c\x6f\x67',
    '\x3e\x3e\x20',
    '\x20\x3c\x3c'
]));

```

you can also choose only hex some none ASCII chars like Chinese(like what some Chinese to unicode packages to do)

```js
(function (_x53816) {
    'use strict';
    var cnStr = _x53816[0];
    var enStr = _x53816[1];
    String[_x53816[3]][_x53816[2]] = function () {
        console[_x53816[4]](_x53816[5] + str + _x53816[6]);
    };
}.call(this, [
    '\u4e2d\u6587\u6d4b\u8bd5',
    'This is a sentence in English',
    'myLog',
    'prototype',
    'log',
    '>> ',
    ' <<'
]));
```

and compress the code(the uglify-js package will restore what we have converted, so we cannot use it after our working pipe):

```js
(function(_x37168){'use strict';var cnStr=_x37168[0];var enStr=_x37168[1];String[_x37168[3]][_x37168[2]]=function(){console[_x37168[4]](_x37168[5]+str+_x37168[6]);};}.call(this,['\u4e2d\u6587\u6d4b\u8bd5','This is a sentence in English','myLog','prototype','log','>> ',' <<']));
```

## Usage

use with gulp

```js
gulp.src(['./src/js/*.js'])
    .pipe(webpack(require('./webpack.config.js')))
    .pipe(uglify())
    .pipe(str2hex())
    .pipe(gulp.dest('./assets/js')) 
```

add some options

```js
gulp.src(['./src/js/*.js'])
    .pipe(webpack(require('./webpack.config.js')))
    .pipe(uglify())
    .pipe(str2hex({
        hexall: false,
        placeholdMode: 2,
        compress: true
    }))
    .pipe(gulp.dest('./assets/js')) 
```

## options

* hexall

  whether hex all strings or not, default: `false`


  available values: `true` or `false`
  

* placeholdMode

  how to map the strings, default: `0`

  
  available values: 
  ```
  0 - keep string in their positions,
  1(alias `prependMap`) - use a array includes all the strings, and expose the array as a variable prepend the code;
  2(alias `wrapWithIife`) - use a array includes all the strings, and use Iife to wrap the array as a parameter of the function;
  ```


* compress

  compress the code, remove new lines, comments and spaces, instead of **uglify-js**, default true

  available values: `true` or `false`

  **note:**
    if you use uglify-js, must make the pipe before our package pipe, or the hex string will be restored.