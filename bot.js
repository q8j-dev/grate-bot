const CorvyBot = require('./corvy-sdk');
const axios = require('axios');

async function externalGrateScore(username) {
  return Math.floor(Math.random() * 101);
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function evaluateExpression(expr) {
  expr = expr.replace(/×/g, '*')
           .replace(/÷/g, '/')
           .replace(/(\d)x(\d)/g, '$1*$2')
           .replace(/x/g, '*');

  expr = expr.replace(/\^/g, '**');
  
  expr = expr.replace(/sin\(([^)]+)deg\)/g, (match, angle) => `Math.sin(${angle}*Math.PI/180)`);
  expr = expr.replace(/cos\(([^)]+)deg\)/g, (match, angle) => `Math.cos(${angle}*Math.PI/180)`);
  expr = expr.replace(/tan\(([^)]+)deg\)/g, (match, angle) => `Math.tan(${angle}*Math.PI/180)`);
  
  expr = expr.replace(/sin\(/g, 'Math.sin(');
  expr = expr.replace(/cos\(/g, 'Math.cos(');
  expr = expr.replace(/tan\(/g, 'Math.tan(');
  
  expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');
  expr = expr.replace(/abs\(/g, 'Math.abs(');
  expr = expr.replace(/log\(/g, 'Math.log10(');
  expr = expr.replace(/ln\(/g, 'Math.log(');
  
  expr = expr.replace(/\bpi\b/gi, 'Math.PI');
  expr = expr.replace(/\be\b/g, 'Math.E');
  
  if (/[a-zA-Z]/.test(expr.replace(/Math\.[a-zA-Z]+/g, '').replace(/Math\.PI|Math\.E/g, ''))) {
    throw new Error('Invalid characters in expression');
  }
  
  try {
    const result = new Function('return ' + expr)();
    
    if (!isFinite(result)) {
      throw new Error('Result is infinity or not a number');
    }
    
    return result;
  } catch (error) {
    throw new Error('Invalid expression');
  }
}

const config = {
  apiToken: "corvyscZlGcfDePWfn62pujEUkJvSw6/44tRCnt1xgoQURuWrM=",
  apiBaseUrl: "https://corvy.chat/api/v1",

  commands: [
    {
      prefix: "!hi",
      handler: function (message) {
        return `Hey ${message.user.username}! 👋`;
      },
    },
    {
      prefix: "!help",
      handler: function (message) {
        const helpPages = [
          {
            title: "Basic Commands",
            imageUrl: "https://files.catbox.moe/cgjjr0.png",
            commands: [
              "!hi - Greet the bot",
              "!help [page] - Show help pages (1-3)",
              "!say [text] - Make the bot say something",
              "!ping - Test bot latency",
              "!uptime - Show how long I've been running",
              "!flockinfo - Get details about the current flock"
            ]
          },
          {
            title: "Fun & Games",
            imageUrl: "https://files.catbox.moe/79kd3m.png",
            commands: [
              "!gratecheck - Find out how Grate you are",
              "!joke - Tell a dad joke",
              "!fact - Get a random fact",
              "!coinflip - Flip a coin"
            ]
          },
          {
            title: "Other Commands",
            imageUrl: "https://files.catbox.moe/w34lyu.png",
            commands: [
              "!calculate [expression] - Calculate math expressions",
              "!weather [city-name] - Get current weather"
            ]
          }
        ];
        
        let pageNum = 1;
        
        if (message.content.toLowerCase().startsWith("!help ")) {
          const requestedPage = parseInt(message.content.slice(6).trim());
          if (!isNaN(requestedPage) && requestedPage >= 1 && requestedPage <= helpPages.length) {
            pageNum = requestedPage;
          }
        }
        
        const page = helpPages[pageNum - 1];
        
        // Return the image URL instead of text content
        return page.imageUrl;
      },
    },
    {
      prefix: "!gratecheck",
      handler: async (m) => {
        const u = m.user.username;
        const s = await externalGrateScore(u);

        if (s >= 75) {
          return randomPick([
            `🧀 You're extra sharp today, ${u}! The corvuses are applauding.`,
            `🧀👑 The Cheese Throne awaits, mighty ${u}. Long may you reign.`,
            `🐦‍⬛ A parliament of corvuses chants your name in the Gratest celebration!`
          ]);
        }

        if (s >= 40) {
          return randomPick([
            `🧀 You're... moderately Grate, ${u}.`,
            `🐦‍⬛ A passing corvus glances at you with mild approval.`,
            `🧀🪶 A single black feather drifts your way. A sign? Perhaps.`
          ]);
        }

        return randomPick([
          `🧀💔 The corvuses cawed... and then flew away. You're not very Grate today.`,
          `🧀🔇 No corvi dared to squawk. It's not your day.`,
          `🧀🥀 Even the mold rejected you, ${u}. Ouch.`
        ]);
      }
    },
    {
      prefix: "!say",
      handler: function (message) {
        if (message.content.startsWith("!say ")) {
          const content = message.content.slice(5).trim();
          if (!content) {
            return "Please provide something for me to say! Example: !say Hello world";
          }
          return content;
        } else {
          return "The !say command must be at the beginning of your message. Example: !say Hello world";
        }
      },
    },
    {
      prefix: "!ping",
      handler: async function () {
        const start = Date.now();
        await new Promise(resolve => setTimeout(resolve, 10));
        const end = Date.now();
        return `Pong! ${end - start}ms`;
      }
    },
    {
      prefix: "!uptime",
      handler: function () {
        const seconds = Math.floor(process.uptime());
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `Uptime: ${hours}h ${minutes}m ${secs}s`;
      },
    },
    {
      prefix: "!weather",
      handler: async function (message) {
        const args = message.content.split(" ").slice(1);
        if (args.length === 0) {
          return "Usage: !weather [city-name]";
        }
        const city = args.join(" ");

        try {
          const geoResp = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
          const loc = geoResp.data.results?.[0];
          if (!loc) return `Could not find location: ${city}`;

          const weatherResp = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true`);
          const w = weatherResp.data.current_weather;

          const celsius = w.temperature;
          const fahrenheit = (celsius * 9 / 5 + 32).toFixed(1);

          return `Weather for ${loc.name}, ${loc.country}: ${celsius}°C / ${fahrenheit}°F | ${w.windspeed} km/h winds`;
        } catch (e) {
          return `Error fetching weather: ${e.response?.data?.reason || e.message}`;
        }
      }
    },
    {
      prefix: "!joke",
      handler: async function () {
        try {
          const response = await axios.get('https://icanhazdadjoke.com/', {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'CorvyBot (https://corvy.chat)'
            }
          });
          
          return response.data.joke;
        } catch (e) {
          return `Failed to fetch a joke: ${e.message}`;
        }
      }
    },
    {
      prefix: "!fact",
      handler: async function () {
        try {
          const response = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random', {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'CorvyBot (https://corvy.chat)'
            },
            params: {
              language: 'en'
            },
            timeout: 5000
          });
          
          return `📚 ${response.data.text}`;
        } catch (e) {
          const fallbackFacts = [
            "A group of flamingos is called a 'flamboyance'.",
            "Octopuses have three hearts.",
            "The shortest war in history was between Britain and Zanzibar in 1896. Zanzibar surrendered after 38 minutes.",
            "A day on Venus is longer than a year on Venus.",
            "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat."
          ];
          
          console.error(`Fact API error: ${e.message}`);
          
          return `📚 ${randomPick(fallbackFacts)} (Fact API unavailable)`;
        }
      }
    },
    {
      prefix: "!calculate",
      handler: function (message) {
        try {
          const input = message.content.slice(11).trim();
          
          if (!input) {
            return "📊 Usage: !calculate [expression] - Example: !calculate 2 * (3 + 4) or !calculate sin(45 deg)";
          }
          
          if (input.length > 200) {
            return "📊 Expression too long. Please keep it under 200 characters.";
          }
          
          const result = evaluateExpression(input);
          const formattedResult = (Math.abs(result) < 0.0001 && result !== 0) 
            ? result.toExponential(6) 
            : Number(result.toFixed(8)).toString();
          
          return `📊 ${input} = ${formattedResult}`;
        } catch (error) {
          return `📊 Error: ${error.message}. Try a different expression.`;
        }
      }
    },
    {
      prefix: "!coinflip",
      handler: function () {
        return Math.random() < 0.5 ? "Heads" : "Tails";
      }
    },
    {
      prefix: "!flockinfo",
      handler: async function (message) {
        try {
          // Get the current flock ID from the message
          const flockId = message.flock_id;
          
          if (!flockId) {
            return "Error: Couldn't determine the current flock.";
          }
          
          // Use the Corvy API to get flock details
          const flockData = await this.apiRequest(`/flocks/${flockId}`, 'GET');
          
          if (!flockData || !flockData.success) {
            return "Error: Failed to fetch flock information.";
          }
          
          const flock = flockData.flock;
          
          // Format the response with flock details
          return `🐦‍⬛ Flock Information 🐦‍⬛\n` +
                 `Name: ${flock.name}\n` +
                 `ID: ${flock.id}\n` +
                 `Members: ${flock.members_count}\n` +
                 `Nests: ${flock.nests_count}\n` +
                 `Created: ${new Date(flock.created_at).toLocaleString()}`;
          
        } catch (error) {
          console.error("Error in flockinfo command:", error);
          return `Error fetching flock information: ${error.message}`;
        }
      }
    }
  ]
};

// Add apiRequest method to the CorvyBot prototype if it doesn't exist
CorvyBot.prototype.apiRequest = async function(endpoint, method = 'GET', data = null) {
  try {
    const url = `${this.config.apiBaseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    
    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.data = data;
    }
    
    const response = await axios(url, options);
    return response.data;
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    throw error;
  }
};

const bot = new CorvyBot(config);

bot.handleCommand = function (message) {
  const commandMatch = this.config.commands.find(command => 
    message.content.toLowerCase().startsWith(command.prefix)
  );

  if (commandMatch) {
    const responseContent = commandMatch.handler.call(this, message);

    Promise.resolve(responseContent).then(result => {
      if (typeof result === 'string') {
        this.sendResponse(message.flock_id, message.nest_id, result);
      }
    }).catch(err => {
      this.sendResponse(message.flock_id, message.nest_id, `Command error: ${err.message}`);
    });
  }
};

bot.start();