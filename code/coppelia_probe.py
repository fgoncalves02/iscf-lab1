import sim
import time 
import requests
import logging
import threading

from openweather_api import OpenWeatherAPI
from firebase_api import FirebaseAPI

from config import API_URL



# Global configuration variables
clientID = -1

# Helper function provided by the teaching staff
def get_data_from_simulation(id):
    """Connects to the simulation and gets a float signal value

    Parameters
    ----------
    id : str
        The signal id in CoppeliaSim

    Returns
    -------
    data : float
        The float value retrieved from the simulation. None if retrieval fails.
    """
    if clientID!=-1:
        res, data = sim.simxGetFloatSignal(clientID, id, sim.simx_opmode_blocking)
        if res==sim.simx_return_ok:
            return data
    return None



class DataCollection():
    def __init__(self):

        self.open_weather = OpenWeatherAPI()
        self.firebase = FirebaseAPI()
        self.extraction_freq = None
        self.emergency_stop = None
        self.accel_data = {
                        "x": None,
                        "y": None,
                        "z": None,
                        "timestamp": None,
                        }
        
        self.listener_thread = threading.Thread(target=self.firebase_monitor, daemon=True)
        self.listener_thread.start()
        
        
    def send_data(self, data):
        """
             Sends data to API using an HTTP POST request.
        """
        try:
            logging.debug(f"Sending data: {data}")
            
            response = requests.post(f"{API_URL}/data/", json=data)

            if response.status_code == 200:
                logging.debug("Data sent successfully.")
            else:
                logging.error(f"Error sending data: {response.status_code}, Response: {response.text}")
        except Exception as e:
            logging.error(f"Failed to send data: {e}")


    def firebase_monitor(self):
        """
        Monitora o Firebase para atualizar os valores de extraction_freq e emergency_stop.
        Executa uma consulta a cada 5 segundos.
        """
        while True:
            try:
                freq_response = requests.get(f"{API_URL}/extraction_freq/")
                if freq_response.status_code == 200:
                    self.extraction_freq = freq_response.json()
                    logging.debug(f"Updated extraction frequency: {self.extraction_freq}")
                else:
                    logging.error(f"Error getting extraction frequency: {freq_response.status_code}, Response: {freq_response.text}")
                
                emergency_response = requests.get(f"{API_URL}/emergency_stop/")
                if emergency_response.status_code == 200:
                    self.emergency_stop = emergency_response.json()
                    logging.debug(f"Updated emergency stop: {self.emergency_stop}")
                else:
                    logging.error(f"Error getting emergency stop: {emergency_response.status_code}, Response: {emergency_response.text}")

            except Exception as e:
                logging.error(f"Error during update: {e}")
            
            # Consulta a cada 5 segundos
            time.sleep(5)



    def run(self):
        
        while True:   

            #extraction_freq = self.firebase.get_extraction_freq()
            logging.debug(f"emergency_stop {self.emergency_stop}")
            if self.emergency_stop == 1:
                logging.warning("Emergency Stop activated. Pausing simulation.")
                try:
                    sim.simxPauseSimulation(clientID, sim.simx_opmode_blocking)
                    logging.info("-----------SIMULATION PAUSE-----------------")
                except Exception as pause_error:
                    logging.error(f"Error pausing simulation: {pause_error}")

                while self.emergency_stop == 1:
                    logging.debug("******************LOOOP INFINITO")
                    time.sleep(1)

                try:
                    sim.simxStartSimulation(clientID, sim.simx_opmode_blocking)
                    logging.info("-----------SIMULATION RESUME-----------------")
                except Exception as start_error:
                    logging.error(f"Error starting simulation: {start_error}")


            x = get_data_from_simulation("accelX")            
            y = get_data_from_simulation("accelY")
            z = get_data_from_simulation("accelZ")

            if x is None or y is None or z is None:
                logging.warning("Simulation is not running. Please start the simulation in CoppeliaSim.")
            else:
                self.accel_data["x"] = x
                self.accel_data["y"] = y
                self.accel_data["z"] = z
                self.accel_data["timestamp"] = time.time()

                logging.info(f"Collected data: {self.accel_data}")

                # TODO Lab 1: Add the necessary code to send data to your API

                self.send_data(self.accel_data)
           
            #sleep_duration = extraction_freq if extraction_freq is not None else 1
            
            sleep_duration = self.extraction_freq if self.extraction_freq is not None else 1
            logging.info(f"Sleep Duration: {sleep_duration}")

            time.sleep(sleep_duration)


if __name__ == '__main__':
    sim.simxFinish(-1) # just in case, close all opened connections
    clientID=sim.simxStart('127.0.0.1',19997,True,True,5000,5) # Connect to CoppeliaSim
    if clientID!=-1:
        logging.info("Connected to CoppeliaSim successfully.")
        data_collection = DataCollection()
        data_collection.run()      
    else:
        logging.error("Failed to connect to CoppeliaSim. Exiting...")
        exit()
    
