const APP_ID = "1479506068185944226"; // Get this from Discord Portal
const GUILD_ID = "878674783972261918"; // Optional: Use for instant updates in one server
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

async function registerCommands() {
  const url = GUILD_ID 
    ? `https://discord.com/api/v10/applications/${APP_ID}/guilds/${GUILD_ID}/commands`
    : `https://discord.com/api/v10/applications/${APP_ID}/commands`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        name: 'session',
        description: 'Show upcoming sessions or search for one',
        options: [
          {
            name: 'world-date',
            description: 'Search for a session by world or date',
            type: 3, // STRING
            required: false,
            autocomplete: true,
          }
        ]
      },
      {
        name: 'character',
        description: 'Search for a character by name',
        options: [
          {
            name: 'name',
            description: 'The name of the character to find',
            type: 3, // STRING
            required: true,
            autocomplete: true,
          }
        ]
      },
      {
        name: 'world',
        description: 'Search for a world by name or list all worlds',
        options: [
          {
            name: 'name',
            description: 'The name of the world to find',
            type: 3, // STRING
            required: false,
            autocomplete: true,
          }
        ]
      },
      {
        name: 'schedule',
        description: 'Show upcoming availability summary for the next 2 weeks',
      },
      {
        name: 'roll',
        description: 'Roll dice (default d100)',
        options: [
          {
            name: 'sides',
            description: 'Number of sides on the die (default 100)',
            type: 4, // INTEGER
            required: false,
          }
        ]
      },
      {
        name: 'bets',
        description: 'View your active Deathroll bets and turn status',
      },
      {
        name: 'deathroll',
        description: 'Issue a Deathroll gambling wager to an opponent or open challenge',
        options: [
          {
            name: 'character',
            description: 'Your character name',
            type: 3, // STRING
            required: true,
            autocomplete: true,
          },
          {
            name: 'wager',
            description: 'Gold Piece (GP) wager amount',
            type: 4, // INTEGER
            required: true,
          },
          {
            name: 'opponent',
            description: 'Target character name (leave empty for open challenge)',
            type: 3, // STRING
            required: false,
            autocomplete: true,
          },
          {
            name: 'max_roll',
            description: 'Starting max roll (default 100)',
            type: 4, // INTEGER
            required: false,
          }
        ]
      },
      {
        name: 'market',
        description: 'View active items and services on the Black Void market',
        options: [
          {
            name: 'query',
            description: 'Search filter for market listings',
            type: 3, // STRING
            required: false,
          }
        ]
      },
      {
        name: 'my-listings',
        description: 'View your active market listings and won auctions',
      },
      {
        name: 'ledger',
        description: 'View unclaimed gold, items, quests, and cuts across your characters',
      },
      {
        name: 'nethys',
        description: 'Lookup an item on Archives of Nethys (PF2e)',
        options: [
          {
            name: 'item_name',
            description: 'Item name to search on AoN',
            type: 3, // STRING
            required: true,
          }
        ]
      }
    ]),
  });

  if (response.ok) {
    console.log(`Successfully registered Discord commands (${GUILD_ID ? 'Guild scope' : 'Global scope'})!`);
    // Clear opposite scope to remove duplicates
    if (GUILD_ID) {
      console.log('Clearing old global commands to eliminate duplicates...');
      await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([]),
      });
      console.log('Cleaned up global duplicates.');
    }
  } else {
    console.error('Error registering command:', await response.text());
  }
}

registerCommands();
