
/* Static Server » Application extensions */

var app = corejs.app,
    fs = require('fs'),
    mime = require('mime'),
    pathModule = require('path'),
    Application = corejs.lib.application;

var parseRange = corejs.util.parseRange;

/**
  Checks if the request is a file request
  
  @param {object} req
  @private
 */
 
Application.prototype.isStaticFileRequest = function(req, res) {

  var url = req.urlData.pathname;

  if (req.method == 'GET' && (this.staticFileRegex.test(url) || this.regex.fileWithExtension.test(url))) {
    
    req.isStatic = true;
    this.emit('static_file_request', req, res);
    if (req.__stopRoute === true) return;
    
    return true;
    
  } else return false;
  
}

/**
  Serves a static file

  @param {string} path
  @param {object} req
  @param {object} res
  @private
 */

Application.prototype.serveStaticFile = function(path, req, res) {

  var callback, self = this;

  if ( pathModule.basename(path).charAt(0) == '.' ) {

    this.notFound(res);

  } else {

    fs.stat(path, callback = function(err, stats) {

      if (err || stats.isDirectory()) {

        // File not found
        self.notFound(res);

      } else  {

        var date = new Date(),
          now = date.toUTCString(),
          lastModified = stats.mtime.toUTCString(),
          contentType = mime.lookup(path),
          maxAge = self.config.cacheControl.maxAge;

        date.setTime(date.getTime() + maxAge * 1000);

        var expires = date.toUTCString(),
          isCached = ( (req.headers['if-modified-since'] != null)
          && lastModified === req.headers['if-modified-since'] );

        // Static headers
        var headers = {
          'Content-Type': contentType,
          'Cache-Control': self.config.cacheControl.static + ", max-age=" + maxAge,
          'Last-Modified': lastModified,
          'Content-Length': stats.size,
          Expires: expires
        };

        // Etags
        var enableEtags = self.config.staticServer.eTags;
        if (enableEtags === true) {
          headers.Etag = JSON.stringify([stats.ino, stats.size, Date.parse(stats.mtime)].join('-'));
        } else if (typeof enableEtags == 'function') {
          headers.Etag = enableEtags(stats);
        }

        // Return cached content
        if (isCached) {
          res.statusCode = 304;
          self.emit('static_file_headers', req, res, headers, stats, path);
          res.sendHeaders(headers);
          res.end();
          return;
        }

        var acceptRanges = self.config.staticServer.acceptRanges;
        if (acceptRanges) headers['Accept-Ranges'] = 'bytes';

        var stream, streamArgs = [path];

        if (acceptRanges && (req.headers.range != null)) {

          // Handle partial range requests

          var start, end, len,
          ranges = (parseRange(stats.size, req.headers.range) || [])[0];

          if (ranges != null) {
            start = ranges.start;
            end = ranges.end;
            streamArgs.push({start: start, end: end});
            len = end - start + 1;
            res.statusCode = 206; // HTTP/1.1 206 Partial Content
            res.setHeaders({
              'Content-Range': "bytes " + start + "-" + end + "/" + stats.size
            });
          } else {
            res.statusCode = 416; // HTTP/1.1 416 Requested Range Not Satisfiable
            headers.Connection = 'close';
            res.sendHeaders(headers);
            res.end('');
            return;
          }

        } else {
          // Make sure statusCode is set to 200
          res.statusCode = 200;
        }

        // Prepare an asyncrhonous file stream
        stream = fs.createReadStream.apply(null, streamArgs);

        stream.on('error', function(err) {
          self.serverError(res, ["Unable to read " + self.relPath(path) + ": " + err.toString()]);
        });

        // When stream is ready
        stream.on('open', function() {
          self.emit('static_file_headers', req, res, headers, stats, path);
          res.sendHeaders(headers);
          stream.pipe(res);
        });

      }

    });

  }

}
