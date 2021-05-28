class SharedLogger {
  constructor () {
    this.state = {}
    this.bindableStrings = {}
    this.symbolIdKey = Symbol('bindableIdKey')
    this.symbolLoggingKey = Symbol('stateLogKey')
  }

  _createKeyPathStateNode (keyPath) {
    if (!keyPath) {
      throw new Error('argument "keyPath" was not defined')
    }

    let stateNode = this.state
    for (const pathSeg of keyPath.split('/')) {
      stateNode[pathSeg] = stateNode[pathSeg] || {}
      stateNode = stateNode[pathSeg]
    }
    // Hide the key. This way some prefix key-path can not override key values stored in this state node.
    // X1 path is a/b/c   assigned with {f : 42, message: 'f will not be overridden by X2 path'}
    // X2 path is a/b/c/f assigned with { message: 'i will not override f property of X1' }
    stateNode[this.symbolLoggingKey] = {}
    return stateNode
  }

  getBindableStateNode (bindable) {
    if (typeof bindable === 'string') {
      return this.bindableStrings[bindable]
    }
    return bindable[this.symbolIdKey]
  }

  getStateNodeData (stateNode) {
    return stateNode[this.symbolLoggingKey]
  }

  bindKey (bindable, keyPath) {
    if (typeof bindable === 'string') {
      this.bindableStrings[bindable] = this._createKeyPathStateNode(keyPath || bindable)
      return
    }
    bindable[this.symbolIdKey] = this._createKeyPathStateNode(keyPath)
  }

  isBound (bindable) {
    if (!bindable) {
      throw new Error('Logging key must be defined.')
    }

    if (typeof bindable === 'string') {
      return Boolean(this.bindableStrings[bindable])
    }
    return Boolean(bindable[this.symbolIdKey])
  }

  dumpRecursive (stateNode = null) {
    if (!stateNode) {
      stateNode = this.state
    }
    const data = this.getStateNodeData(stateNode)
    const children = Object.entries(stateNode)
      .reduce((acc, [k, v]) => {
        if (typeof k !== 'symbol') {
          acc[k] = this.dumpRecursive(v)
        }
        return acc
      }, {})

    const currDump = {}
    if (data !== undefined) {
      currDump.data = data
    }
    if (Object.keys(children).length > 0) {
      currDump['/'] = children
    }
    return currDump
  }
}

module.exports = new SharedLogger()