let mqtt,
    reconnectTimeout = 2000,
    host = 'test.mosquitto.org',
    port = 8080; //MQTT over WebSockets, unencrypted


const Comms = {
  params: {
    meetingCode: null,
    clientName: null,
    channel: null,
    registered: false,
    uniqueCode: null,
    connected: false,
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
    };

    mqtt.onMessageArrived = Comms.onMessageArrived;

    Page.flashMessage(`Attempting to connect to meeting`, 'notice');

    mqtt.connect(options);
  },
  onConnect: function() {
    console.log('connected');
    mqtt.subscribe(Comms.params.channel);

    console.log(`Channel: ${Comms.params.channel}`);

    Comms.params.connected = true;

    if(connectHandler) {
      connectHandler();
    }
  },
  onError: function(err) {
    console.log('error!');
    console.log(err);

    Page.flashMessage(`Failed to connect to meeting`, 'error');

    setTimeout(function(){
      Page.flashMessage(`Retrying connection to meeting`, 'notice');
      Comms.MQTTConnect(Comms.params.meetingCode);
    }, reconnectTimeout);
  },
  onMessageArrived: function(message) {
    if(typeof handleReciept === 'function') {
      handleReciept(message);
    }
  },
  isConnected: function() {
    return Comms.params.connected;
  },
  disconnect: function() {
    mqtt.disconnect();
    Comms.params.channel = null;
    Comms.params.registered = false;
    Page.flashMessage(`Disconnected from meeting "${Comms.params.meetingCode}"`, 'error');
    Comms.params.meetingCode = null;
    Comms.params.connected = false;
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