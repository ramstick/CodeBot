const Discord = require("discord.js");
const secret = require("./secret.js");

const commands = require("./run.js");
const { PythonShell } = require('python-shell');

var bot = new Discord.Client();
var channel = null;
var shell = null;
var out = 0;
var err = 0;

var cached_message = "";
var sending = false;
var current_timeout;

function sendCached() {
    if (cached_message.length < 2000) {
        channel.send(cached_message);
        cached_message = "";
        sending = false;
        current_timeout = null;
    } else {
        channel.send(cached_message.slice(0, 2000));
        cached_message = cached_message.slice(2000);
        sending = true;
        current_timeout = setTimeout(sendCached, 1000);
    }
}

function setupShell() {
    shell = new PythonShell('./test.py', {
        pythonOptions: ["-i"],
    });
    shell.on("message", function(message) {
        if (channel) {
            cached_message += "Out[" + out + "]: " + message + "\n";
            if (!sending) {
                sending = true;
                sendCached();
            }
            out++;
        }
    })
    shell.on('stderr', function(stderr) {
        if (channel) {
            channel.send("Error[" + err + "]: " + stderr);
            err++;
        }
    });
}
setupShell();

bot.on("ready", () => {
    console.log("Bot is not dead!");
});

bot.on("message", (msg) => {
    let m = msg.content.slice(msg.content.indexOf(" ") + 1);
    let comm = msg.content.split(" ")[0];
    channel = msg.channel;
    if (comm == "!python") {
        if (m.indexOf("```") != -1) {
            lines = m.slice(m.indexOf("```") + 3, m.lastIndexOf("```")).split("\n")
            lines.forEach(element => {
                shell.send(element);
            });
        } else {
            shell.send(m);
        }
    } else if (comm == "!pythonstop") {
        console.log("KILLING SHELL")
        if (current_timeout) {
            clearTimeout(current_timeout);
            cached_message = "";
            sending = false;
        }
        shell.kill();
        setupShell();

    }
});

bot.on("disconnect", () => {
    console.log("FUCK!");
})

bot.login(secret.token);