
var _ = require('lodash');

var options = {};

var Option;
var keystone;

options.middleware = function(req, res, next){
  Option.model.find({}, function(err, options) {
    keystone.set('options', options);
    next();
  });
};

options.has = function(key){
  return !_.isNull(options.get(key));
};

options.get = function(key){
  return Option.fetch(key);
};

options.init = function(app){
  keystone = app;

  require('./models/Option');
  Option = keystone.list('Option');

  keystone.pre('routes', options.middleware);
}

module.exports = options;
