{
  proxy: {
    name: "proxy",
    startup: function(guild, client, data) {
      data.bin.proxyCall = null;
      data.bin.remoteChannel = null;
      data.bin.ringing = 0; // 0: not ringing, 1: ringing, 2: incoming call
    },
    runtime: function(message, client, data) {
      const lib_qrImage = require("qr-image");
      const lib_streamToBuffer = require("stream-to-buffer");

      var command = processCommand(message.content);
      var selfId = message.guild.id + "/" + message.channel.id;

      if (command.params[0] === "code") {
        var code = lib_qrImage.image(selfId, {margin: 0, size: 4});
        lib_streamToBuffer(code, function(error, buffer) {
          message.channel.sendFile(buffer, "qr.png", "`" + selfId + "`");
        });
      } else if (command.params[0] === "call") {
        var id = command.params[1].split("/");
        if (id[0] === message.guild.id) {
          message.channel.sendMessage("You can't call your own server.");
          return;
        } else if (client.guilds.has(id[0]) === false || client.guilds.get(id[0]).channels.has(id[1]) === false) {
          message.channel.sendMessage("That channel isn't on my network.");
          return;
        }

        var remote = findData(id[0]);

        if (remote.bin.proxyCall !== null) {
          message.channel.sendMessage("That channel is already in a call.");
          return;
        }

        data.bin.remoteChannel = client.guilds.get(id[0]).channels.get(id[1]);
        data.bin.proxyCall = id;
        data.bin.ringing = 1;
        remote.bin.remoteChannel = message.channel;
        remote.bin.proxyCall = selfId.split("/");
        remote.bin.ringing = 2;

        message.channel.sendMessage("Connecting...");
        data.bin.remoteChannel.sendMessage("A call is incoming from `" + selfId + "`.");

        /*data.bin.remoteChannel.createCollector(function(remoteMessage) {
          return remoteMessage.author.id !== client.user.id;
        }).on("message", function(remoteMessage) {
          message.channel.sendMessage(message.author.username + "#" + message.author.discriminator + ": " + message.content);
        });*/
      } else if (command.params[0] === "accept") {
        if (data.bin.proxyCall === null) {
          message.channel.sendMessage("There's no incoming call.");
          return;
        }

        var id = data.bin.proxyCall;
        var remote = findData(id[0]);

        if (data.bin.ringing !== 2 || remote.bin.ringing !== 1) {
          message.channel.sendMessage("There's no incoming call.");
          return;
        }

        data.bin.remoteChannel.sendMessage("The remote client accepted the call.");
        message.channel.sendMessage("Call accepted.");

        remote.bin.ringing = 0;
        data.bin.ringing = 0;
      } else if (command.params[0] === "decline") {
        if (data.bin.proxyCall === null) {
          message.channel.sendMessage("There's no incoming call.");
          return;
        }

        var id = data.bin.proxyCall;
        var remote = findData(id[0]);

        if (data.bin.ringing !== 2 || remote.bin.ringing !== 1) {
          message.channel.sendMessage("There's no incoming call.");
          return;
        }

        data.bin.remoteChannel.sendMessage("The remote client declined the call.");
        message.channel.sendMessage("Call declined.");

        remote.bin.ringing = 0;
        remote.bin.proxyCall = null;
        remote.bin.remoteChannel = null;
        data.bin.ringing = 0;
        data.bin.proxyCall = null;
        data.bin.remoteChannel = null;
      } else if (command.params[0] === "end") {
        if (data.bin.proxyCall === null) {
          message.channel.sendMessage("There's no call ongoing.");
          return;
        }

        var id = data.bin.proxyCall;
        var remote = findData(id[0]);

        data.bin.remoteChannel.sendMessage("The remote client ended the call.");
        message.channel.sendMessage("Call ended.");

        remote.bin.ringing = 0;
        remote.bin.proxyCall = null;
        remote.bin.remoteChannel = null;
        data.bin.ringing = 0;
        data.bin.proxyCall = null;
        data.bin.remoteChannel = null;
      }
    },
    message: function(message, client, data) {
      if (data.bin.proxyCall !== null && message.author.id !== client.user.id && data.bin.ringing === 0 && message.channel.id === findData(data.bin.proxyCall[0]).bin.remoteChannel.id) {
        data.bin.remoteChannel.sendMessage(message.author.username + "#" + message.author.discriminator + ": " + message.content);
      }
    }
  }
}
