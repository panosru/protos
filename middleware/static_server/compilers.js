
/* Static Server » Asset compilers */

var less = require('less'),
    coffee = require('coffee-script');

// Asset compilers
module.exports = {
  
  coffee: function(source, callback) {
    callback(null, coffee.compile(source));
  },
  
  less: function(source, callback) {
    less.render(source, callback);
  }
  
}