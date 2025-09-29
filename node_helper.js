const NodeHelper = require("node_helper");
const https = require("https");

module.exports = NodeHelper.create({
  start: function() {
    console.log("Starting node helper for: " + this.name);
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "GET_WEATHER") {
      this.getWeatherData(payload);
    }
  },

  getWeatherData: function(config) {
    var self = this;
    
    if (!config.apiKey) {
      console.error("No API key provided");
      self.sendSocketNotification("WEATHER_ERROR", "No API key");
      return;
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${config.lat}&lon=${config.lon}&cnt=${config.daysToShow}&units=${config.units}&appid=${config.apiKey}`;

    https.get(url, (resp) => {
      let data = '';

      resp.on('data', (chunk) => {
        data += chunk;
      });

      resp.on('end', () => {
        try {
          const weatherData = JSON.parse(data);
          
          if (weatherData.cod === "200") {
            const forecast = self.processWeatherData(weatherData);
            self.sendSocketNotification("WEATHER_DATA", forecast);
          } else {
            console.error("Weather API error:", weatherData.message);
            self.sendSocketNotification("WEATHER_ERROR", weatherData.message);
          }
        } catch (e) {
          console.error("Error parsing weather data:", e);
          self.sendSocketNotification("WEATHER_ERROR", "Parse error");
        }
      });

    }).on("error", (err) => {
      console.error("Error fetching weather:", err.message);
      self.sendSocketNotification("WEATHER_ERROR", err.message);
    });
  },

  processWeatherData: function(data) {
    const forecast = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    data.list.forEach((day, index) => {
      const date = new Date(day.dt * 1000);
      const dayName = index === 0 ? "Today" : days[date.getDay()];

      forecast.push({
        dayName: dayName,
        temp_max: day.temp.max,
        temp_min: day.temp.min,
        icon: day.weather[0].icon,
        description: day.weather[0].description
      });
    });

    return forecast;
  }
});
