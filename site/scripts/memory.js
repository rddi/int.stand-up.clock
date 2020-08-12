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
  exists: function(variable) {
    let output = this.get(variable);
    if (output == null) {
      return false;
    }
    return true;
  }
}