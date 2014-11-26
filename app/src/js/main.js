define(function(require, exports, module) {
  'use strict';
    
  var _c = require('const');

  function main(){
  }
  
  function init(){
    console.log('init');
    console.log(css);
  }
  
  main.prototype.constructor = main;
  main.prototype.init = init;
  
  module.exports = main;
});