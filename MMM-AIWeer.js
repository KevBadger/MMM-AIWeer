Module.register("MMM-AIWeer", {
  defaults: {
    apiKey: "", // Your OpenWeatherMap API key
    lat: 50.8503, // Brussels latitude (change to your location)
    lon: 4.3517, // Brussels longitude (change to your location)
    units: "metric", // "metric" for Celsius, "imperial" for Fahrenheit
    updateInterval: 600000, // Update every 10 minutes
    daysToShow: 7, // Number of days to display
    iconSize: "medium" // "small", "medium", or "large"
  },

  start: function() {
    Log.info("Starting module: " + this.name);
    this.forecast = null;
    this.loaded = false;
    this.sendSocketNotification("GET_WEATHER", this.config);
    this.scheduleUpdate();
  },

  scheduleUpdate: function() {
    var self = this;
    setInterval(function() {
      self.sendSocketNotification("GET_WEATHER", self.config);
    }, this.config.updateInterval);
  },

  getDom: function() {
    var wrapper = document.createElement("div");
    wrapper.className = "weekly-forecast";

    if (!this.loaded) {
      wrapper.innerHTML = "Loading weather...";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    if (!this.forecast) {
      wrapper.innerHTML = "No weather data available";
      wrapper.className = "dimmed light small";
      return wrapper;
    }

    // Create header
    var header = document.createElement("header");
    header.className = "module-header";
    header.innerHTML = "Weekly Forecast";
    wrapper.appendChild(header);

    // Create forecast container
    var forecastContainer = document.createElement("div");
    forecastContainer.className = "forecast-container";

    // Display forecast for each day
    for (var i = 0; i < Math.min(this.config.daysToShow, this.forecast.length); i++) {
      var day = this.forecast[i];
      
      var dayElement = document.createElement("div");
      dayElement.className = "forecast-day";

      // Day name
      var dayName = document.createElement("div");
      dayName.className = "day-name";
      dayName.innerHTML = day.dayName;
      dayElement.appendChild(dayName);

      // Weather icon
      var iconElement = document.createElement("div");
      iconElement.className = "weather-icon " + this.config.iconSize;
      iconElement.innerHTML = this.getWeatherIcon(day.icon);
      dayElement.appendChild(iconElement);

      // Temperature range
      var tempElement = document.createElement("div");
      tempElement.className = "temperature";
      var maxTemp = Math.round(day.temp_max);
      var minTemp = Math.round(day.temp_min);
      tempElement.innerHTML = maxTemp + "° / " + minTemp + "°";
      dayElement.appendChild(tempElement);

      forecastContainer.appendChild(dayElement);
    }

    wrapper.appendChild(forecastContainer);
    return wrapper;
  },

  getWeatherIcon: function(iconCode) {
    // Map OpenWeatherMap icons to weather symbols
    const iconMap = {
      "01d": "☀️", // clear sky day
      "01n": "🌙", // clear sky night
      "02d": "🌤️", // few clouds day
      "02n": "☁️", // few clouds night
      "03d": "☁️", // scattered clouds
      "03n": "☁️",
      "04d": "☁️", // broken clouds
      "04n": "☁️",
      "09d": "🌧️", // shower rain
      "09n": "🌧️",
      "10d": "🌦️", // rain day
      "10n": "🌧️", // rain night
      "11d": "⛈️", // thunderstorm
      "11n": "⛈️",
      "13d": "❄️", // snow
      "13n": "❄️",
      "50d": "🌫️", // mist
      "50n": "🌫️"
    };

    return iconMap[iconCode] || "🌡️";
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "WEATHER_DATA") {
      this.forecast = payload;
      this.loaded = true;
      this.updateDom();
    } else if (notification === "WEATHER_ERROR") {
      Log.error("Weather error: " + payload);
      this.loaded = true;
      this.updateDom();
    }
  },

  getStyles: function() {
    return ["MMM-AIWeer.css"];
  }
});
