const Store = require('./store')
const config = {
  observable: {
    a: [1], //数组
    b: 2,
    c: {
      aa: 1
    }
  },
  computed: {
    total: {
      value: function() {
        return this.a.length
      }
    },
    total2: function() {
      return this.a[1] + 2
    },
    total3: {
      dep: ['a[0]', 'd.a[0]', 'c.aa'],
      value: function() {
        let n = 0
        if (this.d) {
          n = this.d.a[0]
        }
        return this.a[0] + this.c.aa + n
      }
    }
  }
}
let proxyStore = new Store(config)
let proxyStore2 = new Store(config)
proxyStore.autoRun(() => {
  console.log(proxyStore.total3)
})
proxyStore.a.unshift(2)
setTimeout(() =>proxyStore.extendsObservable('d', proxyStore2))
setTimeout(() =>proxyStore.extendsObservable('d', {a: [300]}), 100)
setTimeout(() =>proxyStore.extendsObservable('d', proxyStore2), 200)
let a = proxyStore.a
setTimeout(() => (proxyStore.a = [2]), 300)
setTimeout(() => (proxyStore.a = a), 400)