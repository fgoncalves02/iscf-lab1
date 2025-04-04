import logging 

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(filename)s - %(levelname)s - %(funcName)s() - %(message)s', handlers=[logging.StreamHandler()])

OPEN_W_API_KEY = "ed41fe90a7265ea26232228b1b893f9f"
OPEN_W_URL = "https://api.openweathermap.org/data/2.5"

CITY = "Lisbon"
UNITS = "metric"
LANGUAGE = "pt"

API_URL = "http://127.0.0.1:8000/"

FIREBASE_URL = "https://accel-2391d-default-rtdb.europe-west1.firebasedatabase.app"