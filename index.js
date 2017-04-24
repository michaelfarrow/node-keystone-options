var _ = require('lodash')
var NodeCache = require('node-cache')

var cache = require('./cache')

var options = {}

var Option
var keystone

options.middleware = function (req, res, next) {
  cache.get('options', function (err, options) {
    if (err) return next(err)
    if (!options) {
      Option.model.find({}, function (err, options) {
        if (err) return next(err)
        keystone.set('options-cached', options)
        cache.set('options', options, next)
      })
    } else {
      keystone.set('options-cached', options)
      next()
    }
  })
}

options.has = function (key) {
  return !_.isNull(options.get(key))
}

options.get = function (key, callback) {
  return Option.fetch(key, callback)
}

options.value = function (key, noVal) {
  if (options.has(key)) {
    return options.get(key).value()
  }else {
    return noVal
  }
}

options.set = function (key, value, callback) {
  var option = new Option.model({
    key: key
  })

  option[Option.valueField(key)] = value
  option.save(callback)
}

options.init = function (app) {
  keystone = app

  require('./models/Option')
  Option = keystone.list('Option')

  keystone.pre('routes', options.middleware)
}

module.exports = options
