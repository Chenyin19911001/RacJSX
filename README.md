# RacJSX
Framework For Data Observers Based On RacJS, 基于RacJs实现的类似于redux/mobx的共享数据流框架

## Demo

```
const config = {
  key: 'store',
  observable: {
    a: [], //数组
    b: 2,
    c: {
      aa: 1
    },
    d: someObservable
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
      dep: ['a[0]', 'c.aa'],
      value: function() {
        return this.a[0] + this.c.aa
      }
    }
  }
}
let store = new Store(config)
store.autoRun(() => {
  console.log(store.total)
})
store.autoRun({
  sync:true,
  subscriber: () => console.log(store.total)
})
store.inject({
  sync:true,
  dep: ['xxx', 'xxx2'],
  subscriber: () => console.log(store.total)
})
```
如上代码：根据config生成一个store, config主要包括3部分。
### key
store的唯一标志，标志当前依赖的最外层key。后续computed中的total的dep依赖为'a'，实际整体的依赖的路径为store.a
### observable
定义store中被观察的各个数据。数据被分为4种。
1）数组：上面定义的a
2）simpleValue：一些基本数据类型，数字，字符串，null，非观察对象等
3）plainObject：{} 这种纯粹的object
4）observable：自己定义的某种数据流对象，满足一定的接口即可
### computed
定义store中被观察的但是需要由observable中的数据计算而来的。每一个computed的也是一个配置。
dep：声明依赖
value：计算逻辑
如果配置直接是一个function，那么就将该function作为value处理
如果没有声明dep，那么store会自动计算该value涉及到的依赖

## 监听store
在业务层监听store，需要调用store的inject/autoRun方法，方法传入一个watch的config。
dep：声明依赖，默认为全依赖
subscriber：监听函数，
sync：是否在依赖发生变化的时候同步调用监听，默认值为false
如果只有subscriber，其他使用默认值，可以直接传入一个function
该方法返回一个disposable
如果想接触监听的话，直接调用disposable.dispose()方法
如果声明了监听的dep，建议调用inject方法；没有声明，建议调用autoRun方法，自动获取依赖
注：如果声明了dep，且调用了autoRun方法，自动获取依赖的值会覆盖声明的依赖dep；自动获取依赖会手动调用一次监听函数

## 废弃store
如果当前的store不是一个全局的，需要在合适的时候解除store，可以调用store.clear()方法
