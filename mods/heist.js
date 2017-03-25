{
  heist: {
    name: "heist",
    startup: function(client, data) {
      data.bin.heistCrew = [];
      data.bin.heistState = 0; // 0: not running, 1: waiting for crew, 2: playing
      data.data.heistUsers = {};
      data.data.heistBanks = [{name: "Clash Royale", size: 2, money: 100, difficulty: 50}, {name: "SuperCell", size: 5, money: 500, difficulty: 30}];
      data.data.heistActions = [{text: "$name accidently tripped the alarm.", result: 2}, {text: "$name was shot by local security... but survived.", result: 3}, {text: "$name cut through that safe like butter.", result: 0}, {text: "$name slept in and completely forgot about the heist.", result: 1}, {text: "In the process of setting up the explosive, $name was explosively killed.", result: 4}]; // 0: win, 1: alive, 2: caught, 3: injured, 4: dead
      data.data.heistConfig = {jailTimer: 5 * 1000 * 60, deathTimer: 20 * 1000 * 60}
    },
    runtime: function(message, client, data) {
      function help() {
        message.channel.sendMessage("```" + me.prefix + "heist [join|stats|play|release|revive|heal|bailout]```");
      }
      var command = processCommand(message.content);
      if (command.params.length < 1) {
        help();
        return;
      }

      if (command.params[0] === "join") {
        if (typeof data.data.heistUsers[message.author.id] !== "undefined") {
          message.channel.sendMessage("You are already part of the crew.");
          return;
        }

        data.data.heistUsers[message.author.id] = {id: message.author.id, money: 0, status: 1, timer: 0};
        message.channel.sendMessage("Welcome to the crew, " + (message.member.nickname !== null ? message.member.nickname : message.author.username) + ".");
      } else if (command.params[0] === "play") {
        if (typeof data.data.heistUsers[message.author.id] === "undefined") {
          message.channel.sendMessage("You're not part of the crew yet. Try joining them first.");
          return;
        }

        var heister = data.data.heistUsers[message.author.id];

        if (heister.status === 2) {
          message.channel.sendMessage("You are apprehended currently.");
          return;
        }

        if (heister.status === 4) {
          message.channel.sendMessage("You are dead currently.");
          return;
        }

        if (data.bin.heistState === 0) {
          data.bin.heistState = 1;
          data.bin.heistCrew = [message.member];
          message.react("\u2714"); // :heavy_check_mark:
          message.channel.sendMessage("A heist is starting by " + makeMention(message.author.id) + ".");
          setTimeout(function() {

            data.bin.heistState = 2;
            for (var i = 0; i < data.data.heistBanks.length; i++) {
              console.log(data.data.heistBanks[i])
              if (data.data.heistBanks[i].size >= data.bin.heistCrew.length) {
                var bank = data.data.heistBanks[i];
                break;
              }
            }
            message.channel.sendMessage("The crew decided to raid " + bank.name + ".");

            for (var i = 0; i < data.bin.heistCrew.length; i++) {
              var user = data.data.heistUsers[data.bin.heistCrew[i].id];
              setTimeout(function(i) {
                var action = data.data.heistActions[Math.floor(Math.random() * data.data.heistActions.length)];

                if (user.status === 3 && action.result === 3) {
                  user.status = 4;
                } else if (user.status === 3 && action.result !== 4 && action.result !== 2) {
                  user.status = 3;
                } else {
                  user.status = action.result;
                }

                if (user.status === 4) {
                  user.timer = Date.now() + data.data.heistConfig.deathTimer;
                } else if (user.status === 2) {
                  user.timer = Date.now() + data.data.heistConfig.jailTimer;
                }

                message.channel.sendMessage(action.text.replace("$name", (data.bin.heistCrew[i].nickname !== null ? data.bin.heistCrew[i].nickname : data.bin.heistCrew[i].user.username))).then(function(message) {
                  var emote = "";
                  if (user.status === 0) {
                    emote = "\uD83D\uDCB0";
                  } else if (user.status === 1) {
                    emote = "\uD83D\uDEAB";
                  } else if (user.status === 2) {
                    emote = "\uD83D\uDE94";
                  } else if (user.status === 3) {
                    emote = "\uD83D\uDC89";
                  } else if (user.status === 4) {
                    emote = "\u2620";
                  }
                  message.react(emote);
                });
              }, i * 2500 + 2500, i);
            }

            setTimeout(function() {
              message.channel.sendMessage("The heist has ended.");
              data.bin.heistState = 0;
            }, data.bin.heistCrew.length * 2500 + 5000);

          }, 10 * 1000);
        } else if (data.bin.heistState === 1) {
          for (var i = 0; i < data.bin.heistCrew.length; i++) {
            if (data.bin.heistCrew[i].id === message.author.id) {
              return;
            }
          }

          data.bin.heistCrew.push(message.member);
          message.react("\u2714"); // :heavy_check_mark:
        } else if (data.bin.heistState === 2) {
          message.channel.sendMessage("The crew is already heisting. Wait for them to finish first.");
        }

      } else if (command.params[0] === "release") {
        if (typeof data.data.heistUsers[message.author.id] === "undefined") {
          message.channel.sendMessage("You're not part of the crew yet. Try joining them first.");
          return;
        }

        var heister = data.data.heistUsers[message.author.id];

        if (heister.status !== 2) {
          message.channel.sendMessage("You're not in jail.");
        } else if (heister.timer <= Date.now()) {
          heister.status = 1;
          message.channel.sendMessage("You've been released!");
        } else {
          var remaining = new Date(heister.timer - Date.now());
          var output = "";
          if (remaining.getHours() !== 0) {
            output += remaining.getHours() + " hour" + (remaining.getHours() !== 1 ? "s" : "") + ", ";
          }
          if (remaining.getMinutes() !== 0) {
            output += remaining.getMinutes() + " minute" + (remaining.getMinutes() !== 1 ? "s" : "") + ", ";
          }
          if (remaining.getSeconds() !== 0) {
            output += remaining.getSeconds() + " second" + (remaining.getSeconds() !== 1 ? "s" : "");
          }
          message.channel.sendMessage("You've still have " + output + " left on your sentence.");
        }
      } else if (command.params[0] === "revive") {
        if (typeof data.data.heistUsers[message.author.id] === "undefined") {
          message.channel.sendMessage("You're not part of the crew yet. Try joining them first.");
          return;
        }

        var heister = data.data.heistUsers[message.author.id];

        if (heister.status !== 4) {
          message.channel.sendMessage("You're not dead.");
        } else if (heister.timer <= Date.now()) {
          heister.status = 1;
          message.channel.sendMessage("You've been revived!");
        } else {
          var remaining = new Date(heister.timer - Date.now());
          var output = "";
          if (remaining.getHours() !== 0) {
            output += remaining.getHours() + " hour" + (remaining.getHours() !== 1 ? "s" : "") + ", ";
          }
          if (remaining.getMinutes() !== 0) {
            output += remaining.getMinutes() + " minute" + (remaining.getMinutes() !== 1 ? "s" : "") + ", ";
          }
          if (remaining.getSeconds() !== 0) {
            output += remaining.getSeconds() + " second" + (remaining.getSeconds() !== 1 ? "s" : "");
          }
          message.channel.sendMessage("You've still have " + output + " left until you can revive.");
        }
      } else if (command.params[0] === "bailout") {

      } else {
        help();
      }
    }
  }
}
