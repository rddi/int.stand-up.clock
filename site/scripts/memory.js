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
  },
  remove: function(index) {
    if(Storage.hasOwnProperty(index)) {
      delete Storage[index];
    }
  },
  partial: function(_partial) {
    let output = {};
    for(let item in Storage) {
      if (item.startsWith(_partial)) {
        output[item] = Storage[item];
      }
    }

    return output;
  }
}