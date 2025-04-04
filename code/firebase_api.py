import json
import requests
import logging
from config import FIREBASE_URL 

class FirebaseAPI:
    """
    Class to interact with Firebase Realtime Database via REST API.
    """

    def _post(self, endpoint, data):
        """
            Internal method to make a POST request to Firebase.
        """
        try:
            response = requests.post(
                f"{FIREBASE_URL}/{endpoint}.json",
                json=data, 
                timeout=10
            )
            response.raise_for_status()

            logging.info(f"Data successfully posted to {endpoint}: {response.json()}")
            return response.json()
        
        except requests.exceptions.Timeout:
            logging.error(f"Timeout while trying to reach {endpoint}")
        except requests.exceptions.ConnectionError:
            logging.error(f"Connection issue while reaching {endpoint}")
        except requests.RequestException as e:
            logging.error(f"Error during API request: {e}")
        return None
    

    def _get(self, endpoint):
        """
        Internal method to make a GET request to Firebase.
        """
        try:
            response = requests.get(
                f"{FIREBASE_URL}/{endpoint}.json", 
                timeout=10
            )
            response.raise_for_status()
            return response.json()
        
        except requests.exceptions.Timeout:
            logging.error(f"Timeout while trying to reach {endpoint}")
        except requests.exceptions.ConnectionError:
            logging.error(f"Connection issue while reaching {endpoint}")
        except requests.RequestException as e:
            logging.error(f"Error during API request: {e}")
        return None


    def save_accelerometer_data(self, accel_data):
        """
        Saves a new record to Firebase at "/accelerometer_data".
        """
        logging.debug(f"data {accel_data}")
        return self._post("accelerometer_data", accel_data)
      

    def get_all_accelerometer_data(self):
        """
        Retrieves all records stored in "/accelerometer_data".
        """
        return self._get("accelerometer_data")

    def get_data_by_id(self, data_id):
        """
        Retrieves a specific record by ID.
        """
        return self._get(f"accelerometer_data/{data_id}")
    

    def save_extraction_freq(self, extract_freq):
        """
        Saves a new record to Firebase at "/extraction_freq".
        """
        return self._post("extraction_freq", extract_freq)
    
    def get_extraction_freq(self):
        """
        Retrieves all records stored in "/extraction_freq".
        """
        return self._get("extraction_freq")


if __name__ == "__main__":
    firebase_api = FirebaseAPI()
    
    
    print(firebase_api.get_extraction_freq())
    #print(firebase_api.get_data_by_id("-OMbsJLYHKeL0w3zZL_W"))
