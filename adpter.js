const P = require("./index")

const resolved = value => Promise.resolve(value)
const rejected = reason => Promise.reject(reason)
const deferred = () => {
  let promise, resolve, reject
  promise = new P(($resolve, $reject) => {
    resolve = $resolve
    reject = $reject
  })
  return { promise, resolve, reject }
}

module.exports = { resolved, rejected, deferred }