import { combineReducers } from 'redux';
import {
  SELECT_ODD, REQUEST_ODD, RECEIVE_ODD, REQUEST_P5, RECEIVE_P5,
  INCLUDE_MODULES, EXCLUDE_MODULES, INCLUDE_ELEMENTS, EXCLUDE_ELEMENTS
} from '../actions'
import traverse from 'traverse'

// Helper functions
let getCurrentModules = function(state='') {
  // Get the keys of current moduleRefs
  return traverse(state.customization.json)
    .reduce(function (acc, x) {
      if (this.key == "moduleRef") acc = x
      return acc
    })
    .reduce(function (acc, x) {
      // NB this key is a TEI attribute, not a traverse.js key.
      acc.push(x.$.key)
      return acc
    }, [])
}

function selectedOdd(state = '', action) {
  switch (action.type) {
    case SELECT_ODD:
      return action.odd_url
    default:
      return state
  }
}

function odd(state = {}, action) {
  let currentModules, updatedOdd
  switch (action.type) {
    case RECEIVE_ODD:
    case REQUEST_ODD:
      return Object.assign({}, state,
        customization(state[action.odd], action)
      )
    case RECEIVE_P5:
    case REQUEST_P5:
      return Object.assign({}, state,
        p5(state[action.odd], action)
      )
    case INCLUDE_MODULES:
      currentModules = getCurrentModules(state)
      // Find modules that need inclusion
      let modulesToInclude = action.modules.filter(x => (currentModules.indexOf(x) == -1))
      // Create elements
      for (module of modulesToInclude) {
        //<moduleRef key="#{module}"/>
        updatedOdd = traverse(state.customization.json)
        .map(function (x) {
          if (this.key == "moduleRef") {
            this.update([...x, {'$': {'key': module}}])
          }
        })
      }
      // Update state
      return Object.assign({}, state,
        updateOdd(state[customization], updatedOdd)
      )
    case EXCLUDE_MODULES:
      // Remove elements
      for (module of action.modules) {
        updatedOdd = traverse(state.customization.json)
        .map(function (x) {
          if (this.key == "moduleRef") {
            this.update(x.filter(mr => mr.$.key != module))
          }
        })
      }
      // Update state
      return Object.assign({}, state,
        updateOdd(state[customization], updatedOdd)
      )
    case INCLUDE_ELEMENTS:

      updatedOdd = traverse(state.customization.json)
        .map(function (x) {
          if (this.key == "moduleRef") {
            let updatedRefs = []
            for (let mr of x) {
              if (mr.$.key == action.module) {
                // @include and @exclude are mutually exclusive
                if (mr.$.exclude) {
                  delete mr.$.exclude
                }
                let includes = new Set((mr.$.include || "").split(" "))
                includes.add(action.elements)
                mr.$.include = Array.from(includes).join(" ")
              }
              updatedRefs.push(mr)
            }
            this.update(updatedRefs)
          }
        })

      // Update state
      return Object.assign({}, state,
        updateOdd(state[customization], updatedOdd)
      )
      case EXCLUDE_ELEMENTS:

        updatedOdd = traverse(state.customization.json)
          .map(function (x) {
            if (this.key == "moduleRef") {
              let updatedRefs = []
              for (let mr of x) {
                if (mr.$.key == action.module) {
                  // @include and @exclude are mutually exclusive
                  if (mr.$.include) {
                    delete mr.$.include
                  }
                  let excludes = new Set((mr.$.exclude || "").split(" "))
                  excludes.add(action.elements)
                  mr.$.exclude = Array.from(excludes).join(" ")
                }
                updatedRefs.push(mr)
              }
              this.update(updatedRefs)
            }
          })

        // Update state
        return Object.assign({}, state,
          updateOdd(state[customization], updatedOdd)
        )
    default:
      return state
  }
}

function updateOdd(state = {
  customization: {isFetching: false}
}, odd) {
  return Object.assign({}, state, {
    customization: {
      isFetching: false,
      json: odd
    }
  })
}

function customization(state = {
  customization: { isFetching: false }
}, action) {
  switch (action.type) {
    case REQUEST_ODD:
      return Object.assign({}, state, {
        customization: {isFetching: true }
      })
    case RECEIVE_ODD:
      return Object.assign({}, state, {
        customization: {
          isFetching: false,
          xml: action.xml,
          json: action.json,
          lastUpdated: action.receivedAt
        }
      })
    default:
      return state
  }
}

function p5(state = {
  localsource: { isFetching: false }
}, action) {
  switch (action.type) {
    case REQUEST_P5:
      return Object.assign({}, state, {
        localsource: {isFetching: true}
      })
    case RECEIVE_P5:
      return Object.assign({}, state, {
        localsource: {
          isFetching: false,
          xml: action.xml,
          json: action.json,
          lastUpdated: action.receivedAt
        }
      })
    default:
      return state
  }
}

const romajsApp = combineReducers({
  selectedOdd,
  odd
})

export default romajsApp;
