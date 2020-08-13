const Storage = window.localStorage;

const Memory = {
  set: function(variable, value){
    Storage.setItem(variable, value);
  },
  get: function(variable) {
    let output = Storage.getItem(variable);
    return output;
  },
  getBoolean: function(_variable) {
    let variable = this.get(_variable);

    return variable == "true";
  },
  setObject: function(_variable, _value) {
    let value = JSON.stringify(_value);

    this.set(_variable, value);
  },
  getObject: function(_variable) {
    let variable = this.get(_variable);

    return JSON.parse(variable);
  },
  exists: function(_variable) {
    let output = this.get(_variable);
    if (output == null) {
      return false;
    }
    return true;
  }
}