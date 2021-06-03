const sharedLogger = require('./lib/shared-logger')
const _tracePrivateSym = Symbol('_tracePrivateMethodKey')
function createDiagnosticsEntry (stateNode) {
  const stateNodeData = sharedLogger.getStateNodeData(stateNode)

  return {
    [_tracePrivateSym] (message, stackTrace) {
      stateNodeData.trace = {
        payload: message,
        stackTrace,
        ts: new Date().toISOString()
      }
    },
    path (path) {
      const nextStateNode = sharedLogger._createKeyPathStateNode(path, stateNode)
      return createDiagnosticsEntry(nextStateNode)
    },
    log (message) {
      stateNodeData.log = {
        payload: message,
        ts: new Date().toISOString()
      }
    },
    error (message, error) {
      stateNodeData.error = {
        payload: message,
        error,
        ts: new Date().toISOString()
      }
    },
    trace (message) {
      const err = new Error('trace')
      // stack index: 0 = Error, 1 = self, 2 is the callee (our interest), 3 and beyond the call-stack that came to us.
      const actualStack = err.stack.split('\n').filter((_, i) => i > 1).map(txt => txt.trim())
      const [traceEntry] = actualStack
      const path = traceEntry.match(/\((.*)\)/)[1].replace(/\\/g, '>')
      this.path('__trace__').path(path)[_tracePrivateSym](message, actualStack)
    },
    dump ({ includeChildren = false } = {}) {
      if (includeChildren) {
        return sharedLogger.dumpRecursive(stateNode)
      }
      return stateNodeData
    }
  }
}

function Diagnostics (bindable, bindableKey) {
  if (!sharedLogger.isBound(bindable)) {
    sharedLogger.bindKey(bindable, bindableKey)
  }

  const stateNode = sharedLogger.getBindableStateNode(bindable)
  return createDiagnosticsEntry(stateNode)
}

module.exports = {
  Diagnostics,
  getSharedState () {
    return sharedLogger.dumpRecursive()['/'] || {}
  },
  bindableExists (bindable) {
    return sharedLogger.isPathBound(bindable)
  },
  traverseSharedStatePath (keyPath) {
    return sharedLogger.traversePathToStateNode(keyPath)
  }
}
