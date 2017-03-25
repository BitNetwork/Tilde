{
  export: {
    name: "export",
    runtime: function(message, client, data) {
      var exportJSON = JSON.stringify(data.data);
      var stream = new Buffer(exportJSON);
      message.channel.sendFile(stream, "export.json");
    }
  },
  import: {
    name: "import",
    runtime: function(message, client, data) {
      const lib_request = require("request");
      const lib_url = require("url");
      var attachements = message.attachments.array();
      if (attachements.length < 1) {
        message.channel.sendMessage("```" + me.prefix + "import {attachement}\n\nRestores data from a json attachement.```");
        return;
      }

      lib_request(attachements[0].url, function(error, response, body) {
        try {
          var importJSON = JSON.parse(body);
        } catch (error) {
          message.channel.sendMessage("File is not valid JSON.");
          return;
        }
        me.data[message.guild.id.toString()].data = importJSON;
        message.channel.sendMessage("Data imported.");
      });
    }
  }
}
