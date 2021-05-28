const sharedLogger = require('./lib/shared-logger')

function Diagnostics (bindable, bindableKey) {
  if (!sharedLogger.isBound(bindable)) {
    sharedLogger.bindKey(bindable, bindableKey)
  }

  const stateNode = sharedLogger.getBindableStateNode(bindable)
  const stateNodeData = sharedLogger.getStateNodeData(stateNode)
  return {
    log (message) {
      stateNodeData.log = {
        message,
        ts: new Date().toISOString()
      }
    },
    error (message, error) {
      stateNodeData.error = {
        message,
        error,
        ts: new Date().toISOString()
      }
    },
    dump ({ includeChildren = false } = {}) {
      if (includeChildren) {
        return sharedLogger.dumpRecursive(stateNode)
      }
      return stateNodeData
    }
  }
}

module.exports = {
  Diagnostics,
  getSharedState () {
    return sharedLogger.dumpRecursive()['/'] || {}
  },
  bindableExists (bindable) {
    return sharedLogger.isPathBound(bindable)
  }
}
