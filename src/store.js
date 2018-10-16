const { getHookValue, extendsObservableProperty } = require('./hook')
const { Subject, Disposable, CompoundDisposable } = require('racjs')
const Watcher = require('./watcher')
const Computed = require('./computed')
const { dispose } = require('./subscription')
const Property_Prefix = 'racx'

class Store {
  constructor(config) {
    this.racxSignal = new Subject()
    this.racxDisposable = new CompoundDisposable()
    this.racxAutoRun = false
    this.racxTempDeps = []
    this.initObservable(config.observable || {})
    this.racxComputed = {}
    this.initComputed(config.computed || {})
    this.racxStartId = 0
    this.racxWatchers = {}
  }

  uuid() {
    ++this.racxStartId
    return 'racx_uuid_' + this.racxStartId
  }

  initObservable(observable) {
    this.racxInnerObservable = getHookValue(observable)
    Object.keys(observable).forEach(key => {
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        get: function() {
          if (this.racxAutoRun) {
            this.racxTempDeps.push(key)
          }
          return this.racxInnerObservable[key]
        },
        set: function(value) {
          this.racxInnerObservable[key] = value
        }
      })
    })
    this.racxDisposable.addDisposable(
      new Disposable(() => {
        dispose(this.racxInnerObservable.$racxSubscription)
      })
    )
    this.racxDisposable.addDisposable(
      this.racxInnerObservable.$racxSubscription.subject.subscribeNext(v => {
        let computedWatchers = []
        Object.keys(this.racxComputed).forEach(key => {
          let computed = this.racxComputed[key]
          if (containDep(v, computed.dep)) {
            computed.watched()
            computedWatchers.push({ key })
          }
        })
        let nv = computedWatchers
        if (Array.isArray(v)) {
          nv = computedWatchers.concat(v)
        } else {
          nv.push(v)
        }
        //console.log(nv)
        Object.keys(this.racxWatchers).forEach(key => {
          let watcher = this.racxWatchers[key]
          if (containDep(nv, watcher.dep)) {
            watcher.active()
          }
        })
        this.racxSignal.sendNext(nv)
      })
    )
  }

  extendsObservable(key, value) {
    if (!this.hasOwnProperty(key)) {
      extendsObservableProperty(this.racxInnerObservable, key, value)
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        get: function() {
          if (this.racxAutoRun) {
            this.racxTempDeps.push(key)
          }
          return this.racxInnerObservable[key]
        },
        set: function(value) {
          this.racxInnerObservable[key] = value
        }
      })
    } else {
      this[key] = value
    }
  }

  initComputed(computed) {
    Object.keys(computed).forEach(key => {
      this.racxComputed[key] = new Computed(computed[key], this)
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        get: function() {
          if (this.racxAutoRun) {
            this.racxTempDeps.push(key)
          }
          return this.racxComputed[key].computed()
        },
        set: function(value) {
          console.warn('you can not set a new value for a computed property')
          this.racxComputed[key].value = value
        }
      })
    })
  }

  inject(config, collectDep = false) {
    let id = this.uuid()
    this.racxWatchers[id] = new Watcher(config, this)
    let disposable = new Disposable(() => {
      delete this.racxWatchers[id]
    })
    this.racxDisposable.addDisposable(disposable)
    if (collectDep) {
      this.racxAutoRun = true
      this.racxWatchers[id].cb.call(this)
      this.racxWatchers[id].dep = this.racxTempDeps
      this.racxTempDeps = []
      this.racxAutoRun = false
    }
    return disposable
  }

  autoRun(config) {
    return this.inject(config, true)
  }

  clear() {
    this.racxDisposable.dispose()
  }

  getRacxSignal() {
    return this.racxSignal
  }
}

module.exports = Store

function containDep(value, keys) {
  if (keys === '*') {
    return true
  }
  if (Array.isArray(value)) {
    let ks = value.map(v => v.key)
    return keys.some(k => ks.some(kk => {
      return kk.startsWith(k) || k.startsWith(kk)
    }))
  } else {
    return keys.some(k => {
      return value.key.startsWith(k) || k.startsWith(value.key)
    })
  }
}



