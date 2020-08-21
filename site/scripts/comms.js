let mqtt,
    reconnectTimeout = 2000,
    host = 'test.mosquitto.org',
    port = 8080; //MQTT over WebSockets, unencrypted


const Comms = {
  params: {
    meetingCode: 'all',
    clientName: 'default',
    channel: 'standup_all',
    registered: false,
    uniqueCode: null
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
    };

    mqtt.onMessageArrived = Comms.onMessageArrived;

    Page.flashMessage(`Attempting to connect to meeting "${_meetingId}"`, 'notice');

    mqtt.connect(options);
  },
  onConnect: function() {
    console.log('connected');
    mqtt.subscribe(Comms.params.channel);

    console.log(`Channel: ${Comms.params.channel}`);

    if(connectHandler) {
      connectHandler();
    }
  },
  onError: function(err) {
    console.log('error!');
    console.log(err);

    Page.flashMessage(`Failed to connect to meeting "${Comms.params.meetingCode}"`, 'error');

    setTimeout(function(){
      Page.flashMessage(`Retrying connection to meeting "${Comms.params.meetingCode}"`, 'notice');
      Comms.MQTTConnect(Comms.params.meetingCode);
    }, reconnectTimeout);
  },
  onMessageArrived: function(message) {
    if(typeof handleReciept === 'function') {
      handleReciept(message);
    }
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