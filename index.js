const { Client, ButtonStyle, ButtonBuilder, GatewayIntentBits, ActivityType, EmbedBuilder, Events, ActionRowBuilder, Colors } = require("discord.js");
const config = require("./config");
const INTENTS = Object.values(GatewayIntentBits);
const db = require("croxydb");

const client = new Client({ intents: INTENTS });

client.on("ready", async () => {
    client.user.setActivity("Aboneleri", { type: ActivityType.Watching });
    console.log("Durum güncellendi.");
});

client.on(Events.MessageCreate, (msg) => {
	if (msg.author.bot) return;
	if (!msg.guild) return;
	if (msg.channel.id != config.abonekanal) return;
	if (msg.member.roles.cache.has(config.abonerol)) {
		if (!msg.member.roles.cache.has(config.yetkili)) return msg.delete();
	}
	if (msg.attachments.size < 1) return
	const falseembed = new EmbedBuilder()
	.setColor(Colors.Blue)
	.setTitle("Beklemedesiniz!")
	.setDescription('Abone yetkilileri en kısa sürede sizinle ilgileneceklerdir, ' + msg.author.toString() + "!")
	const add = new ButtonBuilder()
        .setCustomId('rolver')
        .setLabel('Onayla')
        .setStyle(ButtonStyle.Success);
	const refuse = new ButtonBuilder()
        .setCustomId('refuse')
        .setLabel('Reddet')
        .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder()
        .addComponents(add, refuse);

    msg.reply({
        embeds: [falseembed],
        components: [row],
    }).then((sentmsg) => {
		db.set("abonever" + sentmsg.id, msg.author.id)
	})
})

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isButton()) return;
	if (!interaction.member.roles.cache.has(config.yetkili)) return;
	if (interaction.customId === 'rolver') {
		try {
			const memberfetch = db.fetch("abonever" + interaction.message.id)
			const member = interaction.guild.members.cache.get(memberfetch)
			member.roles.add(config.abonerol)
			const logchannel = interaction.guild.channels.cache.get(config.log)
			const falseembed = new EmbedBuilder()
			.setColor(Colors.Green)
			.setTitle("Onaylandı!")
			.setDescription("Abone rol işlemi onaylandı ve rolünüz verildi!")
			interaction.message.edit({ embeds: [falseembed], components: [] })
			const timestamp = Date.now();
			const timestampInSeconds = Math.floor(timestamp / 1000);
			const logembed = new EmbedBuilder()
			.setColor(Colors.Green)
			.setTitle("Abone Rol Verildi!")
			.setDescription("`"+ member.user.tag + "` kullanıcısı `(" + member.user.id + ")`" + `, <t:${timestampInSeconds}:R>, ` + "`" + interaction.user.tag +"` yetkilisinden `(" + interaction.user.id + ")` abone rol teslim aldı.")
			const al = new ButtonBuilder()
			.setCustomId('gerial')
			.setLabel('Geri Al')
			.setStyle(ButtonStyle.Danger);
			const row = new ActionRowBuilder()
			.addComponents(al);
			logchannel.send({ embeds: [logembed], components: [row]})
			.then((sentmsg) => {
				db.set("aboneal" + sentmsg.id, member.user.id)
			})
		} catch (err) {
			console.log(err.message)
		}
	}
	if (interaction.customId === 'refuse') {
		try {
			const memberfetch = db.fetch("abonever" + interaction.message.id)
			const member = interaction.guild.members.cache.get(memberfetch)
			const logchannel = interaction.guild.channels.cache.get(config.log)
			const falseembed = new EmbedBuilder()
			.setColor(Colors.Red)
			.setTitle("Reddedildi!")
			.setDescription("Abone rol işlemi reddedildi. Lütfen tüm gereksinimleri karşıladığınızı kontrol edip tekrar deneyiniz.")
			interaction.message.edit({ embeds: [falseembed], components: [] })
			const timestamp = Date.now();
			const timestampInSeconds = Math.floor(timestamp / 1000);
			const logembed = new EmbedBuilder()
			.setColor(Colors.Red)
			.setTitle("Abone Rol İşlemi Reddedildi!")
			.setDescription("`"+ member.user.tag + "` kullanıcısının `(" + member.user.id + ")`" + `, <t:${timestampInSeconds}:R>, ` + "`" + interaction.user.tag +"` yetkilisi tarafından `(" + interaction.user.id + ")` abone rol işlemi reddedilmiştir.")
			logchannel.send({ embeds: [logembed], components: []})
		} catch (err) {
			console.log(err.message)
		}
	}
	if (interaction.customId === 'gerial') {
		try {
			const memberfetch = db.fetch("aboneal" + interaction.message.id)
			const member = interaction.guild.members.cache.get(memberfetch)
			member.roles.remove(config.abonerol)
			const logchannel = interaction.guild.channels.cache.get(config.log)
			const timestamp = Date.now();
			const timestampInSeconds = Math.floor(timestamp / 1000);
			const falseembed = new EmbedBuilder()
			.setColor(Colors.Red)
			.setTitle("Geri Alındı!")
			.setDescription("`"+ member.user.tag + "` kullanıcısının `(" + member.user.id + ")` almış olduğu abone rol" + `, <t:${timestampInSeconds}:R> ` + "`" + interaction.user.tag +"` yetkilisi tarafından `(" + interaction.user.id + ")` geri alındı.")
			interaction.message.edit({ embeds: [falseembed], components: [] })
		} catch (err) {
			console.log(err.message)
		}
	}
});

client.on(Events.MessageDelete, (message) => {
	if (db.has("abonever" + message.id)) {
		db.delete("abonever" + message.id)
	}
	if (db.has("aboneal" + message.id)) {
        db.delete("aboneal" + message.id)
    }
})

client.login(config.token);
