'use strict';

var through = require('through2');

var builders = require('ast-types').builders;
var replace = require('estraverse').replace;

var identifier = builders.identifier;
var literal = builders.literal;
var blockStatement = builders.blockStatement;
var expressionStatement = builders.expressionStatement;

var callExpression = builders.callExpression;
var arrayExpression = builders.arrayExpression;
var memberExpression = builders.memberExpression;
var variableDeclaration = builders.variableDeclaration;
var variableDeclarator = builders.variableDeclarator;
var functionExpression = builders.functionExpression;



function isFunction(node) {
  return node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression';
}

function isStringLiteral(node) {
  return node.type === 'Literal' && typeof node.value === 'string';
}

function isPropertyAccess(node) {
  return node.type === 'MemberExpression' && !node.computed;
}

function isPropertyKey(node, parent) {
  return parent.type === 'Property' && parent.key === node;
}

function isStrictStatement(statement) {
  return statement.type === 'ExpressionStatement' &&
         statement.expression.type === 'Literal' &&
         statement.expression.value === 'use strict';
}

function wrapWithIife(body, stringMapName, stringMap) {
  var wrapperFunctionBody = blockStatement(body);
  var wrapperFunction = functionExpression(null, [stringMapName], wrapperFunctionBody);
  var iife = expressionStatement(
    callExpression(
      memberExpression(wrapperFunction, identifier('call'), false),
      [identifier('this'), stringMap]));
  return [iife];
}

function prependMap(body, stringMapName, stringMap) {
  var insertIndex = isStrictStatement(body[0]) ? 1 : 0;
  body.splice(insertIndex, 0,
    variableDeclaration('var', [
      variableDeclarator(stringMapName, stringMap)
    ])
  );
  return body;
}

function stringToHex(str, hexall){
　　var val="";
　　for(var i = 0; i < str.length; i++){
        var x = str.charCodeAt(i).toString(16);
        if(hexall) {
          // hex most strings include ASCII and Chinese
          if(x.length===1){ // \r \n do not convert it
            val += str[i];
          }else if(x.length===4){ // Chinese unicode
            val += "#u#" + x;
          }else{
            val += "#x#" + x;
          }
        }else{
          // only Chinese
          var reg = /([\u4E00-\u9FA5]|[\uFE30-\uFFA0])/;
          if(reg.test(str[i]) && x.length===4){
              val += "#u#" + x;
          }else{
              val += str[i];
          }
        }
　　}
　　return val;
}

function transformAst(ast, createVariableName, hexall, placeholdMode) {
  var usedVariables = {};
  var exposesVariables = false;
  var strings = [];
  var stringIndexes = Object.create(null);
  var stringMapIdentifier = identifier('');

  function addString(string, returnIndex) {
    if (!(string in stringIndexes)) {
      string = stringToHex(string, hexall);
      stringIndexes[string] = strings.push(string) - 1;
    }
    return returnIndex ? stringIndexes[string] : string;
  }

  replace(ast, {
    enter: function(node, parent) {
      var index;
      var str;
      if (node.type === 'VariableDeclaration' || node.type === 'FunctionDeclaration') {
        if (!exposesVariables) {
          exposesVariables = !this.parents().some(isFunction);
        }
      } else if (node.type === 'Identifier') {
        usedVariables[node.name] = true;
      } else if (isStringLiteral(node) && !isPropertyKey(node, parent) && node.value !== 'use strict') {
        if(placeholdMode) {
          index = addString(node.value, true);
          return memberExpression(stringMapIdentifier, literal(index), true);
        }else{
          str = addString(node.value, false);
          return literal(str);
        }
        
      } else if (isPropertyAccess(node)) {
        if(placeholdMode) {
          index = addString(node.property.name, true);
          return memberExpression(node.object, memberExpression(stringMapIdentifier, literal(index), true), true);
        }else{
          // return node; // if you do not want 'Console.log' to be 'Console["log"]', uncomment it
          str = addString(node.property.name, false);
          return memberExpression(node.object, memberExpression(stringMapIdentifier, literal(str), true), true);
        }
        
      }
    }
  });

  if(placeholdMode) {
    stringMapIdentifier.name = createVariableName(Object.keys(usedVariables));
    var insertMap = placeholdMode == 1 || placeholdMode == 'prependMap' ? prependMap : wrapWithIife;
    ast.body = insertMap(ast.body, stringMapIdentifier, arrayExpression(strings.map(literal)));
  }

  return ast;
};

function createVariableName (variableNames) {
  var name = '_x';
  do {
    name += (Math.random() * 0xffff) | 0;
  } while (variableNames.indexOf(name) !== -1);
  return name;
};

module.exports = function() {
  var __=require('lodash');
  var defaultOptions = {
    hexall: false, // if true, convert all string to hex, ASCII to '\x00', none ASCII like Chinese to '\u0000'; if false, only convert Chinese
    placeholdMode: 0, // 0 - keep string in their positions; 
                     // 1 or 'prependMap' - use a array includes all the strings, and expose the array as a variable prepend the code; 
                     // 2 or 'wrapWithIife' - use a array includes all the strings, and use Iife to wrap the array as a parameter of the function;
    compress: true               
  };
  var args = arguments[0] === undefined ? {} : arguments[0];
  var options = __.extend(defaultOptions, args);
  var parse = require('esprima').parse;
  var toString = require('escodegen').generate;
  var toStringOptions = options.compress ? {
      format: {
          indent: {
              style: '',
              base: 0,
              adjustMultilineComment: false
          },
          newline: '',
          space: ''
      }
  } : {};
  var str2hex = require('gulp-str2hex');

  return through.obj(function(file, encoding, callback){
    if (file.isNull()) {
      this.push(file);
      return callback();
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-str2hex', 'Stream content is not supported'));
      return callback();
    }

    if (file.isBuffer()) {
      var contents = file.contents.toString();
      var ast = parse(contents);
      var obfuscated = transformAst(ast, createVariableName, options.hexall, options.placeholdMode);
      var result = toString(obfuscated, toStringOptions).replace(/#x#/g, "\\x").replace(/#u#/g, "\\u");
      file.contents = new Buffer(result);
      this.push(file);
      return callback();
    }
  });
}