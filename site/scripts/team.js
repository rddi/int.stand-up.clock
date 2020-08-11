const TeamMembers = {
  getList: function() {
    let list = [];
    if (Memory.exists('standup-team-list')) {
      list = JSON.parse(Memory.get('standup-team-list'));
    }

    return list;
  },

  add: function(member) {
    let members = this.getList();

    members.push(member);

    this.save(members);
  },

  remove: function(member) {
    let members = this.getList();

    let i = 0;

    for(i = members.length - 1;i >= 0;i -= 1) {
      if(members[i] === member) {
        members.splice(i, 1);
      }
    }

    this.save(members);
  },
  save: function(members) {
    Memory.set('standup-team-list', JSON.stringify(members));
  }
};

