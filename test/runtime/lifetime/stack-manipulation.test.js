var test = require('tape')
var _ = require('@yoda/util')._

var helper = require('../../helper')
var Lifetime = require(`${helper.paths.runtime}/lib/component/lifetime`)
var mock = require('./mock')

test('app preemption', t => {
  mock.restore()
  mock.mockAppExecutors(5)
  var life = new Lifetime(mock.appLoader)

  Promise.all(_.times(5).map(idx => life.createApp(`${idx}`)))
    .then(() => {
      _.times(5).forEach(idx => t.strictEqual(life.isAppRunning(`${idx}`), true, `app ${idx} should be running`))

      return life.activateAppById('0', 'cut')
    })
    .then(() => {
      t.strictEqual(life.getCurrentAppId(), '0', 'cut app preempts top of stack')

      return life.activateAppById('1', 'scene')
    })
    .then(() => {
      t.strictEqual(life.getCurrentAppId(), '1', 'scene app preempts top of stack')
      t.looseEqual(mock.appLoader.getAppById('0'), null, 'cut app shall be destroyed on preemption')

      return life.activateAppById('2', 'scene')
    })
    .then(() => {
      t.strictEqual(life.getCurrentAppId(), '2', 'scene app preempts top of stack from scene app')
      t.looseEqual(mock.appLoader.getAppById('1'), null, 'scene app shall be destroyed on preemption by a scene app')

      return life.activateAppById('3', 'cut')
    })
    .then(() => {
      t.strictEqual(life.getCurrentAppId(), '3', 'cut app preempts top of stack from scene app')
      t.notLooseEqual(mock.appLoader.getAppById('2'), null, 'scene app shall not be destroyed on preemption by a cut app')
      t.strictEqual(life.isAppActive('2'), true, 'scene app shall remain in stack on preemption by a cut app')

      return life.deactivateAppById('3')
    })
    .then(() => {
      t.strictEqual(life.getCurrentAppId(), '2', 'scene app shall return to top of stack on deactivation of cut app')
      t.looseEqual(mock.appLoader.getAppById('3'), null, 'cut app shall be destroyed on deactivation')

      t.end()
    })
    .catch(err => {
      t.error(err)
      t.end()
    })
})

test('shall not deactivate app if app to be activated is in stack', t => {
  mock.restore()
  mock.mockAppExecutors(5)
  var life = new Lifetime(mock.appLoader)

  Promise.all(_.times(5).map(idx => life.createApp(`${idx}`)))
    .then(() => {
      mock.appLoader.getAppById('0').on('destroy', () => {
        t.fail('app 0 shall not be destroyed')
      })
      return life.activateAppById('0', 'cut')
    })
    .then(() => {
      t.strictEqual(life.getCurrentAppId(), '0', 'cut app preempts top of stack')
      return life.activateAppById('0', 'cut')
    })
    .then(() => {
      t.strictEqual(life.getCurrentAppId(), '0', 'cut app preempts top of stack')
      return life.activateAppById('0', 'scene')
    })
    .then(() => {
      t.strictEqual(life.getCurrentAppId(), '0', 'scene app preempts top of stack')
      return life.activateAppById('0', 'scene')
    })
    .then(() => {
      t.strictEqual(life.getCurrentAppId(), '0', 'scene app preempts top of stack')
      return life.activateAppById('1', 'cut')
    })
    .then(() => {
      t.strictEqual(life.getCurrentAppId(), '1', 'cut app preempts top of stack')
      return life.activateAppById('0', 'scene')
    })
    .then(() => {
      t.strictEqual(life.getCurrentAppId(), '0', 'scene app preempts top of stack')
      t.end()
    })
    .catch(err => {
      t.error(err)
      t.end()
    })
})

test('shall not throw on activating if previous app is not alive', t => {
  mock.restore()
  mock.mockAppExecutors(5)
  var life = new Lifetime(mock.appLoader)

  Promise.all(_.times(1).map(idx => life.createApp(`${idx}`)))
    .then(() => {
      life.activeAppStack.push('1')
      life.appDataMap['1'] = {}

      t.strictEqual(life.getCurrentAppId(), '1', 'app 1 shall be active thought it\'s not alive')

      return life.activateAppById('0')
    })
    .then(() => {
      t.strictEqual(life.getCurrentAppId(), '0')

      t.end()
    })
    .catch(err => {
      t.error(err)
      t.end()
    })
})
