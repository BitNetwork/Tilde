# Tilde

## Running the bot
You can add my instance of Tilde to your server via auth.html or [here](https://discordapp.com/oauth2/authorize?permissions=1610087503&scope=bot&client_id=268230663025590274). This might be seldomly running and not secured (i.e. no permissions).

You can run your instance via cloning the repository
```git clone https://github.com/BitNetwork/Tilde.git```
installing the dependencies,
```npm install discord.js node-opus```
configuring config.json to operate on your bot's token and executing the tilde.js.
```/bin/nodejs tilde.js```

## Configuring Modifications
Modifications to the bot can be added via the config.json file under the `mods` key.
Mods is an array consisting of the files as a string. Example below will include the main, file, music, moderator, command, enconomy & heist mods into Tilde:
```"mods": ["./mods/main.js", "./mods/file.js", "./mods/music.js", "./mods/mod.js", "./mods/command.js", "./mods/economy.js", "./mods/heist.js"]```

## Writing Modifications
Modifications are done in a JSON-like format, with the additional capabilities of ECMAScript. The mod must contain an array of commands. Each command must have a unique key and name property, otherwise the first duplicate command will be used.

### Events
Events are used to interact your command with the discord client.

#### startup
Takes parameters of `client, data`.
Ran on bot and mod ready state.

#### runtime
Takes parameters of `message, client, data`.
Ran when command name is called in any visible channel and not prevented by `commandvalidate`.

#### commandvalidate
Takes parameters of `message, client, data`.
Ran when any command is called with a runtime. Return true to authorize the called command. Return false to block command from executing.

#### reactionadd
Takes parameters of `reaction, client, data` where `reaction = [ReactionMessage, User]`.
Ran when any reaction is added by any user in any visible channel.
