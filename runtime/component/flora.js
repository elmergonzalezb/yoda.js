
var logger = require('logger')('flora')
var inherits = require('util').inherits

var FloraComp = require('@yoda/flora/comp')
var safeParse = require('@yoda/util').json.safeParse
var url = require('url')

var floraConfig = require('../lib/config').getConfig('flora-config.json')

module.exports = Flora
/**
 *
 * @param {AppRuntime} runtime
 */
function Flora (runtime) {
  FloraComp.call(this, 'runtime', floraConfig)
  this.runtime = runtime
  this.component = runtime.component
  this.descriptor = runtime.descriptor
}
inherits(Flora, FloraComp)

Flora.prototype.handlers = {
  'yodaos.ntpd.event': function onTimeChanged (msg) {
    if (msg[0] === 'step') {
      this.component.broadcast.dispatch('yodaos.on-time-changed')
    }
  },
  'yodaos.otad.event': function onOtadEvent (msg) {
    if (msg[0] === 'prepared') {
      this.component.broadcast.dispatch('yodaos.on-ota-prepared')
    }
  }
}

Flora.prototype.remoteMethods = {
  'yodaos.runtime.open-url': function OpenUrl (reqMsg, res) {
    var url = reqMsg[0]
    var options = safeParse(reqMsg[1])
    this.runtime.openUrl(url, options)
      .then(result => {
        res.end(0, [ JSON.stringify({ ok: true, result: result }) ])
      })
      .catch(err => {
        logger.info('unexpected error on opening url', url, options, err.stack)
        res.end(0, [ JSON.stringify({ ok: false, message: err.message, stack: err.stack }) ])
      })
  },
  'yodaos.runtime.open-url-format': function OpenUrl (reqMsg, res) {
    logger.info('open-url with format', reqMsg)
    var urlObj = url.parse(reqMsg[0], true)
    reqMsg.slice(1).forEach(it => {
      if (!Array.isArray(it)) {
        return
      }
      urlObj.query[it[0]] = it[1]
    })
    this.runtime.openUrl(urlObj)
      .then(result => {
        res.end(0, [ JSON.stringify({ ok: true, result: result }) ])
      })
      .catch(err => {
        logger.info('unexpected error on opening url format', reqMsg, err.stack)
        res.end(0, [ JSON.stringify({ ok: false, message: err.message, stack: err.stack }) ])
      })
  }
}