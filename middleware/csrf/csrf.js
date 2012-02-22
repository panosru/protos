
/**
  CSRF
  
  Provides Cross-Site Request Forgery protection for applications.
  
  » Configuration Options
  
    {string} tokenSuffix: Suffix to append to csrf tokens
    {int} onFailure: HTTP Error code to respond on token validation failure
    
  » Usage example
  
    The ideal usage is to create the csrf token before rendering the view,
    this allows the token to be present in logicless templates (e.g. mustachioed
    template engines, such as hogan):
    
      res.render('form', {
        myToken: req.csrfToken('protect')
      });
      
    You can also use the csrf middleware directly:
    
      res.render('form', {
        myToken: app.csrf.getToken(req, 'protect')
      });
      
    Additionally, you can create the token from inside any template engine
    that supports logic. The following example uses the liquor engine:
    
      <input type="hidden" name="protect_key" value="#{req.csrfToken('protect')}" />
  
 */
 
var app = corejs.app,
    md5 = app.session.md5;

require('./request.js');
 
function Csrf(config, middleware) {
  
  // Dependency check
  if (!app.supports.session) {
    throw new Error("The 'csrf' middleware requires 'session'");
  } else if (!app.supports.body_parser) {
    throw new Error("The 'csrf' middleware requires 'body_parser'");
  }
  
  // Attach instance to app singleton
  app[middleware] = this;
  
  // Middleware configuration
  config = corejs.extend({
    tokenSuffix: '_key',
    onFailure: 400
  }, config);
  
  // Add non-enumerable config
  Object.defineProperty(this, 'config',{
    value: config,
    writable: true,
    enumerable: false,
    configurable: true
  });
  
}

// Events

app.on('csrf_check', function(req, token, fields) {
  // Accessing `this` is faster than accessing `app` in outer closure
  token += this.csrf.config.tokenSuffix;
  
  // These conditions must be satisfied:
  // a) Token is available in received fields
  // b) Token is available in session
  // c) If fields token matches session token
  var isValid = (token in fields) && (token in req.session) && (fields[token] === req.session[token]);
  
  if (!isValid) {
    req.stopRoute(); // In plain english: "I'll handle the request from here..."
    req.response.rawHttpMessage(this.csrf.config.onFailure);
  }
});

/**
  Retrieves and/or sets a csrf token
  
  @param {object} req
  @param {string} token
  @returns {string} hash
  @public
 */

Csrf.prototype.getToken = function(req, token) {
  token += this.config.tokenSuffix;
  if (! req.session[token]) req.session[token] = this.createHash();
  return req.session[token];
}

/**
  Creates a hash to be used as a token
  
  @returns {string} hash
  @public
 */

Csrf.prototype.createHash = function() {
  return md5(Math.random().toString());
}

module.exports = Csrf;