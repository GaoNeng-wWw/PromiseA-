const isFunction = obj => typeof obj === 'function'
const isObject = obj => !!(obj && typeof obj === 'object')
const isThenable = obj => (isFunction(obj) || isObject(obj)) && 'then' in obj
const isPromise = promise => promise instanceof Promise

const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

const stack = [];

class Promise {
  constructor(
    executor
  ){
    this.state = PENDING;this.value = null;this.cbs = [];
    this.lock = false;

    const onFulfilled = value => this.#transition(FULFILLED, value)
    const onRejected = reason => this.#transition(REJECTED, reason)
    const resolve = value => {
      if (this.lock) return;
      this.lock = true;
      this.#resolvePromise(value,onFulfilled,onRejected);
    }
    const reject = reason => {
      if (this.lock) return;
      this.lock= true;
      onRejected(reason);
    }
    try {
      executor(onFulfilled, onRejected);
    } catch (e){
      reject(e);
    }
  }
  #resolvePromise(value, resolve,reject){
    if (value === this){
      return reject(new TypeError("Can not fufill promise with itself"));
    }
    if (isPromise(value)){
      return value.then(resolve,reject);
    }
    if (isThenable(value)){
      try {
        if (isFunction(value.then)){
          const then = value.then
          return new Promise(then.bind(value)).then(resolve,reject);
        }
      } catch (e){
        return reject(e);
      }
    }
    resolve(value);
  }
  #transition(state,value){
    if (this.state !== PENDING){return;}
    this.state = state;
    this.value = value;
    setTimeout(() => {
      while(this.cbs.length){
        let f = this.cbs.shift();
        this.#handleCallback(f, state, value);
      }
    }, 0);
  }
  #handleCallback(cb,state,value){
    const {onFulfilled,onRejected, resolve, reject} = cb;
    try {
      if (state === FULFILLED){
        isFunction(onFulfilled) ? resolve(onFulfilled(value)) : resolve(value);
      }
      if (state === REJECTED){
        isFunction(onRejected) ? resolve(onRejected(value)) : reject(value);
      }
    } catch (e){
      reject(e);
    }
  }
  then(onFulfilled, onRejected){
    return new Promise((resolve,reject) => {
      const cb = {onFulfilled,onRejected, resolve, reject};
      if (this.state === PENDING){
        this.cbs.push(cb);
      } else {
        setTimeout(() => {
          this.#handleCallback(cb, this.state, this.value)
        }, 0);
      }
    })
  }
}

module.exports = Promise;