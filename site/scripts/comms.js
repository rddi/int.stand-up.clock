let mqtt,
    reconnectTimeout = 2000,
    host = 'mqtt.edflabs.net',
    port = 8081, //MQTT over WebSockets, encrypted
    mqtt_username = 'standup',
    mqtt_password = '7h31&0n1yrddi!'; 


const Comms = {
  params: {
    meetingCode: null,
    clientName: null,
    channel: null,
    registered: false,
    uniqueCode: null,
    connected: false,
    meetingFound: false,
  },
  MQTTConnect: function(_meetingId = 'all') {
    console.log(`connecting to ${host}:${port}`);

    Comms.params.meetingCode = _meetingId;
    Comms.params.channel = `standup_${_meetingId}`;

    mqtt = new Paho.MQTT.Client(host, port, `client_id_${parseInt(Math.random() * 100, 10)}`);
    let options = {
      timeout: 5,
      onSuccess:Comms.onConnect,
      onFailure:Comms.onError,
      useSSL: true,
      userName: mqtt_username,
      password: mqtt_password,
    };

    // mqtt.username_pw_set(mqtt_username, mqtt_password);

    // mqtt.onConnectionLost = Comms.onConnectionLost;

    mqtt.onMessageArrived = Comms.onMessageArrived;

    Page.flashMessage(`Attempting to connect to channel`, 'notice');

    mqtt.connect(options);
  },
  onConnect: function(e) {
    console.log('connected', e);
    mqtt.subscribe(Comms.params.channel);

    console.log(`Channel: ${Comms.params.channel}`);

    Page.flashMessage(`Connection to channel established`, 'success');

    Comms.params.connected = true;

    if(connectHandler) {
      connectHandler();
    }
  },
  onError: function(err) {
    console.log('error!');
    console.log(err);

    Page.flashMessage(`Failed to connect to channel`, 'error');

    setTimeout(function(){
      Page.flashMessage(`Retrying connection to channel`, 'notice');
      Comms.MQTTConnect(Comms.params.meetingCode);
    }, reconnectTimeout);
  },
  onMessageArrived: function(message) {
    if(typeof handleReciept === 'function') {
      handleReciept(message);
    }
  },
  onConnectionLost: function() {
    if (!Comms.params.connected) {
      return;
    }
    Page.flashMessage('Connection lost','error');
    Page.flashMessage('Retrying connection','notice');
    Comms.MQTTConnect(Comms.params.meetingCode);
  },
  isConnected: function() {
    return Comms.params.connected;
  },
  disconnect: function() {
    Comms.params.channel = null;
    Comms.params.registered = false;
    Page.flashMessage(`You have been disconnected`, 'error');
    Comms.params.meetingCode = null;
    Comms.params.connected = false;
    mqtt.disconnect();
  },
  broadcastMessage:function(_message) {
    let message = new Paho.MQTT.Message(_message);
    message.destinationName = Comms.params.channel;
    mqtt.send(message);
  },
  sendEvent:function(_body, _type="Message") {
    let output = {
      type: _type,
      client: Comms.params.clientName,
      body: _body
    };

    Comms.broadcastMessage(JSON.stringify(output));
  }
}