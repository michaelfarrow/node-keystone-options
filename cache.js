var NodeCache = require('node-cache')

module.exports = new NodeCache({
  useClones: false
})
