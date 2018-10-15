# RacJSX
Framework For Data Observers Based On RacJS

## 基础Demo
```
// 创建一个config
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

//根据config创建一个store
let store = new Store(config)

//监听store
let disposable = store.autoRun(() => {
  console.log(store.total)
})
let disposable = store.autoRun({
  sync: true,
  subscriber: () => console.log(store.total)
})
let disposable = store.inject({
  sync: true,
  dep: ['xxx', 'xxx2'],
  subscriber: () => console.log(store.total)
})

//解除监听
disposable.dispose()

//销毁store
store.clear()

```
### config
config分为两个部分：observable和computed
#### observable
observable: store中可以被直接观察的属性。
##### 监听类型
被观察的属性类型分为4种：
```
const ValueTypeSimple = 1 // 基本数据类型,number,string,boolean,null,unobsevable object
const ValueTypeArray = 2 // array
const ValueTypePlain = 3 // plain object, {} 这种纯粹的object
const ValueTypeObservable = 4 // obsevable object, 满足一定接口的对象
```
##### 嵌套监听
ValueTypeArray，ValueTypePlain这两种类型是嵌套监听的，也就是array的每一个元素，plain object的每一个属性值也是被观察的。嵌套监听主要体现在keypath上，比如要监听 store对象的a属性（数组）的第3个plainobject的b属性，那么它的监听keypath为"a[3].b"

#### computed
computed: store中可以被间接观察的属性，也是由observable属性计算而来,声明方式有三种：  
1)全对象声明方式(包括value和dep):  
这种情况下，store是不会自动解析computed依赖的那些observable的，直接使用声明的依赖值
```
total: {
  dep: ['a'], // 'a'
  value: function() {
    return this.a.length
  }
}
```
2）部分对象声明方式，只有value: 自动解析依赖
```
total: {
  value: function() {
    return this.a.length
  }
}
```
3) 函数声明方式: 自动解析依赖
```
total: function() {
  return this.a[1] + 2
}
```
### 监听store和解除监听
监听的方式有inject和autoRun两种。
#### 监听的配置
dep：声明依赖，默认为全依赖
subscriber：监听函数
sync：是否在依赖发生变化的时候同步调用监听，默认值为false
如果只有subscriber，其他使用默认值，可以直接传入一个function
#### inject监听
如果已经声明了依赖，不需要store自动解析依赖，就调用inject
#### autoRun
如果没有声明依赖，需要store自动解析依赖，就调用autoRun。（自动解析依赖的时候会默认先执行一次监听函数）
#### 解除监听
inject和autoRun的返回值都是一个disposable对象，如果想解除监听，直接调用disposable.dispose()方法
### 销毁store
如果当前的store不是一个全局的，需要在合适的时候销毁store，可以调用store.clear()方法
## 高级用法
### extendsObservable
前面都是说store的监听属性都需要在config里面进行定义，如果不想在store的config里面定义的话，也就是希望给store增加一个可监听属性，可以调用store的extendsObservable方法，之后就可以直接使用属性赋值了
```
let store = new Store(config)
store.extendsObservable('d', [1, 2, 3])
```
### 扩展和嵌套
前面说过store的观察类型ValueTypeObservable是可被观察的对象，其实store就是实现了可观察对象接口的对象；再结合extendsObservable用法；我们可以在一个store中进行灵活的store嵌套和扩展。PS：将store的生命和（react，react-native）这种结合起来就可以很优雅的实现多级store的数据分发
