// Тут есть говнокод, так что не берите пример с меня. <:D
const fs = require('node:fs');
const { Client, Collection, Intents, WebhookClient } = require('discord.js');
const { token, webhook } = require('./config.json');
const client = new Client({ partials: ['MESSAGE', 'CHANNEL'], intents: ['GUILD_MESSAGES', 'GUILDS'] });
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}
var markov = require('markov');
var m = [];
const webhookClient = new WebhookClient({ url: webhook }, { allowedMentions: { parse: [], users: [], roles: [] }});
/*(async () => {
	const { Low, JSONFile } = await import('lowdb');
	const adapter = new JSONFile('db.json')
	const db = new Low(adapter)
	await db.read();
	db.data ||= { clones: [] };
	db.data.clones.forEach((clone, index) => {
		m[index] = markov(Math.floor(Math.random() * 4));
		m[index].seed(clone.messages.join('\n'));
	})
})();*/
const { nanoid } = require('nanoid');
const Fuse = require('fuse.js')

client.once('ready', async () => {
	console.log('Бот включился');
	await kobyakov();
	setInterval(async () => {
		await kobyakov();
	}, 300000)
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
  // console.log(interaction);
	try {
		await command.execute(interaction);
	} catch (error) {
    if (interaction.deferred) {
      return await interaction.editReply(`Произошла ошибка во время выполнения команды. Ошибка: \`\`\`js
${error}\`\`\``);
    }
		await interaction.reply({ content: `Произошла ошибка во время выполнения команды. Ошибка: \`\`\`js
${error}\`\`\``, ephemeral: true });
	}
});

client.on('messageCreate', async message => {
  if (message.webhookId) return;
  if (message.channel.id != '919570613444694034') return;
  // console.log(message.content);
  const { Low, JSONFile } = await import('lowdb');
  const adapter = new JSONFile('db.json')
  const db = new Low(adapter)
  await db.read();
	db.data ||= { clones: [] };
	let clonesMentioned = 0;
	let a4 = true;
	let index = 0;
  for (let clone of db.data.clones) {
    if (message.content.toLowerCase().includes(clone.name.toLowerCase())) {
			if (!m[index]) {
				m[index] = markov(Math.floor(Math.random() * 4));
				m[index].seed(clone.messages.join('\n'));
			}
			console.log(a4);
			if (!a4)
				return;
			if (clonesMentioned > 1) {
				await message.reply('Вы не можете упомянуть более 2 клона!');
				a4 = false;
			}
			if (!a4)
				return;
      webhookClient.send({
      	content: m[index].respond(message.content).join(' ').slice(0, 1999),
      	username: clone.name,
      	avatarURL: `https://cdn.discordapp.com/avatars/${clone.authorId}/${clone.avatar}.webp`
      });
			clonesMentioned += 1
    }
		if (typeof clone.scenarios !== 'undefined' && clone.scenarios.length > 0) {
			const fuse = new Fuse(clone.scenarios, {
				keys: [ 'q' ],
				includeScore: true
			});
			let glent = fuse.search(message.content);
			if (typeof glent !== 'undefined' && glent.length > 0) {
				glent = glent[0];
				if (glent.score < 0.1) {
					webhookClient.send({
		      	content: clone.scenarios[glent.refIndex].a,
		      	username: clone.name,
		      	avatarURL: `https://cdn.discordapp.com/avatars/${clone.authorId}/${clone.avatar}.webp`
		      });
				}
			}
		}
		index += 1;
  }
});

async function kobyakov() {
	const { Low, JSONFile } = await import('lowdb');
	const adapter = new JSONFile('db.json')
	const db = new Low(adapter)
	await db.read();
	db.data ||= { clones: [] };
	const random = Math.floor(Math.random() * (db.data.clones.length - 1));
	if (!m[random]) {
		m[random] = markov(Math.floor(Math.random() * 4));
		m[random].seed(db.data.clones[random].messages.join('\n'));
	}
	const status = `${db.data.clones[random].name}: ${m[random].respond(nanoid()).join(' ')}`;
	client.user.setActivity(status.slice(0, 75));
	console.log('Обновили статус')
}

client.login(token);
