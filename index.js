const { 
    Client, 
    GatewayIntentBits, 
    PermissionsBitField, 
    Partials 
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    // Command: !resetserver
    if (message.content === "!resetserver") {
        // Check if user has Administrator
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("You must have **Administrator** permission to run this.");
        }

        // Check if bot has Administrator
        if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("I need **Administrator** permission to do that.");
        }

        // Ask for confirmation
        const confirmMsg = await message.reply(
            "⚠️ This will **delete every channel** in this server.\n" +
            "Type `CONFIRM` within 30 seconds to continue, or anything else to cancel."
        );

        // Wait for user response
        const filter = (m) => m.author.id === message.author.id;
        try {
            const collected = await message.channel.awaitMessages({
                filter,
                max: 1,
                time: 30000,
                errors: ["time"]
            });

            const reply = collected.first();
            if (reply.content !== "CONFIRM") {
                return message.channel.send("❌ Reset cancelled.");
            }
        } catch (err) {
            return message.channel.send("⏰ No response in time. Reset cancelled.");
        }

        // Start reset
        await message.channel.send("🔥 Reset confirmed. Deleting channels...");

        // Store guild reference
        const guild = message.guild;

        // Delete all channels
        for (const [id, channel] of guild.channels.cache) {
            try {
                await channel.delete("Server reset command executed");
            } catch (err) {
                console.log(`Failed to delete channel ${channel.id}:`, err.message);
            }
        }

        // Create new public channel
        try {
            const newChannel = await guild.channels.create({
                name: "welcome",
                type: 0, // GuildText
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel]
                    }
                ]
            });

            await newChannel.send("@everyone Server has been reset.");
        } catch (err) {
            console.log("Failed to create new channel:", err.message);
        }
    }
});

client.login("ENTER-YOUR-DISCORD-TOKEN");
