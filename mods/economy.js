{
  balance: {
    name: "balance",
    runtime: function(message, client, data) {
      message.channel.sendMessage(data.data.user[message.author.id].money);
    }
  }
}
