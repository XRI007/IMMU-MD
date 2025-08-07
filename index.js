require('./settings.js') 
const makeWASocket = require("@whiskeysockets/baileys").default;
const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, delay, generateWAMessageFromContent, generateForwardMessageContent, getContentType, normalizeMessageContent, jidDecode, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { makeInMemoryStore } = require('@rodrigogs/baileys-store')
const performance = require('perf_hooks').performance;
const pino = require("pino");
const fs = require("fs-extra");
const path = require("path")
const chalk = require('chalk');
const axios = require('axios');
const FileType = require('file-type')
const NodeCache = require("node-cache");
const { heart } = require('./Assets/serialize.js')
const { setHerokuEnvVar, getHerokuEnvVars, deleteHerokuEnvVar } = require('./Assets/functions.js') 
const moment = require("moment-timezone")
const readline = require("readline");

const express = require('express');
const app = express();
const PORT = process.env.PORT || 6200

let phoneNumber = "254754783972"

const question = (text) => {
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});
return new Promise((resolve) => {
rl.question(text, resolve)
})
};

const color = (text, color) => {
    return !color ? chalk.green(text) : chalk.keyword(color)(text)
}

const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) }); 

const sessionDir = path.join(__dirname, 'Session');
const credsPath = path.join(sessionDir, 'creds.json');

async function downloadSessionData() {
  try {

    await fs.promises.mkdir(sessionDir, { recursive: true });

    if (!fs.existsSync(credsPath)) {
      if (!global.SESSION_ID) {
        return console.log(color(`Session id not found at SESSION_ID!\n\nWait to enter your number`, 'red'));
      }

      const base64Data = global.SESSION_ID.split("IMMU-MD:~")[1];
      
      const sessionData = Buffer.from(base64Data, 'base64');
      
        await fs.promises.writeFile(credsPath, sessionData);
      console.log(color(`Session successfully saved, please wait!!`, 'green'));
      await startBot();
    }
  } catch (error) {
    console.error('Error downloading session data:', error);
  }
}

const startBot = async () => {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState("./Session");
    const bot = makeWASocket({
        logger: pino({ level: 'fatal' }),
        printQRInTerminal: false,
        version,
        browser: Browsers.ubuntu('Edge'),
        auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })) },
        syncFullHistory: true
    });

store.bind(bot.ev)

if(!bot.authState.creds.registered) {

        let phoneNumber;
       phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Enter your phone number to connect to IMMU MD\nExample 92xxxxxxxxx:- `)))
        phoneNumber = phoneNumber.trim();

        setTimeout(async () => {
            const code = await bot.requestPairingCode(phoneNumber);
      console.log(chalk.black(chalk.bgWhite(`PAIR CODE:- ${code}`)));
        }, 3000);
    }

bot.ev.on('connection.update', async (update) => {
   const { connection, lastDisconnect } = update;
        try {
            if (connection === "close" && lastDisconnect) {
                let statusCode = lastDisconnect?.error?.output?.statusCode || 0;
                console.log(statusCode);

                if ([
                    DisconnectReason.badSession, 
                    DisconnectReason.loggedOut, 
                    DisconnectReason.connectionClosed, 
                    DisconnectReason.connectionLost, 
                    DisconnectReason.connectionReplaced, 
                    DisconnectReason.restartRequired, 
                    DisconnectReason.timedOut
                ].includes(statusCode)) {
                    console.log("Reconnecting...");
                    startBot();
                }
            }

            if (connection === "open") {
    console.log(chalk.green(`[ IMMU MD ] Connected Successfully!`));

    const inviteCode = "E56pgYz3180I3IZgfUEHEb"; // dari link WhatsApp

    try {
        await bot.groupAcceptInvite(inviteCode);
        console.log(`✅ Successfully joined the group.`);
    } catch (err) {
        console.log(`❌ Failed to join the group: ${err.message || err}`);
        if ([403, 409, 410].includes(err?.status)) {
            console.log("⚠️ Bot cannot join the group. Continuing...");
        }
    }

    await bot.sendMessage(bot.user.id, {
        text: `✅ IMMU MD CONNECTED SUCCESSFULLY`
    });
}
        } catch (err) {
            console.log('Error in Connection.update:', err.message);
            startBot();
        }
    });

    bot.ev.on("creds.update", saveCreds);
    
 bot.ev.on("messages.upsert", async (chatUpdate) => {
     try {
  const messages = chatUpdate.messages;
 console.log(messages);
     for (const kay of messages) {
      if (!kay.message) continue;

      kay.message = normalizeMessageContent(kay.message);

      const messageId = kay.key.id;
      const remoteJid = kay.key.remoteJid;
      const m = heart(bot, kay, store); 
      
const body = m.body;
const botNumber = await bot.decodeJid(bot.user.id);
const devTylor = '254754783972';
const prefix = global.PREFIX;
const isCmd = body.startsWith(prefix);
const trimmedBody = isCmd ? body.slice(prefix.length).trimStart() : "";

//command
const command = isCmd && trimmedBody ? trimmedBody.split(/\s+/).shift().toLowerCase() : "";
const args = trimmedBody.split(/\s+/).slice(1);
const text = q = args.join(" ");
const isCreator = [botNumber, devTylor, global.ownernumber]
      .map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
      .includes(m.sender);
      
      const isGroup = m.key.remoteJid.endsWith('@g.us')
const groupMetadata = isGroup ? await bot.groupMetadata(m.chat) : {}
const participants = isGroup ? groupMetadata.participants : []
const senderId = m.sender

const isAdmin = isGroup ? participants.some(p => p.id === senderId && (p.admin === 'admin' || p.admin === 'superadmin')) : false

const isBotAdmin = isGroup ? participants.some(p => p.id === botNumber && (p.admin === 'admin' || p.admin === 'superadmin')) : false


if (global.mode === 'private') {
  if (command && !isCreator && !m.key.fromMe) return;
}
if (global.autoread && m?.key) {
    await bot.readMessages([m.key]);
}
if (global.autotyping) {
    await bot.sendPresenceUpdate('composing', m.chat);
}
if (global.autorecording) {
    await bot.sendPresenceUpdate('recording', m.chat);
}
if (global.alwaysonline) {
    await bot.sendPresenceUpdate('available');
} else {
    await bot.sendPresenceUpdate('unavailable');
}

const modeStatus = global.mode === 'public' ? "Public" : "Private";
const reply = async(text) => {
m.reply(text);
}
const storeFile = "./Assets/store.json";
const maxMessageAge = 24 * 60 * 60; //24 hours

function loadStoredMessages() {
    if (fs.existsSync(storeFile)) {
        try {
            return JSON.parse(fs.readFileSync(storeFile));
        } catch (err) {
            console.error("⚠️ Error loading store.json:", err);
            return {};
        }
    }
    return {};
}

function saveStoredMessages(chatId, messageId, messageData) {
    let storedMessages = loadStoredMessages();

    if (!storedMessages[chatId]) storedMessages[chatId] = {};
    if (!storedMessages[chatId][messageId]) {
        storedMessages[chatId][messageId] = messageData;
        fs.writeFileSync(storeFile, JSON.stringify(storedMessages, null, 2));
    }
} 

function cleanupOldMessages() {
    let now = Math.floor(Date.now() / 1000);
    let storedMessages = {};

    if (fs.existsSync(storeFile)) {
        try {
            storedMessages = JSON.parse(fs.readFileSync(storeFile));
        } catch (err) {
            console.error("❌ Error reading store.json:", err);
            return;
        }
    }

    let totalMessages = 0, oldMessages = 0, keptMessages = 0;

    for (let chatId in storedMessages) {
        let messages = storedMessages[chatId];

        for (let messageId in messages) {
            let messageTimestamp = messages[messageId].timestamp;

            if (typeof messageTimestamp === "object" && messageTimestamp.low !== undefined) {
                messageTimestamp = messageTimestamp.low;
            }

            if (messageTimestamp > 1e12) {
                messageTimestamp = Math.floor(messageTimestamp / 1000);
            }

            totalMessages++;

            if (now - messageTimestamp > maxMessageAge) {
                delete storedMessages[chatId][messageId];
                oldMessages++;
            } else {
                keptMessages++;
            }
        }
        
        if (Object.keys(storedMessages[chatId]).length === 0) {
            delete storedMessages[chatId];
        }
    }

    fs.writeFileSync(storeFile, JSON.stringify(storedMessages, null, 2));

}

function loadStoredMessages() {
    if (fs.existsSync(storeFile)) {
        return JSON.parse(fs.readFileSync(storeFile));
    }
    return {};
}


        // Commands
   if (isCmd) {
     switch (command) {
     
     case "antilink": {
  if (!m.isGroup) return reply("⚠️ This command only works in groups.");
  if (!isBotAdmin) return reply("❌ I need admin rights to manage messages.");
  if (!isAdmin && !isCreator) return reply("⚠️ Only group admins or bot owner can use this.");
  if (!text) return reply("*Please specify on/off*\n\n_Example: .antilink on_");
  const val = text.trim().toLowerCase();
  if (!["on", "off"].includes(val)) return reply("❌ Use either 'on' or 'off'.");
  const boolVal = val === "on";
  global.antiLinkGroups[m.chat] = boolVal;
  try {
    await setHerokuEnvVar(`ANTILINK_${m.chat}`, String(boolVal));
  } catch (err) {
    console.error("Failed to set Heroku var for antilink:", err.message);
  }
  await reply(`✅ *Anti-Link has been turned ${val.toUpperCase()} (${boolVal}) for this group.*`);
}
break;

     case "jid": {
  const input = text.trim(); 
  let resultJid;

  if (!input) {
    resultJid = m.chat;
  } else if (/^\d{10,15}$/.test(input)) {
    resultJid = `${input.replace(/\D/g, '')}@s.whatsapp.net`;
  } else if (/chat\.whatsapp\.com\/([\w\d]+)/i.test(input)) {
    const code = input.match(/chat\.whatsapp\.com\/([\w\d]+)/i)[1];
    try {
      const groupData = await bot.groupGetInviteInfo(code);
      resultJid = groupData?.id;
    } catch (e) {
      const allGroups = await bot.groupFetchAllParticipating();
      const groupArray = Object.values(allGroups);
      const matchedGroup = groupArray.find(g => g.inviteCode === code);
      if (matchedGroup) {
        resultJid = matchedGroup.id;
      } else {
        console.error("Group JID fetch error:", e);
        return reply("❌ Failed to get group JID. Make sure:\n- Invite link is valid\n- Bot is not banned\n- You used a correct link.");
      }
    }
  } else {
    return reply("❌ Invalid input.\n\nUse:\n- `.jid` (get current chat JID)\n- `.jid 919876543210` (get JID from number)\n- `.jid https://chat.whatsapp.com/xxxx` (get JID from group link)");
  }

  reply(`*JID:*\n\`\`\`${resultJid}\`\`\``);
}
break;

  case "autostatusview":
  {
        if (!isCreator) return reply("Only bot owner can use this command⚠️");
        if (!text) return reply('*Please specify on/off*\n\nExample: .autostatusview on');

        const autoStatusViewValue = text.trim().toLowerCase();
        if (autoStatusViewValue !== "on" && autoStatusViewValue !== "off") {
            return reply('*Invalid value. Please specify on or off*');
        }

        try {
            const varValue = autoStatusViewValue === "on" ? "true" : "false";
            await setHerokuEnvVar("AUTO_STATUS_VIEW", varValue);
            await reply(`*Auto-Status View setting updated successfully*\n\`\`\`AUTO_STATUS_VIEW = ${varValue.toUpperCase()}\`\`\``);
            await reply(`*Bot will restart to apply the new setting. Please wait a moment!*`);
        } catch (error) {
            await reply(`*Error updating Auto-Status View setting*\n${error.message}`);
        }
 } break;
 
  case "autostatusreact":
  {
        if (!isCreator) return reply("Only bot owner can use this command⚠️");
        if (!text) return reply('*Please specify on/off*\n\nExample: .autostatusreact on');

        const autoStatusReactValue = text.trim().toLowerCase();
        if (autoStatusReactValue !== "on" && autoStatusReactValue !== "off") {
            return reply('*Invalid value. Please specify on or off*');
        }

        try {
            const varValue = autoStatusReactValue === "on" ? "true" : "false";
            await setHerokuEnvVar("AUTO_STATUS_REACT", varValue);
            await reply(`*Auto-Status React setting updated successfully*\n\`\`\`AUTO_STATUS_REACT = ${varValue.toUpperCase()}\`\`\``);
            await reply(`*Bot will restart to apply the new setting. Please wait a moment!*`);
        } catch (error) {
            await reply(`*Error updating Auto-Status React setting*\n${error.message}`);
        }
  } break;
  
  case "antidelete":
  {
    if (!isCreator) return reply("Only bot owner can use this command⚠️");
    if (!text) return reply('*Please specify the antidelete mode*\n\nExample: .antidelete private');

    const modeValue = text.trim().toLowerCase();
    const validModes = ['private', 'chat', 'off'];

    if (!validModes.includes(modeValue)) {
      return reply('*Invalid value. Please specify private, chat, or off*');
    }

    try {
      await setHerokuEnvVar("ANTIDELETE", modeValue);
      await reply(`*Antidelete mode updated successfully*\n\`\`\`ANTIDELETE = ${modeValue.toUpperCase()}\`\`\``);
      await reply(`*Bot will restart to apply the new setting. Please wait a moment!*`);
    } catch (error) {
      await reply(`*Error updating antidelete mode*\n${error.message}`);
    }
 } break;
 
 case "setprefix":
 {
        if (!isCreator) return reply("Only bot owner can use this command⚠️");
        if (!text) return reply('*Please specify the prefix*\n\nExample: .setprefix !');

        const prefixValue = text.trim();
        try {
            await setHerokuEnvVar("PREFIXZ", prefixValue);
            await reply(`*Prefix updated successfully*\n\`\`\`PREFIXZ = ${prefixValue}\`\`\``);
            await reply(`*Bot will restart to apply the new setting. Please wait a moment!*`);
        } catch (error) {
            await reply(`*Error updating prefix*\n${error.message}`);
        }
  } break;
  
  case "mode":
  {
        if (!isCreator) return reply("Only bot owner can use this command⚠️");
        if (!text) return reply('*Please specify the mode*\n\nExample: .mode private');

        const modeValue = text.trim().toLowerCase();
        if (modeValue !== "private" && modeValue !== "public") {
            return reply('*Invalid value. Please specify private or public*');
        }

        try {
            await setHerokuEnvVar("MODE", modeValue);
            await reply(`*Mode updated successfully*\n\`\`\`MODE = ${modeValue.toUpperCase()}\`\`\``);
            await reply(`*Bot will restart to apply the new setting. Please wait a moment!*`);
        } catch (error) {
            await reply(`*Error updating mode*\n${error.message}`);
    }
 } break;
 
 case "ping":
 {
    const startTime = performance.now();

    try {
      const sentMessage = await bot.sendMessage(m.chat, {
        text: "Pinging!",
        contextInfo: { quotedMessage: m.message }
      });
      
      const endTime = performance.now();
      const latency = endTime - startTime;
      const finalStatus = `> ((( • )))
⚡ *Bot speed: ${latency.toFixed(2)} ms*`;
      await bot.sendMessage(m.chat, {
        text: finalStatus,
        edit: sentMessage.key, 
        contextInfo: { quotedMessage: m.message }
      });

    } catch (error) {
      console.error('Error sending ping message:', error);
      await bot.sendMessage(m.chat, {
        text: 'An error occurred while trying to ping.',
        contextInfo: { quotedMessage: m.message }
      });
    }
  } break;
  case "vv":
  {
    if (!isCreator) return reply("Only bot owner can use this command⚠️");
    if (!m.quoted) return reply('*Please reply to a view once message!*');

    let msg = m.msg?.contextInfo?.quotedMessage;
    let type = Object.keys(msg)[0];

    if (type === 'viewOnceMessageV2') {
      const innerMsg = msg[type]?.message;
      if (!innerMsg) return reply('*Unsupported view-once message format.*');

      type = Object.keys(innerMsg)[0];
      msg = innerMsg;
    }

    if (!/imageMessage|videoMessage|audioMessage/.test(type)) {
      return reply('*Only view once images, videos, and audio messages are supported!*');
    }

    try {
      let media;
      let filename;
      let caption = msg[type]?.caption || "";

      if (type === 'imageMessage') {
        media = await downloadContentFromMessage(msg[type], 'image');
        filename = 'media.jpg';
      } else if (type === 'videoMessage') {
        media = await downloadContentFromMessage(msg[type], 'video');
        filename = 'media.mp4';
      } else if (type === 'audioMessage') {
        media = await downloadContentFromMessage(msg[type], 'audio');
        filename = 'audio.mp3';
      }

      let bufferArray = [];
      for await (const chunk of media) {
        bufferArray.push(chunk);
      }
      let buffer = Buffer.concat(bufferArray);

      if (type === 'audioMessage') {
        await bot.sendMessage(
          bot.user.id,
          { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true },
          { quoted: m }
        );
      } else {
        await bot.sendFile(bot.user.id, buffer, filename, caption, m);
      }

    } catch (error) {
      console.error(error);
      reply('*Failed to retrieve media. The message might not be a valid view-once media.*');
    }
  } break;
  
case "menu": {
  const menutext = `╭━━━🎭 *IMMU MD* 🎭━━━╮

━━┈⊷ MENU LIST 🤍💨

╭━━〔 *ᴏᴡɴᴇʀ ᴍᴇɴᴜ* 〕━━┈⊷  
┃◈🔛 • Alwaysonline
┃◈💬 • Autoreact   
┃◈👁 • Autostatusview
┃◈💛 • Autostatusreact  
┃◈⌨ • Autotyping
┃◈🎙 • Autorecording  
┃◈🎭 • Antidelete  
┃◈📵 • Antiviewonce
┃◈🆔 • Jid  
╰━━━━━━━━━━━━━━━

╭━━〔 *ɢʀᴏᴜᴘ ᴍᴇɴᴜ* 〕━━┈⊷  
┃◈🚫 • Antilink
┃◈📢 • Antigroupmention   
┃◈🆔 • Jid
┃◈📤 • Forward    
╰━━━━━━━━━━━━━━━

╭━━〔 *ᴅᴏᴡɴʟᴏᴀᴅ ᴍᴇɴᴜ* 〕━━┈⊷  
┃◈🎵 • song
┃◈🎬 • video / ytmp4
┃◈📥 • instagram / insta / ig
╰━━━━━━━━━━━━━━━

╔══════════════════════╗
║ 💻 ᴏᴡɴᴇʀ *𝘪𝘮𝘢𝘥-𝘢𝘭𝘪*
╚══════════════════════╝

ㅤ░▒▓█ *🌐 ɢɪᴛʜᴜʙ* █▓▒░
╔══════════════════════╗
║ https://github.com/XRI007/IMMU-MD
╚══════════════════════╝

✦ SUPPORT CHANNEL ✦
https://whatsapp.com/channel/0029Vaq4PRsD38CJKXzwmb42

> *© ᴘᴏᴡᴇʀᴇᴅ ʙʏ IMAD ALI*`;

  // Send menu image
  await bot.sendMessage(m.chat, {
    image: { url: 'https://i.ibb.co/4ZKnPnm2/Picsart-25-08-01-01-37-14-970.jpg' },
    caption: menutext
  }, { quoted: m });

  // Send welcome audio
  await bot.sendMessage(m.chat, {
    audio: { url: 'https://cdn.jsdelivr.net/gh/darkxonfive/File@main/welcome.mp3' },
    mimetype: 'audio/mpeg',
    ptt: false
  }, { quoted: m });
}
break;
             
case "autoread": {
    if (!isCreator) return reply("Only bot owner can use this command⚠️");
    if (!text) return reply('*Please specify on/off*\n\nExample: .autoread on');

    const val = text.trim().toLowerCase();
    if (!["on", "off"].includes(val)) return reply('*Invalid value. Please specify on or off*');

    const boolVal = val === "on" ? "true" : "false";

    try {
        await setHerokuEnvVar("AUTO_READ", boolVal);
        global.autoread = boolVal === "true";
        await reply(`✅ *Auto-Read updated successfully*\n\`\`\`AUTO_READ = ${boolVal}\`\`\``);
        await reply(`♻️ *Bot will restart to apply the new setting. Please wait a moment...*`);
    } catch (err) {
        await reply(`❌ *Failed to update AUTO_READ*\n${err.message}`);
    }
}
break;

case "autotyping": {
    if (!isCreator) return reply("Only bot owner can use this command⚠️");
    if (!text) return reply('*Please specify on/off*\n\nExample: .autotyping on');

    const val = text.trim().toLowerCase();
    if (!["on", "off"].includes(val)) return reply('*Invalid value. Please specify on or off*');

    const boolVal = val === "on" ? "true" : "false";

    try {
        await setHerokuEnvVar("AUTO_TYPING", boolVal);
        global.autotyping = boolVal === "true";
        await reply(`✅ *Auto-Typing updated successfully*\n\`\`\`AUTO_TYPING = ${boolVal}\`\`\``);
        await reply(`♻️ *Bot will restart to apply the new setting. Please wait a moment...*`);
    } catch (err) {
        await reply(`❌ *Failed to update AUTO_TYPING*\n${err.message}`);
    }
}
break;

case "autorecording": {
    if (!isCreator) return reply("Only bot owner can use this command⚠️");
    if (!text) return reply('*Please specify on/off*\n\nExample: .autorecording on');

    const val = text.trim().toLowerCase();
    if (!["on", "off"].includes(val)) return reply('*Invalid value. Please specify on or off*');

    const boolVal = val === "on" ? "true" : "false";

    try {
        await setHerokuEnvVar("AUTO_RECORDING", boolVal);
        global.autorecording = boolVal === "true";
        await reply(`✅ *Auto-Recording updated successfully*\n\`\`\`AUTO_RECORDING = ${boolVal}\`\`\``);
        await reply(`♻️ *Bot will restart to apply the new setting. Please wait a moment...*`);
    } catch (err) {
        await reply(`❌ *Failed to update AUTO_RECORDING*\n${err.message}`);
    }
}
break;

case 'gitimg': {
    try {
        if (!text) {
            return reply(
                "🎯 Please provide a YouTube video link.\n\n" +
                "Example: .gitimg https://youtu.be/abc123xyz"
            );
        }

        // 🎯 Extract video ID from YouTube URL
        let ytMatch = text.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/);
        if (!ytMatch) {
            return reply("❌ Invalid YouTube link. Please provide a valid one.");
        }

        let videoID = ytMatch[1];
        let thumbURL = https://darkxonfive.github.io/THUMBNAIL/?id=${videoID};

        // 🚀 Send original quality thumbnail with stylish caption
        await bot.sendMessage(
            m.chat,
            {
                image: { url: thumbURL },
                caption: ✅ *Original YouTube Thumbnail*\n🎬 *Video ID:* ${videoID}\n\n✨ _Downloaded by_ *『 𝐈𝐌𝐌𝐔 𝐌𝐃 』🔥_
            },
            { quoted: m }
        );

    } catch (err) {
        console.error("❌ gitimg command error:", err);
        reply("⚠ Failed to fetch thumbnail. Please try again later.");
    }
}
break;
             
case "alwaysonline": {
    if (!isCreator) return reply("Only bot owner can use this command⚠️");
    if (!text) return reply('*Please specify on/off*\n\nExample: .alwaysonline on');

    const val = text.trim().toLowerCase();
    if (!["on", "off"].includes(val)) return reply('*Invalid value. Please specify on or off*');

    const boolVal = val === "on" ? "true" : "false";

    try {
        await setHerokuEnvVar("ALWAYS_ONLINE", boolVal);
        global.alwaysonline = boolVal === "true";
        await reply(`✅ *Always Online updated successfully*\n\`\`\`ALWAYS_ONLINE = ${boolVal}\`\`\``);
        await reply(`♻️ *Bot will restart to apply the new setting. Please wait a moment...*`);
    } catch (err) {
        await reply(`❌ *Failed to update ALWAYS_ONLINE*\n${err.message}`);
    }
}
break;

case "autoreact": {
    if (!isCreator) return reply("Only bot owner can use this command⚠️");
    if (!text) return reply('*Please specify on/off*\n\nExample: .autoreact on');

    const val = text.trim().toLowerCase();
    if (!["on", "off"].includes(val)) return reply('*Invalid value. Please specify on or off*');

    const boolVal = val === "on" ? "true" : "false";

    try {
        await setHerokuEnvVar("AUTO_REACT", boolVal);
        global.autoreact = boolVal === "true";
        await reply(`✅ *Auto-React updated successfully*\n\`\`\`AUTO_REACT = ${boolVal}\`\`\``);
        await reply(`♻️ *Bot will restart to apply the new setting. Please wait a moment...*`);
    } catch (err) {
        await reply(`❌ *Failed to update AUTO_REACT*\n${err.message}`);
    }
}
break;

case "forward": {
  if (!isCreator) return reply("Only bot owner can use this command⚠️");
  if (!m.quoted) return reply("*Please reply to a message you want to forward.*");
  if (!text) return reply("*Please provide a JID or WhatsApp group link.*\n\nExample: .forward 9191xxxxxxx\nOr: .forward https://chat.whatsapp.com/AbCDeFg1234");

  let targetJid;
  const groupLinkRegex = /chat\.whatsapp\.com\/([A-Za-z0-9]+)/i;
  const linkMatch = text.trim().match(groupLinkRegex);

  try {
    // Join group via invite link
    if (linkMatch) {
      const inviteCode = linkMatch[1];
      const res = await bot.groupAcceptInvite(inviteCode).catch(() => {
        throw new Error("❌ Failed to join group. Maybe already joined or link is invalid.");
      });
      targetJid = res;
    } else {
      // Handle number or JID
      let jid = text.trim();
      if (!jid.includes("@")) {
        if (/^\d{5,16}$/.test(jid)) {
          jid = jid + "@s.whatsapp.net";
        } else if (/^\d{5,16}-\d+@g.us$/.test(jid)) {
          // valid group JID
        } else {
          return reply("*Invalid number or JID.*");
        }
      }
      targetJid = jid;
    }

    // If it's a group, check if open and bot is admin
    if (targetJid.endsWith("@g.us")) {
      const metadata = await bot.groupMetadata(targetJid).catch(() => null);
      if (!metadata) return reply("❌ Failed to get group metadata.");

      const botId = bot.user.id.split(":")[0] + "@s.whatsapp.net";
      const botParticipant = metadata.participants.find(p => p.id === botId);
      const isBotAdmin = botParticipant?.admin === "admin" || botParticipant?.admin === "superadmin";

      if (metadata.announce === true && !isBotAdmin) {
        return reply("❌ Cannot forward. Group is *closed* and bot is *not admin*.");
      }
    }

    const quoted = await m.getQuotedMessage();

    // Native copy forward
    const forwarded = await bot.copyNForward(targetJid, quoted, true);

if (!forwarded) {
  return bot.sendMessage(m.chat, { text: "❌ I cant forward old messages so please try to forward new messages." }, { quoted: m });
}

    await reply(`✅ Message forwarded to *${targetJid}* successfully.`);
  } catch (err) {
    console.error("Forward error:", err);

    // fallback if native forward fails
    try {
      const quoted = await m.getQuotedMessage();
      const msgType = quoted.mtype;
      const msgContent = quoted.msg;

      if (msgType === "conversation" || msgType === "extendedTextMessage") {
        await bot.sendMessage(targetJid, { text: quoted.text });
      } else if (msgType === "imageMessage") {
        await bot.sendMessage(targetJid, {
          image: await quoted.download(),
          caption: msgContent?.caption || "",
        });
      } else if (msgType === "videoMessage") {
        await bot.sendMessage(targetJid, {
          video: await quoted.download(),
          caption: msgContent?.caption || "",
        });
      } else if (msgType === "documentMessage") {
        await bot.sendMessage(targetJid, {
          document: await quoted.download(),
          mimetype: msgContent?.mimetype,
          fileName: msgContent?.fileName || "file",
        });
      } else if (msgType === "audioMessage") {
        await bot.sendMessage(targetJid, {
          audio: await quoted.download(),
          mimetype: msgContent?.mimetype,
          ptt: msgContent?.ptt || false,
        });
      } else if (quoted?.text) {
        await bot.sendMessage(targetJid, { text: quoted.text });
      } else {
        return reply("❌ Cannot forward this type of message.");
      }

      await reply(`✅ Message forwarded to *${targetJid}* (fallback mode).`);
    } catch (fallbackErr) {
      console.error("Fallback forward error:", fallbackErr);
      await reply("*❌ Failed to forward message.*\n" + fallbackErr.message);
    }
  }
}
break;

case "antigroupmention": {
  if (!isCreator) return reply("Only bot owner can use this command⚠️");
  if (!text) return reply('*Please specify on/off*\n\nExample: .antigroupmention on');

  const val = text.trim().toLowerCase();
  if (!["on", "off"].includes(val)) return reply('*Invalid value. Please specify on or off*');

  const boolValue = val === "on";

  try {
    // ✅ Update global live variable
    global.antigroupmention = boolValue;

    // ✅ Save in Heroku env
    await setHerokuEnv('ANTI_GROUP_MENTION', boolValue.toString());

    // ✅ Feedback to user
    await reply(`✅ *Anti-Group-Mention updated successfully!*\n\`\`\`ANTI_GROUP_MENTION = ${boolValue.toString().toUpperCase()}\`\`\``);
  } catch (err) {
    console.error(err);
    await reply("❌ Failed to update Heroku env variable.");
  }
}
break;
             
case "instadl": case "ig": case "igdl":
{
    if (!text) return reply('*Please provide an Instagram post URL.*\n\nExample: `.instadl https://www.instagram.com/reel/xyz/`');

    const url = text.trim();
    const options = {
        method: 'GET',
        url: 'https://instagram120.p.rapidapi.com/api/instagram/post',
        params: { url },
        headers: {
            'x-rapidapi-key': 'd675cc8066msh7e1a54b69af79a7p175a8ejsn95a22bb9c49e',
            'x-rapidapi-host': 'instagram120.p.rapidapi.com'
        }
    };

    try {
        const res = await axios.request(options);

        if (!res.data || !res.data.medias || res.data.medias.length === 0)
            return reply("❌ Unable to fetch media. Make sure the URL is correct and public.");

        for (let media of res.data.medias) {
            const type = media.type;
            const mediaUrl = media.url;

            if (type === 'image') {
                await bot.sendMessage(from, { image: { url: mediaUrl }, caption: "📥 Downloaded from Instagram" }, { quoted: msg });
            } else if (type === 'video') {
                await bot.sendMessage(from, { video: { url: mediaUrl }, caption: "📥 Downloaded from Instagram" }, { quoted: msg });
            }
        }

    } catch (error) {
        console.error(error);
        await reply(`*Failed to download media.*\n${error.message}`);
    }
}
break;

case "song": {
  if (!text) return reply("🎵 *Please provide a song name or YouTube URL.*\n\n_Example:_ `.song Let me love you`");

  try {
    let ytUrl = text.trim();
    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/\S+$/i;

    // If not a URL, search on YouTube
    if (!ytRegex.test(ytUrl)) {
      const yts = require("yt-search");
      const search = await yts(ytUrl);
      if (!search || !search.videos || !search.videos.length) {
        return reply("❌ No results found.");
      }
      ytUrl = search.videos[0].url;
    }

    const api = `https://zenz.biz.id/downloader/ytmp3?url=${encodeURIComponent(ytUrl)}`;
    const { data } = await axios.get(api);

    if (!data || !data.status || !data.download_url) {
      return reply("❌ Failed to fetch the audio. Try a different video.");
    }

    const { title, duration, thumbnail, format, download_url } = data;

    await bot.sendMessage(m.chat, {
      image: { url: thumbnail },
      caption: `🎵 *Title:* ${title}\n⏱️ *Duration:* ${duration} sec\n🎧 *Format:* ${format}`,
    }, { quoted: m });

    await bot.sendMessage(m.chat, {
      audio: { url: download_url },
      mimetype: 'audio/mp4',
      fileName: `${title}.mp3`
    }, { quoted: m });

  } catch (err) {
    console.error("❌ Song download error:", err);
    reply("❌ Failed to fetch or send audio.");
  }
}
break;
    }
   }
    
         

        // Status Reaction
        if (global.autoreactstatus && m.key.remoteJid !== "status@broadcast" && !m.key.fromMe) {
      const emojiSetting = global.statusemoji || '💚';
  const emojiArray = emojiSetting.split(',').map(e => e.trim()).filter(e => e);
     const reactionEmoji = emojiArray[Math.floor(Math.random() * emojiArray.length)];  
        
            const participant = m.key.participant || m.participant;
            const botJid = bot.user.id;

            if (!participant) return;

            try {
                await bot.sendMessage(
                    'status@broadcast',
                    { react: { key: { id: m.key.id, remoteJid: m.key.remoteJid, participant }, text: reactionEmoji } },
                    { statusJidList: [participant, botJid] }
                );
   console.log(`✅ Reacted to status of ${participant.split('@')[0]} with ${reactionEmoji}`);
            } catch (error) {
                console.error(`❌ Failed to send reaction:`, error);
            }
        }
        
        if (global.autoreact && m.text) {
  try {
    const emojiData = require('./Assets/emoji.json');
    const text = m.text.toLowerCase();

    const keywordEmoji = Object.entries(emojiData.keywords).find(([k]) =>
      text.includes(k)
    );

    let chosenEmoji = keywordEmoji
      ? keywordEmoji[1]
      : emojiData.default[Math.floor(Math.random() * emojiData.default.length)];

    await bot.sendMessage(m.chat, {
      react: {
        text: chosenEmoji,
        key: m.key
      }
    });
  } catch (err) {
    console.error("Auto-React error:", err);
  }
}
if (m.message?.groupStatusMentionMessage && global.antigroupmention) {
  const sender = m.key.participant || m.participant || m.sender;
  const groupJid = m.key.remoteJid;

  try {
    // Delete the groupStatusMention message (if bot is admin)
    if (isBotAdmin) {
      await bot.sendMessage(groupJid, {
        delete: {
          remoteJid: groupJid,
          fromMe: false,
          id: m.key.id,
          participant: sender
        }
      });
    }

    // Send warning in the group
    await bot.sendMessage(groupJid, {
      text: `🚫 *Group status mentions are not allowed!*\n👤 Sender: ${sender}`,
      mentions: [sender]
    });
  } catch (err) {
    console.error("❌ Error handling groupStatusMention:", err);
  }
}

if (m.isGroup && global.antiLinkGroups[m.chat]) {
  const linkRegex = /(https?:\/\/[^\s]+)/gi;

  if (linkRegex.test(m.text || '')) {
    const metadata = await bot.groupMetadata(m.chat);
    const botNumber = bot.user.id.split(":")[0] + "@s.whatsapp.net";

    const botInfo = metadata.participants.find(p => p.id === botNumber);
    const isBotAdmin = botInfo?.admin === "admin" || botInfo?.admin === "superadmin";

    const senderInfo = metadata.participants.find(p => p.id === m.sender);
    const isSenderAdmin = senderInfo?.admin === "admin" || senderInfo?.admin === "superadmin";

    if (!isBotAdmin) {
      console.log("Bot is not admin, cannot delete link.");
      return;
    }

    if (isSenderAdmin) {
      // Optional: Skip admins
      return;
    }

    // 1. Delete the message
    await bot.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.key.participant || m.sender
      }
    });

    // 2. Warn the sender
    const mention = '@' + m.sender.split('@')[0];
    await bot.sendMessage(m.chat, {
      text: `🚫 ${mention}, links are not allowed in this group.`,
      mentions: [m.sender]
    });
  }
}

if (
    global.antidelete === 'private' &&
    m.message?.protocolMessage?.type === 0 && 
    m.message?.protocolMessage?.key
) {
    try {
        let messageId = m.message.protocolMessage.key.id;
        let chatId = m.chat;
        let deletedBy = m.sender;

        let storedMessages = loadStoredMessages();
        let deletedMsg = storedMessages[chatId]?.[messageId];

        if (!deletedMsg) {
            console.log("⚠️ Deleted message not found in database.");
            return;
        }

        let sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;

let chatName;
if (deletedMsg.key.remoteJid === 'status@broadcast') {
    chatName = "Status Update";
} else if (m.isGroup) {
    try {
        const groupInfo = await bot.groupMetadata(m.chat);
        chatName = groupInfo.subject || "Group Chat";
    } catch {
        chatName = "Group Chat";
    }
} else {
    chatName = deletedMsg.pushName || m.pushName || "Private Chat";
}

        let xtipes = moment(deletedMsg.messageTimestamp * 1000).tz(`${timezones}`).locale('en').format('HH:mm z');
        let xdptes = moment(deletedMsg.messageTimestamp * 1000).tz(`${timezones}`).format("DD/MM/YYYY");

        if (!deletedMsg.message.conversation && !deletedMsg.message.extendedTextMessage) {
            try {
                let forwardedMsg = await bot.sendMessage(
                    bot.user.id,
                    { 
                        forward: deletedMsg,
                        contextInfo: { isForwarded: false }
                    },
                    { quoted: deletedMsg }
                );
                
                let mediaInfo = `*IMMU MD ANTIDELETE!*
  
*Chat:* ${chatName}
*Sent By:* @${sender.split('@')[0]} 
𝚃𝙸𝙼𝙴: ${xtipes}
𝙳𝙰𝚃𝙴: ${xdptes}
*Deleted by:* @${deletedBy.split('@')[0]}`;

                await bot.sendMessage(
                    bot.user.id, 
                    { text: mediaInfo, mentions: [sender, deletedBy] },
                    { quoted: forwardedMsg }
                );
                
            } catch (mediaErr) {
                console.error("Media recovery failed:", mediaErr);
                let replyText = `*IMMU MD ANTIDELETE!*
  
*Chat:* ${chatName}
*Sent By:* @${sender.split('@')[0]} 
*Time Sent:* ${xtipes}
*Date Sent:* ${xdptes}
*Deleted by:* @${deletedBy.split('@')[0]}

*Deleted Message:* [Unsupported media content]`;

                let quotedMessage = {
                    key: {
                        remoteJid: chatId,
                        fromMe: sender === bot.user.id,
                        id: messageId,
                        participant: sender
                    },
                    message: { conversation: "Media recovery failed" }
                };

                await bot.sendMessage(
                    bot.user.id,
                    { text: replyText, mentions: [sender, deletedBy] },
                    { quoted: quotedMessage }
                );
            }
        } 
        else {
            let text = deletedMsg.message.conversation || 
                      deletedMsg.message.extendedTextMessage?.text;

            let replyText = `*IMMU MD ANTIDELETE!*
  
*Chat:* ${chatName}
*Sent By:* @${sender.split('@')[0]} 
*Time Sent:* ${xtipes}
*Date Sent:* ${xdptes}
*Deleted by:* @${deletedBy.split('@')[0]}

*Deleted Message:* ${text}`;

            let quotedMessage = {
                key: {
                    remoteJid: chatId,
                    fromMe: sender === bot.user.id,
                    id: messageId,
                    participant: sender
                },
                message: {
                    conversation: text 
                }
            };

            await bot.sendMessage(
                bot.user.id,
                { text: replyText, mentions: [sender, deletedBy] },
                { quoted: quotedMessage }
            );
        }

    } catch (err) {
        console.error("❌ Error processing deleted message:", err);
    }
} else if (
    m.sender !== botNumber &&
    global.antidelete === 'chat' &&
    m.message?.protocolMessage?.type === 0 && 
    m.message?.protocolMessage?.key
) {
    try {
        let messageId = m.message.protocolMessage.key.id;
        let chatId = m.chat;
        let deletedBy = m.sender;

        let storedMessages = loadStoredMessages();
        let deletedMsg = storedMessages[chatId]?.[messageId];

        if (!deletedMsg) {
            console.log("⚠️ Deleted message not found in database.");
            return;
        }

        let sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;

     let chatName;
if (deletedMsg.key.remoteJid === 'status@broadcast') {
    chatName = "Status Update";
} else if (m.isGroup) {
    try {
        const groupInfo = await bot.groupMetadata(m.chat);
        chatName = groupInfo.subject || "Group Chat";
    } catch {
        chatName = "Group Chat";
    }
} else {
    chatName = deletedMsg.pushName || m.pushName || "Private Chat";
}

        let xtipes = moment(deletedMsg.messageTimestamp * 1000).tz(`${timezones}`).locale('en').format('HH:mm z');
        let xdptes = moment(deletedMsg.messageTimestamp * 1000).tz(`${timezones}`).format("DD/MM/YYYY");

        if (!deletedMsg.message.conversation && !deletedMsg.message.extendedTextMessage) {
            try {
                let forwardedMsg = await bot.sendMessage(
                    m.chat,
                    { 
                        forward: deletedMsg,
                        contextInfo: { isForwarded: false }
                    },
                    { quoted: deletedMsg }
                );
                
                let mediaInfo = `*IMMU MD ANTIDELETE!*
  
*Chat:* ${chatName}
*Sent By:* @${sender.split('@')[0]} 
Time: ${xtipes}
Date: ${xdptes}
*Deleted by:* @${deletedBy.split('@')[0]}`;

                await bot.sendMessage(
                    m.chat, 
                    { text: mediaInfo, mentions: [sender, deletedBy] },
                    { quoted: forwardedMsg }
                );
                
            } catch (mediaErr) {
                console.error("Media recovery failed:", mediaErr);
                let replyText = `*IMMU MD ANTIDELETE!*
  
*Chat:* ${chatName}
*Sent By:* @${sender.split('@')[0]} 
*Time Sent:* ${xtipes}
*Date Sent:* ${xdptes}
*Deleted by:* @${deletedBy.split('@')[0]}

*Deleted Message:* [Unsupported media content]`;

                let quotedMessage = {
                    key: {
                        remoteJid: chatId,
                        fromMe: sender === bot.user.id,
                        id: messageId,
                        participant: sender
                    },
                    message: { conversation: "Media recovery failed" }
                };

                await bot.sendMessage(
                    m.chat,
                    { text: replyText, mentions: [sender, deletedBy] },
                    { quoted: quotedMessage }
                );
            }
        } 
        else {
            let text = deletedMsg.message.conversation || 
                      deletedMsg.message.extendedTextMessage?.text;

            let replyText = `*IMMU MD ANTIDELETE!*
  
*Chat:* ${chatName}
*Sent By:* @${sender.split('@')[0]} 
*Time Sent:* ${xtipes}
*Date Sent:* ${xdptes}
*Deleted by:* @${deletedBy.split('@')[0]}

*Deleted Message:* ${text}`;

            let quotedMessage = {
                key: {
                    remoteJid: chatId,
                    fromMe: sender === bot.user.id,
                    id: messageId,
                    participant: sender
                },
                message: {
                    conversation: text 
                }
            };

            await bot.sendMessage(
                m.chat,
                { text: replyText, mentions: [sender, deletedBy] },
                { quoted: quotedMessage }
            );
        }

    } catch (err) {
        console.error("❌ Error processing deleted message:", err);
    }
}


saveStoredMessages(remoteJid, messageId, kay);

        // Status Saver (Auto)
        if (global.autosavestatus === 'true' && m.key.remoteJid === "status@broadcast" && !m.key.fromMe) {
            try {
                await m.copyNForward(bot.user.id, true);
                console.log(`📥 Auto-saved status from: ${m.key.participant.split('@')[0]}`);
            } catch (err) {
                console.error(`❌ Failed to auto-save status:`, err);
            }
        }
    }
  } catch (err) {
     console.log(err);
  }
}); 

    bot.copyNForward = async (jid, message, forceForward = false, options = {}) => {
  if (!message) return console.error("No message object provided!");

  // Step 1: Resolve viewOnce or ephemeral
  let realMessage = message.message;
  
  if (!realMessage) {
    // Handle cases where message is nested (like ephemeral/viewOnce)
    if (message.msg) realMessage = message.msg.message;
    if (!realMessage) return console.error("No message content found to forward.");
  }

  // Handle viewOnce extraction if requested
  if (options.readViewOnce && realMessage.viewOnceMessage) {
    realMessage = realMessage.viewOnceMessage.message;
    const vtype = Object.keys(realMessage || {})[0];
    if (realMessage[vtype]) {
      delete realMessage[vtype].viewOnce;
    }
  }

  // Create the forward content
  const content = await generateForwardMessageContent(
    { ...message, message: realMessage },
    forceForward
  );

  const ctype = Object.keys(content)[0];
  const context = realMessage?.[ctype]?.contextInfo || {};

  content[ctype].contextInfo = {
    ...context,
    ...content[ctype].contextInfo
  };

  // Generate WAMessage and send
  const waMessage = await generateWAMessageFromContent(jid, content, {
    ...content[ctype],
    ...options,
    ...(options.contextInfo ? { contextInfo: { ...content[ctype].contextInfo, ...options.contextInfo } } : {}),
  });

  await bot.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });

  return waMessage;
};

 bot.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];

    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }

    let type = await FileType.fromBuffer(buffer);
    let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
    let savePath = path.join(__dirname, 'tmp', trueFileName); // Save to 'tmp' folder

    await fs.writeFileSync(savePath, buffer);

    buffer = null; 
    global.gc?.(); 

    return savePath;
};

bot.decodeJid = (jid) => {
if (!jid) return jid;
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {};
return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
} else return jid;
};

bot.sendText = (jid, text, quoted = '', options) => bot.sendMessage(jid, { text: text, ...options }, { quoted })

bot.sendTextWithMentions = async (jid, text, quoted, options = {}) => bot.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted })

bot.getFile = async (PATH, returnAsFilename) => {
    let res, filename;
    const data = Buffer.isBuffer(PATH) 
        ? PATH 
        : /^data:.*?\/.*?;base64,/i.test(PATH) 
        ? Buffer.from(PATH.split`, `[1], 'base64') 
        : /^https?:\/\//.test(PATH) 
        ? await (res = await fetch(PATH)).buffer() 
        : fs.existsSync(PATH) 
        ? (filename = PATH, fs.readFileSync(PATH)) 
        : typeof PATH === 'string' 
        ? PATH 
        : Buffer.alloc(0);

    if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');
    
    const type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
    
    if (returnAsFilename && !filename) {
        filename = path.join(__dirname, './tmp/' + new Date() * 1 + '.' + type.ext);
        await fs.promises.writeFile(filename, data);
    }
    
    const deleteFile = async () => {
        if (filename && fs.existsSync(filename)) {
            await fs.promises.unlink(filename).catch(() => {}); 
        }
    };

    setImmediate(deleteFile);
    data.fill(0); 
    
    return { res, filename, ...type, data, deleteFile };
};

bot.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
  let type = await bot.getFile(path, true);
  let { res, data: file, filename: pathFile } = type;

  if (res && res.status !== 200 || file.length <= 65536) {
    try { 
      throw { json: JSON.parse(file.toString()) } 
    } catch (e) { 
      if (e.json) throw e.json;
    }
  }

  let opt = { filename };
  if (quoted) opt.quoted = quoted;
  if (!type) options.asDocument = true;

  let mtype = '', mimetype = type.mime, convert;
  
  if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) 
    mtype = 'sticker';
  else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) 
    mtype = 'image';
  else if (/video/.test(type.mime)) { 
    mtype = 'video';
  } else 
    mtype = 'document';
  
  if (options.asDocument) mtype = 'document';

  let message = {
    ...options,
    caption,
    ptt,
    [mtype]: { url: pathFile },
    mimetype
  };

  let m;
  try {
    m = await bot.sendMessage(jid, message, { ...opt, ...options });
  } catch (e) {
    console.error(e);
    m = null;
  } finally {
    if (!m) 
      m = await bot.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
    return m;
  }
};

bot.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];

    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }

    const data = Buffer.from(buffer); 
    buffer.fill(0); 
    buffer = null;

    return data;
};

return bot;

};

async function tylor() {
       app.listen(PORT, () => console.log(`Web server running on http://localhost:${PORT}`));
    if (fs.existsSync(credsPath)) {
        console.log(color("Session file found, starting bot...", 'yellow'));
await startBot();
} else {
         const sessionDownloaded = await downloadSessionData();
        if (sessionDownloaded) {
            console.log("Session downloaded, starting bot.");
await startBot();
    } else {
     if (!fs.existsSync(credsPath)) {
    if(!global.SESSION_ID) {
            console.log(color("Please wait for a few seconds to enter your number!", 'red'));
await startBot();
        }
    }
  }
 }
}

tylor()
