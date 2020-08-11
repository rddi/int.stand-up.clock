const Storage = window.localStorage;

const Memory = {
  get: function(variable) {
    let output = Storage.getItem(variable);
    return output;
  },
  set: function(variable, value){
    Storage.setItem(variable, value);
  },
  exists: function(variable) {
    let output = this.get(variable);
    if (output == null) {
      return false;
    }
    return true;
  }
}