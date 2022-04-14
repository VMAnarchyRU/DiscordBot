const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('клон')
		.setDescription('Действия с клоном')
    .addSubcommand(subcommand =>
  		subcommand
  			.setName('создать')
  			.setDescription('Создаёт клона.')
  			.addStringOption(option => option.setName('название').setDescription('Название Вашего клона.').setRequired(true)))
  	.addSubcommand(subcommand =>
  		subcommand
  			.setName('переименовать')
  			.setDescription('Переименовывает Вашего клона.')
        .addStringOption(option => option.setName('название').setDescription('Новое название клона.').setRequired(true)))
		.addSubcommand(subcommand =>
  		subcommand
  			.setName('удалить')
  			.setDescription('Удаляет безвозвратно(!) Вашего клона.'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('список')
				.setDescription('Список всех клонов'))
		.addSubcommand(subcommand =>
			subcommand
				.setName('обновить_аватар')
				.setDescription('Обновляет аватар у Вашего клона. Полезно, если Вы поменяли аву, и она сломалась у клона'))
		.addSubcommand(subcommand =>
  		subcommand
  			.setName('создать_сценарий')
  			.setDescription('Создаёт «сценарий» — кто-то пишет сообщение («вопрос»), а клон пишет на него ответ.')
        .addStringOption(option => option.setName('вопрос').setDescription('Текст сообщения, на которое ответит клон').setRequired(true))
				.addStringOption(option => option.setName('ответ').setDescription('Ответ клона на вопрос.').setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('удалить_сценарий')
				.setDescription('Удаляет безвозвратно(!) один из Ваших сценариев')
				.addIntegerOption(option => option.setName('номер').setDescription('Номер сценария. Использовать только если более 5 сценариев').setRequired(false))),
	async execute(interaction) {
    const { Low, JSONFile } = await import('lowdb');
    const adapter = new JSONFile('db.json')
    const db = new Low(adapter)
	 	await db.read();
		db.data ||= { clones: [] };
		console.log(interaction.options.getSubcommand())
	  let cloneFound = false;
		switch (interaction.options.getSubcommand()) {
			case 'создать':

				for (let clone of db.data.clones) {
				 if (clone.authorId == interaction.member.id || clone.name == interaction.options.getString('название')) {
					 cloneFound = true
				 }
				}
				if (cloneFound)
					return await interaction.reply({ content: 'У Вас уже есть клон, либо клон с таким названием существует! Если Вы хотите его пересоздать, то сначала удалите его.', ephemeral: true });
				if (interaction.options.getString('название').length < 4)
					return await interaction.reply({ content: 'Название клона не должно быть менее 4 символов!', ephemeral: true });
				await interaction.deferReply();
				let messages = [];
				for (channel of interaction.client.channels.cache.filter(c => c.isText()).values()) {
					//console.log(channel.messages.cache.values());
					if (!channel.messages) {
						console.warn('Что происходит вообще');
						continue;
					}
					const glent = await channel.messages.fetch({ limit: 100 });
					console.log(glent);
					glent.forEach(msg => {
						if (msg.author.id == interaction.member.id)
							messages = messages.concat(msg.content);
					})
					/*channel.messages.fetch({
						limit: 100 // С дополнительными махинациями можно сделать и больше
					}).then(messages => {
					const glent = messages.filter(m => m.author.id === interaction.member.id);
					const asArray = Array.from(glent.values());
					messages = messages.concat(asArray);
				}).then(messages => {
						console.log(`Received ${messages.size} messages`);
						//Iterate through the messages here with the variable "messages".
						messages.forEach(message => console.log(message.content))
					})*/
			 }
			 console.log(interaction.member.avatar, interaction.member);
			 if (!(messages.length > 0))
				return interaction.editReply('Я не мог найти сообщения от тебя. Поразговаривай немного на сервере и создай своего клона опять.')
			 db.data.clones.push({
				 name: interaction.options.getString('название'),
				 authorId: interaction.member.id,
				 avatar: interaction.member.user.avatar,
				 messages: messages,
				 scenarios: []
			 });
			 await db.write();
			 await interaction.editReply('Клон создан! Общайтесь с ним в <#919570613444694034>.');
				break;
			case 'переименовать':

	 		 if (interaction.options.getString('название').length < 4)
	 			 return await interaction.reply({ content: 'Название клона не должно быть менее 4 символов!', ephemeral: true });
	 		 for (let clone of db.data.clones) {
	 			 if (clone.authorId == interaction.member.id) {
	 				 for (let clone of db.data.clones) {
	 					 if (clone.name == interaction.options.getString('название'))
	 					 	return await interaction.reply('Клон с таким названием уже существует!');
	 				 }
	 				 clone.name = interaction.options.getString('название');
	 				 await db.write();
	 				 interaction.reply('Клон успешно переименован!');
	 				 cloneFound = true
	 			 }
	 		 }
	 		 if (!cloneFound)
	 		 	await interaction.reply('Вы не создали клона! Создайте его через `/клон создать`.')
	 		 break;
			case 'удалить':
				const row = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId('yes')
						.setLabel('☑️')
						.setStyle('DANGER'),
					new MessageButton()
						.setCustomId('no')
						.setLabel('❎')
						.setStyle('SUCCESS'),
				);
				interaction.reply({ content: 'Вы уверены, что хотите безвозвратно удалить своего клона?', components: [row] });
				const collector = interaction.channel.createMessageComponentCollector({ filter: i => i.user.id === interaction.member.id, time: 15000 });
				collector.on('collect', async i => {
					if (i.customId === 'yes') {
						db.data.clones.forEach(async (clone, index) => {
						 if (clone.authorId == interaction.member.id) {
							 db.data.clones.splice(index, 1);
							 await db.write();
							 await i.update({ content: 'Клон успешно удалён. Пока, шизофренник...', components: [] });
						 }
						})
					} else {
						await interaction.deleteReply();
					}
				});
				break;
			case 'список':
				const embed = new MessageEmbed()
	 			.setColor('#ffd000')
	 			.setTitle('Список клонов')
	 			.setTimestamp()
	 			.setFooter({ text: `Запрошено ${interaction.member.displayName} [во время]` });
	 		 for (let clone of db.data.clones) {
	 			 embed.addField(clone.name, `Количество сообщений: \`${clone.messages.length}\`
	 Создатель: <@${clone.authorId}>`, true);
	 		 }
	 		 interaction.reply({ embeds: [embed] })
			break;
			case 'обновить_аватар':

				for (let clone of db.data.clones) {
					 if (clone.authorId == interaction.member.id) {
						 clone.avatar = interaction.member.avatar;
						 await db.write();
						 interaction.reply('Аватарка обновлена успешно у клона!');
						 cloneFound = true
					 }
				}
				if (!cloneFound)
					interaction.reply('Вы не создали клона! Создайте его через `/клон создать`.')
				break;
			case 'создать_сценарий':

				for (let clone of db.data.clones) {
		 			 if (clone.authorId == interaction.member.id) {
		 				 cloneFound = true;
		 				 if (!clone.scenarios)
		 						clone.scenarios = [];
		 		 		 clone.scenarios = clone.scenarios.concat({
		 					 q: interaction.options.getString('вопрос'),
		 					 a: interaction.options.getString('ответ')
		 				 });
		 				 await db.write();
		 				 await interaction.reply('Сценарий создан!')
		 			 }
				}
				if (!cloneFound)
		 		 	await interaction.reply('Вы не создали клона! Создайте его через `/клон создать`.')
				break;
			case 'удалить_сценарий':
	 		 for (let clone of db.data.clones) {
	 			 if (clone.authorId == interaction.member.id) {
	 				 cloneFound = true;
	 				 if (!clone.scenarios)
	 						clone.scenarios = [];
	 					if (!(clone.scenarios.length > 0))
	 						return await interaction.reply({ content: 'У Вас нет сценариев! Чтобы его создать, используйте команду `/клон создать_сценарий`.', ephemeral: true })
	 					console.log(clone.scenarios);
	 					let row = new MessageActionRow();
	 					const embed = new MessageEmbed()
	 						.setColor('#ffd000')
	 						.setTitle('Список сценариев');
	 					clone.scenarios.forEach((scenario, index) => {
	 						row.addComponents(
	 							new MessageButton()
	 								.setCustomId(index + '')
	 								.setLabel(`№${index + 1}`)
	 								.setStyle('PRIMARY'),
	 						)
	 						embed.addField(`${index + 1}. ${scenario.q}`, scenario.a, true)
	 					});
	 					//console.log()
	 					if (clone.scenarios.length > 5) {
	 						if (interaction.options.getInteger('номер') == null)
	 							return await interaction.reply({ content: 'У Вас более 5 сценариев, поэтому введите в параметр «номер» номер сценария. Номеры сценариев:', embeds: [embed] })
	 						else {
	 							const row = new MessageActionRow()
	 								.addComponents(
	 									new MessageButton()
	 										.setCustomId('yes')
	 										.setLabel('☑️')
	 										.setStyle('DANGER'),
	 									new MessageButton()
	 										.setCustomId('no')
	 										.setLabel('❎')
	 										.setStyle('SUCCESS'),
	 								);
	 							interaction.reply({ content: `Вы уверены, что хотите безвозвратно удалить сценарий №${interaction.options.getInteger('номер')}?`, components: [row], embeds: [] })
	 							const collector = interaction.channel.createMessageComponentCollector({ filter: i => i.user.id === interaction.member.id, time: 30000 });
	 							collector.on('collect', async i => {
	 								if (i.customId == 'yes') {
	 									clone.scenarios.splice(interaction.options.getInteger('номер') - 1, 1);
	 									await db.write();
	 									i.update({ content: 'Сценарий успешно удалён.', components: [] })
	 								} else
	 									await interaction.deleteReply();
	 							})
	 						}
	 					} else {
	 						interaction.reply({ content: 'Выберите сценарий:', components: [row], embeds: [embed] });
	 						const collector = interaction.channel.createMessageComponentCollector({ filter: i => i.user.id === interaction.member.id, time: 30000 });
	 						let selected = null;
	 						collector.on('collect', async i => {
	 							if (selected == null) {
	 								selected = +i.customId;
	 								const row2 = new MessageActionRow()
	 						 			.addComponents(
	 						 				new MessageButton()
	 						 					.setCustomId('yes')
	 						 					.setLabel('☑️')
	 						 					.setStyle('DANGER'),
	 						 				new MessageButton()
	 						 					.setCustomId('no')
	 						 					.setLabel('❎')
	 						 					.setStyle('SUCCESS'),
	 						 			);
	 								i.update({ content: `Вы уверены, что хотите безвозвратно удалить сценарий №${selected + 1}?`, components: [row2], embeds: [] })
	 							} else {
	 								if (i.customId == 'yes') {
	 									clone.scenarios.splice(selected, 1);
	 									await db.write();
	 									i.update({ content: 'Сценарий успешно удалён.', components: [] })
	 								} else
	 									await interaction.deleteReply();
	 							}
	 						});
	 					}
	 			 }
	 		 }
	 		 if (!cloneFound)
	 		 	await interaction.reply('Вы не создали клона! Создайте его через `/клон создать`.');
			break;
		}
	},
};
