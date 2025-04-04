import json
import requests
import logging
import pprint as pp
from config import OPEN_W_API_KEY, OPEN_W_URL, CITY, UNITS, LANGUAGE



class OpenWeatherAPI:
    """
        Class to interact with the OpenWeather API
        Responsible for making API requests
    """
    

    def _get(self, endpoint, params=None):
        """
            Internal method to make a GET request to the API
        """
        try:
            if params is None:
                params = {}
            params.update({
                "appid": OPEN_W_API_KEY,
                "units": UNITS,
                "lang": LANGUAGE
            })

            response = requests.get(
                f"{OPEN_W_URL}/{endpoint}", 
                params=params,
                timeout=10
            )
            response.raise_for_status()  #returns an HTTPError object if an error has occurred 

            api_response = response.json()
            logging.debug(f"API_RESPONSE: {api_response}")
            return api_response

        except requests.exceptions.Timeout:
            logging.error(f"***Error: Timeout while trying to reach {endpoint}***")
        except requests.exceptions.ConnectionError:
            logging.error(f"***Error: Connection issue while reaching {endpoint}***")
        except requests.RequestException as e:
            logging.error(f"***Error during API request: {e}***")
        return None


    def get_temperature(self):
        data = self._get("weather", {"q": CITY})
        logging.debug(f"data: {data}")
        if data:
            return  data["main"]["temp"]
        
        return None

    def get_weather(self):
        """
            Fetches current weather data for a given city
            Returns only key details like temperature, description, and humidity
        """
        data = self._get("weather", {"q": CITY})
        logging.debug(f"data: {data}")
        if data:
            return {
                "city": data.get("name"),
                "temperature": data["main"]["temp"],
                "humidity": data["main"]["humidity"],
                "weather": data["weather"][0]["description"],
                "wind_speed": data["wind"]["speed"]
            }
        return None

    def get_forecast(self, ):
        """
            Fetches weather forecast data for a given city
            Returns a simplified version with one forecast per day
        """
        data = self._get("forecast", {"q": CITY})
        logging.debug(f"data: {data}")
        if data:
            forecast_list = []
            added_dates = set()

            for forecast in data["list"]:
                date = forecast["dt_txt"].split(" ")[0]  # Extract only the date (YYYY-MM-DD)
                if date not in added_dates:  # Avoid duplicate dates
                    forecast_list.append({
                        "date": date,
                        "temperature": forecast["main"]["temp"],
                        "weather": forecast["weather"][0]["description"]
                    })
                    added_dates.add(date)  # Mark date as added

            return forecast_list
        return None

if __name__ == "__main__":
    api = OpenWeatherAPI()
    pp.pprint(api.get_temperature())
    pp.pprint(api.get_weather())  # Current weather
    pp.pprint(api.get_forecast())  # Weather forecast