const Store = require('./src/store')
function createStore(config) {
	return new Store(config)
}

function createCompoundStore(config) {
	let store = new Store({})
	Object.keys(config).forEach(key => {
		store.extendsObservable(key, new Store(config[key]))
	})
	return store
} 

module.exports = { createStore, createCompoundStore }